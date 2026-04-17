-- 0001_init — PayRequest P2P payment request schema
-- Tables: profiles, payment_requests
-- Enum:   request_status
-- View:   public_requests (granted to anon)
-- RLS:    profiles + payment_requests (authenticated)
-- Trigger: handle_new_user on auth.users

create extension if not exists pgcrypto;

-- ─── profiles ──────────────────────────────────────────────────────────────

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ─── request_status enum ───────────────────────────────────────────────────

create type request_status as enum ('pending', 'paid', 'declined', 'cancelled');

-- ─── payment_requests ──────────────────────────────────────────────────────

create table payment_requests (
  id uuid primary key default gen_random_uuid(),
  share_link text not null unique,
  sender_id uuid not null references profiles(id) on delete cascade,
  recipient_email text not null check (position('@' in recipient_email) > 1),
  amount_cents integer not null check (amount_cents > 0 and amount_cents <= 99999999),
  note text check (note is null or char_length(note) <= 200),
  status request_status not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  paid_at timestamptz,
  declined_at timestamptz,
  cancelled_at timestamptz
);

create index payment_requests_sender_idx on payment_requests (sender_id);
create index payment_requests_recipient_idx on payment_requests (recipient_email);

-- ─── Row Level Security ────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table payment_requests enable row level security;

create policy profiles_read on profiles
  for select to authenticated using (true);

create policy profiles_self_insert on profiles
  for insert to authenticated with check (id = auth.uid());

create policy pr_read_involved on payment_requests
  for select to authenticated
  using (sender_id = auth.uid() or recipient_email = auth.email());

create policy pr_insert_sender on payment_requests
  for insert to authenticated with check (sender_id = auth.uid());

create policy pr_update_involved on payment_requests
  for update to authenticated
  using (sender_id = auth.uid() or recipient_email = auth.email());

-- ─── public share-link reads ───────────────────────────────────────────────
-- Anon share-link reads are served by the Next.js route /api/requests/share/[link]
-- using the service-role key (server-only) to project a safe subset of columns.
-- We intentionally avoid a SECURITY DEFINER view because Supabase advisors flag
-- it as a RLS bypass; the application-layer projection keeps the trust boundary
-- clear and leaves RLS as the single source of truth for authenticated reads.

-- ─── auto-create profile row for each auth user ────────────────────────────

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
