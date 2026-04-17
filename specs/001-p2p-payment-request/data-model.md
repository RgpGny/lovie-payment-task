# Data Model — P2P Payment Request

**Source schema**: `supabase/migrations/0001_init.sql` (to be written in Stage 4).

## Tables

### `profiles`

| Column       | Type          | Constraints                                   |
|--------------|---------------|-----------------------------------------------|
| `id`         | `uuid`        | PK, FK → `auth.users(id) ON DELETE CASCADE`   |
| `email`      | `text`        | NOT NULL, UNIQUE                              |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()`                     |

**Purpose**: Provides a public-schema mirror of the `auth.users` row — needed because the `sender_id` foreign key and RLS policies must point at a visible table. The `handle_new_user()` trigger on `auth.users` inserts the profile automatically.

### `payment_requests`

| Column            | Type                 | Constraints                                                                                 |
|-------------------|----------------------|---------------------------------------------------------------------------------------------|
| `id`              | `uuid`               | PK, DEFAULT `gen_random_uuid()`                                                             |
| `share_link`      | `text`               | NOT NULL, UNIQUE                                                                            |
| `sender_id`       | `uuid`               | NOT NULL, FK → `profiles(id) ON DELETE CASCADE`                                             |
| `recipient_email` | `text`               | NOT NULL, CHECK `position('@' in recipient_email) > 1`                                      |
| `amount_cents`    | `integer`            | NOT NULL, CHECK `amount_cents > 0 AND amount_cents <= 99999999`                             |
| `note`            | `text`               | NULL allowed, CHECK `char_length(note) <= 200`                                              |
| `status`          | `request_status`     | NOT NULL, DEFAULT `'pending'`                                                               |
| `created_at`      | `timestamptz`        | NOT NULL, DEFAULT `now()`                                                                   |
| `expires_at`      | `timestamptz`        | NOT NULL, DEFAULT `now() + interval '7 days'`                                               |
| `paid_at`         | `timestamptz`        | NULL                                                                                        |
| `declined_at`     | `timestamptz`        | NULL                                                                                        |
| `cancelled_at`    | `timestamptz`        | NULL                                                                                        |

**Application invariants** (enforced by API layer, not DB):

- Exactly one of `paid_at / declined_at / cancelled_at` is non-NULL when `status != 'pending'`, and all are NULL when `status = 'pending'`.
- `sender.email != recipient_email` at INSERT time (checked by validator; DB does not enforce self-check on email equality to avoid joining during INSERT).

### Enum: `request_status`

```
pending | paid | declined | cancelled
```

(`expired` is **not** a stored value — expiration is a read-time predicate `now() >= expires_at AND status = 'pending'`.)

## Indexes

- `payment_requests_sender_idx` on `(sender_id)` — Outgoing dashboard tab.
- `payment_requests_recipient_idx` on `(recipient_email)` — Incoming dashboard tab, plus the RLS predicate.
- `payment_requests_share_idx` — covered by the UNIQUE constraint on `share_link`.

## Triggers

### `handle_new_user()` on `auth.users`

After any INSERT into `auth.users`, insert a matching row into `profiles` with `(id, email)`. `ON CONFLICT (id) DO NOTHING` makes the trigger idempotent against retries.

```sql
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;
```

## Views

### `public_requests`

Read-only projection of `payment_requests` for public share-link consumers. Joins to `profiles` to expose `sender_email` instead of the internal `sender_id`. Does NOT expose `paid_at / declined_at / cancelled_at` internal timestamps.

```sql
create view public_requests as
  select id, share_link, amount_cents, note, status, expires_at, created_at,
    (select email from profiles where id = sender_id) as sender_email,
    recipient_email
  from payment_requests;
grant select on public_requests to anon, authenticated;
```

## Row Level Security

| Table              | Policy                 | Command | Target          | USING / WITH CHECK                                                 |
|--------------------|------------------------|---------|------------------|--------------------------------------------------------------------|
| `profiles`         | `profiles_read`        | SELECT  | `authenticated` | `using (true)`                                                     |
| `profiles`         | `profiles_self_insert` | INSERT  | `authenticated` | `with check (id = auth.uid())`                                     |
| `payment_requests` | `pr_read_involved`     | SELECT  | `authenticated` | `using (sender_id = auth.uid() or recipient_email = auth.email())` |
| `payment_requests` | `pr_insert_sender`     | INSERT  | `authenticated` | `with check (sender_id = auth.uid())`                              |
| `payment_requests` | `pr_update_involved`   | UPDATE  | `authenticated` | `using (sender_id = auth.uid() or recipient_email = auth.email())` |

**RLS is enabled on both `profiles` and `payment_requests`.** The `anon` role has NO access to either raw table — only to the `public_requests` view.

## State Transitions

```text
                ┌──────────────┐
                │   pending    │  ← INSERT (sender, via API POST /api/requests)
                └──────┬───────┘
                       │
      ┌────────────────┼────────────────┬────────────────────┐
      │                │                │                    │
  recipient pay   recipient decline   sender cancel     7d elapsed
      ▼                ▼                ▼                    ▼
 ┌──────────┐    ┌──────────┐     ┌──────────┐         (read-time)
 │   paid   │    │ declined │     │cancelled │        status still
 └──────────┘    └──────────┘     └──────────┘        'pending' but
                                                      now() ≥ expires_at
                                                      → rendered as EXPIRED
                                                      → all transitions refused
```

Every transition (pay / decline / cancel) is issued as:

```sql
UPDATE payment_requests
   SET status = <target>, <terminal_at> = now()
 WHERE id = $1
   AND status = 'pending'
   AND expires_at > now()
   AND (<actor clause>);
```

- `actor clause` = `sender_id = auth.uid()` for cancel.
- `actor clause` = `recipient_email = auth.email()` for pay and decline.
- 0 rows affected ⇒ API 409.
- 1 row affected ⇒ API 200 with the updated row.
