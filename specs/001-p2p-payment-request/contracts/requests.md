# Contract — `POST /api/requests` and `GET /api/requests`

## `POST /api/requests` — Create a payment request

**Auth**: Required (authenticated session cookie).

**Request body** (validated by `createRequestSchema` in `src/lib/validators.ts`):

```ts
{
  recipient_email: string,   // trimmed, lowercased, valid email, ≠ caller's email
  amount_cents:    number,   // integer, 1 ≤ amount_cents ≤ 99_999_999
  note:            string | null  // ≤ 200 chars, optional
}
```

**Behavior**:

1. Server re-parses the body against the Zod schema. Any failure → `400` with `{ error: "invalid", field: string, message: string }`.
2. Resolve `sender_id` from `auth.uid()`. Reject if `recipient_email == auth.email()` with `400 { error: "self_request" }`.
3. Generate `share_link = nanoid(21)`.
4. `INSERT INTO payment_requests (sender_id, recipient_email, amount_cents, note, share_link) VALUES (...) RETURNING *`.
5. Return `201 Created` with the inserted row shape (see `GET /api/requests/:id`).

**Responses**:

| Status | Body                                                         | When                                             |
|--------|--------------------------------------------------------------|--------------------------------------------------|
| 201    | `PaymentRequest`                                             | Success                                          |
| 400    | `{ error: "invalid", field, message }`                       | Zod validation failed                            |
| 400    | `{ error: "self_request" }`                                  | `recipient_email` equals `auth.email()`          |
| 401    | `{ error: "unauthenticated" }`                               | No session                                       |
| 500    | `{ error: "unknown" }`                                       | DB or server error                               |

---

## `GET /api/requests` — List the caller's requests

**Auth**: Required.

**Query params**:

- `direction` — `incoming | outgoing` (default: `incoming`).
- `status` — `pending | paid | declined | cancelled | expired | all` (default: `all`). `expired` is not a DB value; it is computed as `status = 'pending' AND expires_at <= now()`.
- `q` — optional free-text search; matches `ILIKE %q%` on `note` OR `recipient_email`.

**Behavior**: Select against `payment_requests` with filters; RLS ensures the rows returned belong to the caller. Order by `created_at DESC`. Attach a derived `is_expired` boolean and `effective_status` ∈ `pending | paid | declined | cancelled | expired` to each row.

**Responses**:

| Status | Body                                              | When                     |
|--------|---------------------------------------------------|--------------------------|
| 200    | `{ items: PaymentRequestView[] }`                 | Success (possibly empty) |
| 401    | `{ error: "unauthenticated" }`                    | No session               |
| 400    | `{ error: "invalid", field, message }`            | Bad query params         |
