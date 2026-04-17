# PayRequest

A Venmo-style peer-to-peer payment request web app built end-to-end for the **Lovie interview assignment** — spec to production, AI-driven, recorded on video.

**Live:** https://lovie-payment-task.vercel.app
**Repo:** https://github.com/RgpGny/lovie-payment-task

Test accounts (both password `password123`):

- `alice@payrequest.test`
- `bob@payrequest.test`

---

## What it does

Authenticated users request money from each other via email.

- **Create** a request: recipient email + dollar amount + optional note → gets a unique shareable link and a 7-day expiration.
- **Pay** or **decline** an incoming request (recipient).
- **Cancel** an outgoing request (sender).
- Every request **expires 7 days after creation** — evaluated at read time, no background jobs.
- Every request has a **public share page** at `/pay/<token>` that anon can view and the signed-in recipient can pay from directly.
- **Dashboard** with Incoming / Outgoing tabs, status filter, and free-text search over note + counterparty email.

See [`specs/001-p2p-payment-request/spec.md`](./specs/001-p2p-payment-request/spec.md) for the full specification (20 functional requirements, 7 prioritized user stories, 8 measurable success criteria).

---

## Fintech non-negotiables (the invariants this code guarantees)

- **Money is integer cents, never float.** Input → Zod → DB → response → display, all in cents. Dollars exist only in `Intl.NumberFormat('en-US', { style: 'currency' })` at render time. A forty-two-dollar-fifty request stores `amount_cents = 4250`; there is no place in the code where `0.1 + 0.2` happens.
- **Atomic status transitions.** Every `pay / decline / cancel` is a single guarded UPDATE:
  ```sql
  UPDATE payment_requests
     SET status = $new, $terminal_at = now()
   WHERE id = $1
     AND status = 'pending'
     AND expires_at > now()
     AND <actor clause>
  ```
  One-row ⇒ success. Zero-row ⇒ disambiguated into `409 not_pending` or `409 expired`. Concurrent attempts are serialised by Postgres itself — the race is provably safe (see `tests/expiration.spec.ts` and the CTE probe in the Stage 8 commit).
- **Row Level Security is the authorization boundary.** `payment_requests` has `SELECT` / `UPDATE` policies that require `sender_id = auth.uid() OR recipient_email = auth.email()`. Middleware is a UX redirect, not a security layer — every row read goes through RLS, including from server components. Verified programmatically in the Stage 4 commit via a JWT-impersonation probe.
- **Expiration is derived, not stored.** `expires_at = created_at + interval '7 days'`. The app and the guarded UPDATE evaluate `now() >= expires_at`; no row is ever marked expired by a worker.
- **Validation runs on both sides of the wire using the same schema.** Zod schemas live in `src/lib/validators.ts`, imported by the browser form and the server route handler. The client validates for UX; the server validates for trust.

---

## Stack

- **Next.js 16** App Router + TypeScript strict, deployed on **Vercel Fluid Compute** (Node.js runtime).
- **Supabase** Postgres + Auth + Row Level Security.
- **Tailwind CSS v4** + **shadcn/ui** primitives.
- **Zod** for validation, **nanoid** for share tokens.
- **@playwright/test** for E2E with `video: 'on'`.
- **GitHub Spec-Kit** (`/speckit-specify`, `/speckit-plan`, `/speckit-tasks`) for the AI-native development workflow.

---

## Architecture at a glance

```
app/
  login/                  ← email + password form, Suspense-wrapped
  signup/                 ← sign-up form
  auth/callback/          ← Supabase auth code exchange
  (protected)/            ← middleware-guarded shell
    dashboard/            ← Incoming + Outgoing tabs, filter, search
    requests/new          ← create form
    requests/[id]         ← detail view with Pay / Decline / Cancel
    requests/[id]/success ← post-create share link screen
  pay/[link]              ← public share page (anon + recipient actions)
  api/requests/           ← POST create, GET list
    [id]/                 ← GET detail; POST pay | decline | cancel
    share/[link]          ← public projection via share token (service-role read)

lib/
  supabase/{client,server,middleware,database.types}.ts
  validators.ts           ← Zod schemas (shared client + server)
  money.ts                ← cents ↔ display
  expiration.ts           ← isExpired + countdown
  transitions.ts          ← shared guarded-UPDATE + error matrix
  request-view.ts         ← shape row → view (sender_email, effective_status, is_sender…)
  types.ts                ← domain types composed over database.types

supabase/migrations/
  0001_init.sql           ← schema + RLS + trigger
  0002_seed_users.sql     ← two demo accounts (via Supabase Admin API in practice)

tests/
  fixtures.ts             ← signIn / seedRequest / resetRequests helpers
  auth / create-request / dashboard / pay-request / decline-request /
  cancel-request / expiration / shareable-link  .spec.ts

specs/001-p2p-payment-request/
  spec.md                 ← Stage 1 output
  plan.md + research.md + data-model.md + quickstart.md
  contracts/*.md          ← one file per HTTP endpoint (request shape, response, error matrix)
  tasks.md                ← Stage 3 output (55 tasks, 8 phases)
```

---

## AI-native workflow (how this repo was actually built)

This project was built **live, on video, AI-driven from spec to deployment**, in eleven recorded stages. Each stage is exactly one commit; each commit ends with a `git push`. Anyone can resume the build from whichever commit was last pushed.

| Stage | Commit | What landed |
|------:|--------|-------------|
| 0 | `05c4934`, `ee4139c`, `db3d9ee` | Next.js scaffold, deps, shadcn, Spec-Kit, AI config files, Vercel link |
| 1 | `e4eba58` | `specs/.../spec.md` — 20 FRs, 7 stories (Spec-Kit `/speckit-specify`) |
| 2 | `a9ba8f1` | `plan.md` + `research.md` + `data-model.md` + `quickstart.md` + 6 HTTP contracts |
| 3 | `1812263` | `tasks.md` — 55 tasks across 8 phases |
| 4 | `55ff1cb` | `0001_init.sql` migration, RLS probe via JWT impersonation, TS types generated |
| 5 | `e88ed4f` | Supabase clients, auth middleware, login/signup, protected shell, sign-out |
| 6 | `4af6348` | Create-request flow — form, `POST /api/requests`, success page |
| 7 | `57e38f9` | Dashboard — `GET /api/requests`, tabs, filters, search, cards, status badge |
| 8 | `0cb6518` | Atomic `pay / decline / cancel` — single guarded UPDATE + 409 error matrix |
| 9 | `9372a63` | Live countdown timer, public share page, share API (service-role projection) |
| 10 | `5078579` | Playwright E2E suite — 18 tests, video recording, dotenv-loaded env |
| 11 | `5915d5f` | Production build fixup (Suspense boundary around `useSearchParams`), Vercel prod deploy, live smoke test |

Two things to notice about this history:

1. **The AI caught its own real bugs live.** A Supabase `security_definer` view advisor (Stage 4), a GoTrue seed missing the `auth.identities` row (Stage 5), a locale hydration mismatch and a share-link SSR/CSR divergence (Stage 10), a `useSearchParams` prerender error (Stage 11). Each was surfaced by a real tool — advisor, build, test — and fixed in the same session. None were swept under the rug.
2. **Stages 5–10 show a red Vercel status on the GitHub commit list.** Vercel runs a preview deploy on every push. The `useSearchParams` bug existed in the login page from Stage 5 onward, so every historical preview build failed until the fix landed in Stage 11. **`main` tip is green** — the production URL above is live and built from `5915d5f`. The red X's in history are load-bearing evidence that CI was actually running and actually catching problems, not that anything on `main` is broken right now.

---

## Running locally

```bash
git clone https://github.com/RgpGny/lovie-payment-task.git
cd lovie-payment-task
npm install
cp .env.example .env.local   # then fill in your Supabase keys
npm run dev                  # http://localhost:3000
```

Apply the migrations to your Supabase project via the Supabase MCP, the SQL editor, or `supabase db push`. Seed the two demo users via the Supabase Auth Admin API (see `supabase/migrations/0002_seed_users.sql` for the shape — the canonical path is the admin API, not raw SQL into `auth.users`).

## Tests

```bash
npx playwright test            # 18 tests, chromium, video: 'on'
npx playwright show-report     # open the HTML report afterwards
```

Videos land under `test-results/<spec>-chromium/video.webm`.

## Build and deploy

```bash
npm run build
vercel --prod --yes            # CLI already linked to `lovie-payment-task`
```

---

## Non-goals

Everything below is deliberately out of scope for this build and called out in `spec.md` → Out of Scope:

- Real money movement (a payment processor, card network, AML/KYC).
- Email, push, or SMS notifications.
- Recurring, editable, or multi-recipient requests.
- Multi-currency.
- Magic-link auth or third-party OAuth.
- Admin panel, audit log UI, retention purge cron.

---

## License

Built for the Lovie interview assignment. No specific license attached — contact the author before reuse.
