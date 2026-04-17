# Tasks — P2P Payment Request

**Feature**: 001-p2p-payment-request
**Plan**: [plan.md](./plan.md)
**Spec**: [spec.md](./spec.md)
**Data model**: [data-model.md](./data-model.md)
**Contracts**: [contracts/](./contracts/)

## Story labels

- `[US1]` — Sender creates a payment request (P1)
- `[US2]` — Recipient pays a pending request (P1)
- `[US3]` — Recipient declines a pending request (P1)
- `[US4]` — Sender cancels their own pending request (P2)
- `[US5]` — Expiration is visible without a background job (P2)
- `[US6]` — Dashboard with tabs, filters, and search (P2)
- `[US7]` — Shareable public link (P3)

`[P]` marks tasks that can run in parallel with the immediately preceding task (disjoint files, no shared dependency on an in-progress task).

---

## Phase A — Database + Auth (build stage 4)

**Phase goal**: A Supabase project with the full schema, Row Level Security, two seeded test users, and generated TypeScript types. Independent test: run the RLS verification query in `data-model.md` and confirm cross-user reads return zero rows.

- [ ] T001 Write schema migration at `supabase/migrations/0001_init.sql` per `specs/001-p2p-payment-request/data-model.md` (profiles, request_status enum, payment_requests with CHECKs, indexes, RLS policies, public_requests view, handle_new_user trigger).
- [ ] T002 Apply migration via `mcp__supabase__apply_migration` with name `0001_init` using the SQL from T001. Verify with `mcp__supabase__list_tables` that `profiles`, `payment_requests` exist and `public_requests` view is listed.
- [ ] T003 Write seed migration at `supabase/migrations/0002_seed_users.sql` inserting two users (`alice@payrequest.test`, `bob@payrequest.test`, password `password123`) into `auth.users` with `crypt()` and conflict-safe inserts.
- [ ] T004 Apply seed via `mcp__supabase__execute_sql` using the SQL from T003. Confirm `select email from profiles order by email` returns both test emails.
- [ ] T005 Verify RLS correctness by running, via MCP `execute_sql`, three probe queries: an authenticated alice reading rows she sent, alice trying to read bob's rows, and anon reading via `public_requests`. Record observed row counts.
- [ ] T006 [P] Generate TypeScript types from Supabase via `mcp__supabase__generate_typescript_types` and write to `src/lib/supabase/database.types.ts`.

---

## Phase B — Core scaffold (build stage 5)

**Phase goal**: Supabase clients for browser and server, auth-guard middleware, validators and utilities, root layout with Toaster, sign-in and sign-up pages, protected layout with header. Independent test: signing in as Alice from `/login` lands her on `/dashboard` (empty state), and visiting `/dashboard` unauthenticated redirects to `/login`.

- [ ] T007 [P] Create browser Supabase client at `src/lib/supabase/client.ts` using `createBrowserClient` from `@supabase/ssr`.
- [ ] T008 [P] Create server Supabase client at `src/lib/supabase/server.ts` using `createServerClient` with `next/headers` cookie bridge.
- [ ] T009 [P] Create middleware session-refresh helper at `src/lib/supabase/middleware.ts` that reads/writes cookies on the `NextRequest` → `NextResponse` pair and returns the refreshed response.
- [ ] T010 Create `src/middleware.ts` that calls the helper from T009 and redirects unauthenticated requests to `/login` for `/dashboard/**` and `/requests/**` paths. Configure `matcher` to exclude static assets.
- [ ] T011 [P] Create `src/lib/money.ts` with `dollarsToCents(input: string | number): number` and `formatCents(cents: number): string` using `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`.
- [ ] T012 [P] Create `src/lib/expiration.ts` with `isExpired(expiresAt: string | Date): boolean` and `formatCountdown(expiresAt: string | Date, now?: Date): string` returning strings like "expires in 6d 2h".
- [ ] T013 [P] Create `src/lib/validators.ts` with Zod schemas: `createRequestSchema` (recipient_email, amount_cents, note), `dashboardQuerySchema` (direction, status, q). Export inferred TS types.
- [ ] T014 [P] Create `src/lib/types.ts` with hand-written domain types `PaymentRequest`, `PaymentRequestView`, `PublicRequestView`, `RequestStatus`, `EffectiveStatus`, re-exporting or deriving from `database.types.ts`.
- [ ] T015 Edit `src/app/layout.tsx` to mount the shadcn Sonner `<Toaster />` and set the page title/meta to "PayRequest".
- [ ] T016 Create `src/app/page.tsx` as a server component that reads the Supabase session, redirects to `/dashboard` if signed in, otherwise to `/login`.
- [ ] T017 [P] Create `src/app/login/page.tsx` with an email/password form. Uses the browser Supabase client's `signInWithPassword`. Success → `router.replace('/dashboard')`. Error → toast.
- [ ] T018 [P] Create `src/app/signup/page.tsx` with an email/password form using `signUp`. On success, redirect to `/dashboard` (the trigger in Phase A creates the profile automatically).
- [ ] T019 [P] Create `src/app/auth/callback/route.ts` that exchanges the `?code=` for a session using `exchangeCodeForSession` and redirects to `/dashboard`.
- [ ] T020 [P] Create `src/components/header.tsx` showing the signed-in email, an empty-space nav, and a sign-out dropdown. Consumes the server Supabase client.
- [ ] T021 Create `src/app/(protected)/layout.tsx` that renders `<Header />` and `{children}`. Already protected by middleware; this layout just composes the shell.

---

## Phase C — Create request (build stage 6)

**Phase goal**: The sender can open `/requests/new`, fill the form, submit, and see a success page with the share link. Independent test: as Alice, POST a valid request via the UI, observe a 201 response, and confirm the new row exists in the DB with the expected `share_link` token.

- [ ] T022 [US1] Create `src/components/request-form.tsx` as a client component: fields recipient_email, amount (dollars with 2-decimal step), note. Client-side Zod validation with inline error messages. Submits to `POST /api/requests`. On 200 → `router.push('/requests/${id}/success')`; on error → toast.
- [ ] T023 [US1] Create `src/app/(protected)/requests/new/page.tsx` rendering `<RequestForm />` inside a card.
- [ ] T024 [US1] Create `src/app/api/requests/route.ts` with a `POST` handler: authenticate via server Supabase client, Zod-parse body, reject self-request, generate `nanoid(21)`, INSERT into `payment_requests`, return 201 with the row. Error matrix per `contracts/requests.md`.
- [ ] T025 [US1] Create `src/app/(protected)/requests/[id]/success/page.tsx` showing the new request's amount, recipient, share link with a copy-to-clipboard button, and a "Back to dashboard" link.
- [ ] T026 [US1] [P] Manually exercise the create flow via the browser (dev server). Confirm a Stage C commit and push.

---

## Phase D — Dashboard (build stage 7)

**Phase goal**: Logged-in users see two tabs (Incoming, Outgoing) listing their requests, with status filter and free-text search. Independent test: as Alice with one outgoing and one incoming request, confirm both appear in the correct tabs and the status filter narrows the list.

- [ ] T027 [US6] Extend `src/app/api/requests/route.ts` with a `GET` handler that reads `direction`, `status`, `q` from `searchParams` via `dashboardQuerySchema`, queries `payment_requests` (RLS filters to the caller), attaches `effective_status` and `is_expired`, returns `{ items }`. Error matrix per `contracts/requests.md`.
- [ ] T028 [US6] [P] Create `src/components/status-badge.tsx` — a shadcn `<Badge />` colored by `effective_status` (pending=blue, paid=green, declined=amber, cancelled=neutral, expired=red).
- [ ] T029 [US6] [P] Create `src/components/request-card.tsx` showing counterparty email, amount (via `formatCents`), note snippet, `<StatusBadge />`, countdown for pending, and a Link to `/requests/[id]`.
- [ ] T030 [US6] Create `src/components/dashboard-tabs.tsx` using shadcn `<Tabs />` with Incoming / Outgoing tabs. Owns the `status` filter `<select>` and the `q` search `<input>`. Fetches from `GET /api/requests` on change.
- [ ] T031 [US6] Create `src/app/(protected)/dashboard/page.tsx` rendering `<DashboardTabs />` with a "New Request" CTA button linking to `/requests/new`. Empty state: "No requests yet — ask someone for money."

---

## Phase E — Pay / Decline / Cancel (build stage 8)

**Phase goal**: Recipient can pay or decline; sender can cancel. All three transitions are atomic and race-safe. Independent test: in two browser tabs signed in as Alice (sender) and Bob (recipient), press Cancel and Pay simultaneously; verify exactly one succeeds and the other sees a clear error.

- [ ] T032 [US2] Create `src/app/api/requests/[id]/route.ts` `GET` handler: authenticate, SELECT by id (RLS filters), 404 if no row, attach `is_sender`, `is_recipient`, `effective_status`, `is_expired`. Response per `contracts/request-id.md`.
- [ ] T033 [US2] [P] Create `src/components/request-detail.tsx` rendering amount, counterparty, note, status, countdown, and action buttons conditional on `is_sender` / `is_recipient` / `effective_status`.
- [ ] T034 [US2] Create `src/app/(protected)/requests/[id]/page.tsx` that fetches the detail via the server Supabase client and renders `<RequestDetail />`. 404 page on missing.
- [ ] T035 [US2] Create `src/app/api/requests/[id]/pay/route.ts` `POST` handler executing the single guarded UPDATE from `contracts/pay.md`. On `rows === 0`, run the disambiguating SELECT and return 409 with `not_pending` or `expired`. On `rows === 1`, return 200 with the updated view.
- [ ] T036 [US3] Create `src/app/api/requests/[id]/decline/route.ts` `POST` handler mirroring T035 but setting `status='declined'` and `declined_at`. Error matrix per `contracts/decline.md`.
- [ ] T037 [US4] Create `src/app/api/requests/[id]/cancel/route.ts` `POST` handler mirroring T035 but with `sender_id = auth.uid()` clause and `status='cancelled'`. Error matrix per `contracts/cancel.md`.

---

## Phase F — Expiration + Shareable link (build stage 9)

**Phase goal**: Every pending request renders a live countdown; requests past 7 days show as expired and cannot be acted on; share links work for anon viewers and for signed-in recipients. Independent test: open a share link in an incognito window, observe the public view without Pay controls; sign in as the recipient and observe Pay/Decline become available.

- [ ] T038 [US5] [P] Create `src/components/countdown-timer.tsx` as a client component: `useEffect` + `setInterval(1s)` recomputing `formatCountdown(expiresAt)`. When the value crosses to "expired", fires an `onExpire` callback and shows "Expired".
- [ ] T039 [US7] Create `src/app/api/requests/share/[link]/route.ts` `GET` handler: query `public_requests` by `share_link`, 404 if no row, attach `effective_status` + `is_expired`, return 200 per `contracts/share.md`.
- [ ] T040 [US7] Create `src/app/pay/[link]/page.tsx` rendering the public projection (amount, counterparty emails, note, status, countdown). If `auth.email() === recipient_email`, render Pay and Decline buttons that call `/api/requests/[id]/pay|decline` with the row's internal id. Otherwise render a "Sign in as {recipient_email} to pay" CTA.

---

## Phase G — Playwright E2E (build stage 10)

**Phase goal**: Headless, video-recorded E2E coverage for every P1/P2/P3 user story plus responsive layout. Independent test: `npx playwright test` passes locally with 100% of specs green; a video per test exists under `test-results/`.

- [ ] T041 Create `playwright.config.ts` with a single chromium project, `video: 'on'`, `baseURL: 'http://localhost:3000'`, and `webServer: { command: 'npm run dev', port: 3000, reuseExistingServer: !process.env.CI }`.
- [ ] T042 Create `tests/fixtures.ts` with helpers `signIn(page, email, password)`, `seedRequest({ sender, recipient, amountCents, note })` (talks to Supabase via service role), and `resetRequests()`.
- [ ] T043 [US1] Create `tests/auth.spec.ts` covering: anon visits /dashboard → redirected to /login; sign-in success → lands on /dashboard; wrong password → stays on /login with error toast.
- [ ] T044 [US1] Create `tests/signup-flow.spec.ts`: new user signs up, profile row created, lands on dashboard.
- [ ] T045 [US1] Create `tests/create-request.spec.ts`: Alice opens /requests/new, submits $25 to bob, lands on success page showing the share link.
- [ ] T046 [US6] Create `tests/dashboard.spec.ts`: Alice seeds 3 requests of mixed statuses, confirms tabs and status filter narrow the list.
- [ ] T047 [US2] Create `tests/pay-request.spec.ts`: Alice creates, Bob pays, status goes to paid; Alice refreshes and sees paid status.
- [ ] T048 [US3] Create `tests/decline-request.spec.ts`: Alice creates, Bob declines, status goes to declined.
- [ ] T049 [US4] Create `tests/cancel-request.spec.ts`: Alice creates, Alice cancels, status goes to cancelled; Bob attempts to pay → 409 "not_pending".
- [ ] T050 [US5] Create `tests/expiration.spec.ts`: seed a row with `expires_at = now() - interval '1 second'`; open detail page → shows "Expired"; attempt to pay → 409 "expired".
- [ ] T051 [US7] Create `tests/shareable-link.spec.ts`: anon opens /pay/[link] → sees public view, no Pay button; Bob signs in and opens same URL → sees Pay button; pays successfully.
- [ ] T052 [US6] Create `tests/responsive.spec.ts`: set viewport to 375×812 (iPhone 13), confirm dashboard, detail, and form pages have no horizontal scroll and all CTAs are tappable.

---

## Phase H — Production deploy (build stage 11)

**Phase goal**: The live URL serves the app with real Supabase reads and writes; anon share links resolve from the production domain. Independent test: sign in as Alice on the production URL, create a request, share the link, open it in an incognito window, confirm the public page renders.

- [ ] T053 Run `npm run build` locally, confirm 0 errors and 0 warnings from tsc.
- [ ] T054 Deploy via `vercel --prod --yes`. Capture the returned production URL.
- [ ] T055 Smoke-test production via Playwright MCP: visit the production URL, sign in as Alice, create a $1 request to Bob, take a screenshot, open the share link in a second tab, take a second screenshot.

---

## Dependency graph (phase-level)

```text
A (DB+Auth) ── blocks ──► B (scaffold)
B ── blocks ──► C, D, E, F
C, D, E, F ── blocks ──► G (tests)
G ── blocks ──► H (deploy)
```

Within B, tasks T007/T008/T009 are `[P]` (different files), as are T011/T012/T013/T014 and T017/T018/T019/T020.
Within C, T024 must precede T026.
Within D, T027 precedes T031; T028/T029 are `[P]`.
Within E, T035/T036/T037 are all `[P]` once T032 is in place.
Within F, T038 is `[P]` with anything in E; T039 precedes T040.

## Implementation strategy

- **MVP scope**: Phases A + B + C + D + a single P1 action (T035 Pay) is already a demo-worthy slice.
- **Thin vertical slice preferred** over horizontal layers: land the full create→list→pay loop before decline/cancel. Tests in Phase G can be staged after each vertical slice if time permits during the live build.
- **Commit cadence**: one commit per task group that matches a build stage (A→commit, B→commit, etc.). Video rule: every stage ends with a `git push`.
