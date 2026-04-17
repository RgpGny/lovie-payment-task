# Research — P2P Payment Request

**Date**: 2026-04-17
**Scope**: Resolve all technical unknowns before Phase 1 design.

---

## R-01 Authentication Method

**Decision**: Supabase email + password sign-in and sign-up, session cookies managed by `@supabase/ssr`.

**Rationale**: Assignment scope is one-day ship with two seeded test users (`alice@payrequest.test`, `bob@payrequest.test`). Email/password is the lowest-friction path that still produces real sessions and real `auth.email()` / `auth.uid()` values the RLS policies depend on.

**Alternatives considered**:

- *Magic links*: require a real SMTP integration or a hack to intercept the token — adds a moving part for no demo benefit.
- *Third-party OAuth (Google, GitHub)*: requires provider app setup and cannot be demonstrated offline.
- *Custom JWT*: reinvents what Supabase already gives us and bypasses the RLS integration.

---

## R-02 Authorization Boundary

**Decision**: Row Level Security on `payment_requests` is the authorization layer. Next.js middleware only redirects unauthenticated requests to `/login` (UX guard, not security).

**Policies**:

- `pr_read_involved`: `SELECT` allowed when `sender_id = auth.uid() OR recipient_email = auth.email()`.
- `pr_insert_sender`: `INSERT` allowed when `sender_id = auth.uid()`.
- `pr_update_involved`: `UPDATE` allowed when `sender_id = auth.uid() OR recipient_email = auth.email()`.
- The `public_requests` view is granted to `anon` — public share reads never touch the raw table.

**Rationale**: RLS means a stolen session cookie still can't read other users' requests, because Postgres itself enforces the rule. The app layer can have bugs; the DB layer won't.

**Alternatives considered**:

- *App-layer check in route handlers*: brittle — every new endpoint is a new place for a bug.
- *Service-role client on server + manual filter*: works but discards Supabase's killer feature.

---

## R-03 Race-Safe Status Transitions

**Decision**: Every terminal-state transition is a single guarded UPDATE:

```sql
UPDATE payment_requests
   SET status = <new>, <terminal_at> = now()
 WHERE id = $1
   AND status = 'pending'
   AND expires_at > now()
   AND (<actor-specific clause>)
 RETURNING *;
```

- `actor-specific clause` is `sender_id = auth.uid()` for cancel, and `recipient_email = auth.email()` for pay / decline.
- If the query affects 0 rows, the API responds `409 Conflict` with `{ error: "already_resolved" | "expired" }`.
- If it affects 1 row, the API responds `200 OK` with the updated record.

**Rationale**: Postgres guarantees the UPDATE is atomic; no read-then-write window, no need for application locks or advisory locks. Two concurrent pay attempts can't both succeed because only one matches the `status='pending'` predicate.

**Alternatives considered**:

- *SELECT ... FOR UPDATE then UPDATE*: two round-trips, same guarantee, more code.
- *Serializable transaction*: correct but heavy for the single-statement case.
- *Advisory lock*: introduces a second source of truth.

---

## R-04 Expiration Model

**Decision**: Store `expires_at timestamptz` computed as `created_at + interval '7 days'` at INSERT. No row is ever "marked expired"; callers and the guarded-UPDATE predicate evaluate `now() >= expires_at` at read time. The UI computes the countdown from the same field.

**Rationale**: No background worker, no cron, no drift between a "marked expired" row and real time. Expiration is inherently derived — making it derived in code matches the domain.

**Alternatives considered**:

- *Cron job or pg_cron*: avoidable moving part. Fails silently if not deployed.
- *Client-only countdown*: wrong on a stale tab and not enforceable on the server.

---

## R-05 Public Share Link

**Decision**: `share_link text unique` column populated at INSERT with `nanoid(21)` (≈126 bits of entropy). A `public_requests` view exposes only the safe subset of columns (amount_cents, status, note, expires_at, created_at, sender_email, recipient_email, share_link) and is granted `SELECT` to `anon` and `authenticated`. The public share route reads from the view keyed by `share_link`.

**Rationale**: Unguessable tokens are the standard web pattern for opt-in public sharing. Exposing a narrow view (instead of granting `anon` access to the raw table) prevents accidental leaks of internal IDs or RLS-bypass.

**Alternatives considered**:

- *Signed URLs (HMAC)*: equivalent security, but tokens become dependent on a rotating secret and a failed rotation breaks old links.
- *Granting the raw table to anon with a permissive RLS policy*: couples public projection to storage schema, easier to misconfigure.

---

## R-06 Money Representation

**Decision**: `amount_cents integer` with a domain constraint `amount_cents > 0 AND amount_cents <= 99999999` (max $999,999.99). All validators, API payloads, and DB columns speak in cents. Dollars are a display concern only, formatted via `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`.

**Rationale**: Floats can't represent every decimal dollar value exactly; a single `0.1 + 0.2 ≠ 0.3` bug in a fintech product is a trust breach. Integers round-trip losslessly.

**Alternatives considered**:

- *`numeric(12,2)`*: correct but invites mixed-type arithmetic bugs when a TS `number` silently demotes.
- *`bigint cents`*: overkill at this scale; an `int4` caps at ~$21M which is well above our domain ceiling.

---

## R-07 Validation Strategy

**Decision**: Single Zod schema per payload lives in `src/lib/validators.ts` (no React imports) and is consumed by both the client form (via `react-hook-form` if needed, or plain `useState`) and the server route handler. The server runs the full schema against every request body — the client is untrusted.

**Rationale**: Mirrors the "validate on both sides" principle but with the same schema, so the two sides cannot drift. The server call is the trust boundary; the client call is a UX speed-up.

**Alternatives considered**:

- *Only server validation*: worse UX (no inline errors).
- *Two separate schemas*: they drift within the first week.

---

## R-08 Test Strategy

**Decision**: Playwright-only E2E with `video: 'on'` and a single chromium project. One `.spec.ts` per user story (auth, signup, create, dashboard, pay, decline, cancel, expiration, share, responsive). No unit test suite.

**Rationale**: The interview rubric values demonstrable coverage; video-recorded E2E runs both verify behavior and produce the demo artifacts. Unit tests in a one-day ship trade against feature coverage.

**Alternatives considered**:

- *Vitest unit suite + Playwright*: more coverage types but less total confidence in a time-boxed build.
- *Playwright without video*: loses the demo artifact.

---

## R-09 Deployment Target

**Decision**: Vercel with Fluid Compute (default since 2026). Next.js 16 default runtime; no Edge runtime. `vercel.ts` config with framework set to `nextjs`.

**Rationale**: Fluid Compute gives the same region, the same price, and full Node.js compatibility for Supabase SSR cookies — which Edge's Web Crypto-only constraints would complicate.

**Alternatives considered**:

- *Edge runtime*: formerly the default; now deprecated for this pattern per current Vercel knowledge.
- *Self-host*: outside assignment scope.

---

## R-10 Data Retention and Audit

**Decision**: No retention purge implemented. No audit log implemented. The Assumptions section of `spec.md` records this as out-of-scope for the interview version.

**Rationale**: Adds surface area with no rubric benefit.

**Alternatives considered**:

- *`pg_cron` job to archive rows older than 90 days*: future-work hook; not built here.
