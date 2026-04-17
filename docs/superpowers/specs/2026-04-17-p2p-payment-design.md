# PayRequest — P2P Payment Request Feature — Design Doc

**Date:** 2026-04-17
**Author:** Claude Code (with Ragıp Günay)
**Assignment:** Lovie First Interview Assignment
**Deadline:** Video recorded + submitted today

---

## 1. Goal

Build a **Venmo-style P2P payment request feature** end-to-end using a spec-driven, AI-native workflow. Ship to production on Vercel, cover critical paths with automated Playwright E2E tests (with video recording), and document the process in a screen recording demonstrating the AI-native development style.

**Success criteria (from assignment rubric):**
- **Language Mastery (30%)** — spec so clear AI implements it without follow-up questions.
- **Technical Depth (25%)** — fintech-correct (integer cents, RLS, race-safe writes).
- **Execution Speed (20%)** — shipped within the 3-4 hour expectation.
- **Process Discipline (25%)** — Spec-Kit workflow, E2E coverage, automation, docs.

---

## 2. Strategy — Two-Run Approach

Because the build will be recorded on video in English, we run the build twice:

| Run | Purpose | Video | GitHub push | Supabase state |
|---|---|---|---|---|
| **Run 1** (Rehearsal) | Prove the workflow end-to-end, time each stage, refine prompts, catch surprises | **Off** | Local git only, no push | Same project, clean before Run 2 |
| **Run 2** (Final) | Record the video, ship the submission | **On** | Push to `main` of `RgpGny/lovie-payment-task` | Fresh state from reset |

**Between runs:** drop schema, delete auth users via Supabase MCP, `rm -rf` local dir, keep Vercel project (redeploys fine).

**Rehearsal output:** a `video-script.md` containing the exact prompts, English narration hints, and measured stage durations.

---

## 3. Stack (fixed — mirrors reference repo)

- **Framework:** Next.js 16 App Router + TypeScript (strict)
- **Database:** Supabase Postgres with Row Level Security
- **Auth:** Supabase email + password (two seeded test users)
- **UI:** Tailwind CSS v4 + shadcn/ui (`sonner` toasts, `lucide-react` icons)
- **Testing:** `@playwright/test` with `video: 'on'`, chromium project
- **Deployment:** Vercel (personal account), Fluid Compute default, `vercel.ts` config
- **Spec workflow:** GitHub Spec-Kit (`uvx specify-cli`) — local only

**Not used** (out of scope for this task): Edge Functions, Vercel AI SDK, magic-link auth, multi-currency, notifications, webhooks, AI gateway.

---

## 4. Feature Requirements

### 4.1 Authentication
- Email + password login and signup via Supabase Auth.
- Two seeded test accounts for demo: `alice@payrequest.test` / `bob@payrequest.test`, password `password123`.
- Protected routes enforced by Next.js middleware checking Supabase session.
- Unauthenticated access to `/dashboard`, `/requests/*` redirects to `/login`.

### 4.2 Create Payment Request
- Form at `/requests/new` with fields: recipient email, amount (dollars, 2-decimal), note (optional, ≤ 200 chars).
- Client + server validation: amount > 0 and ≤ 999,999.99; valid RFC 5322 email; sender ≠ recipient.
- On success: row inserted into `payment_requests`, unique `share_link` slug generated (nanoid, 10 chars), user redirected to `/requests/[id]` with toast "Request sent".

### 4.3 Dashboard
- `/dashboard` with two tabs: **Incoming** (rows where `recipient_email = auth.email()`) and **Outgoing** (rows where `sender_id = auth.uid()`).
- Each row (card): avatar initial, counterparty email, amount formatted `$X.XX`, relative timestamp, status badge.
- Filter: status dropdown (All / Pending / Paid / Declined / Cancelled / Expired). "Expired" is a derived filter — selects rows with `status='pending' AND expires_at <= now()`.
- Search: text input filters by counterparty email or note (client-side on fetched list).
- Status badge colours: Pending (amber), Paid (green), Declined (red), Cancelled (gray), Expired (gray-striped).

### 4.4 Request Detail
- `/requests/[id]` shows amount, note, sender + recipient emails, created timestamp, expiration countdown, current status.
- Incoming + pending + not expired → buttons: **Pay** (primary), **Decline** (secondary).
- Outgoing + pending + not expired → button: **Cancel request**.
- Terminal statuses → read-only detail + status reason.

### 4.5 Shareable Public Link
- `/pay/[share_link]` is public (no auth required for viewing).
- Shows request amount, sender email, note, expiration.
- If viewer is signed in as recipient → shows Pay/Decline buttons.
- If not signed in → "Sign in as [recipient_email] to pay this request" CTA.

### 4.6 Pay Flow
- Click **Pay** → POST `/api/requests/[id]/pay`.
- Server atomic update: `UPDATE ... SET status='paid', paid_at=now() WHERE id=$1 AND status='pending' AND expires_at > now() AND recipient_email = auth.email() RETURNING *`.
- If 0 rows affected → return 410 Gone ("request no longer payable").
- Success → 2-3 second artificial `setTimeout(2500)` in the route handler to simulate processing (per spec: "show loading state 2-3s").
- Redirect to `/requests/[id]/success` confirmation page.

### 4.7 Decline / Cancel
- **Decline** (recipient only) → POST `/api/requests/[id]/decline` → status `declined`.
- **Cancel** (sender only) → POST `/api/requests/[id]/cancel` → status `cancelled`.
- Both use the same status='pending' guard; both return 410 if not pending.

### 4.8 Expiration
- `expires_at = created_at + interval '7 days'` computed at insert time.
- UI countdown: `Xd Yh Zm remaining`, turns red < 24h.
- If `now() >= expires_at`, status shown as Expired (not a separate DB column — derived in a view or at read time via `status = 'pending' AND expires_at <= now()`). Pay/Decline/Cancel endpoints return 410.

### 4.9 Responsive Design
- Mobile (375px), tablet (768px), desktop (1280px) all tested.
- Dashboard cards stack vertically on mobile, grid on desktop.

---

## 5. Data Model

```sql
-- profiles mirrors auth.users; RLS-friendly view of emails.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- Status enum.
create type request_status as enum ('pending','paid','declined','cancelled');
-- Expired is derived at read time (status='pending' AND expires_at <= now()).

create table payment_requests (
  id uuid primary key default gen_random_uuid(),
  share_link text not null unique,
  sender_id uuid not null references profiles(id) on delete cascade,
  recipient_email text not null check (position('@' in recipient_email) > 1),
  amount_cents integer not null check (amount_cents > 0 and amount_cents <= 99999999),
  note text check (char_length(note) <= 200),
  status request_status not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  paid_at timestamptz,
  declined_at timestamptz,
  cancelled_at timestamptz
);

create index on payment_requests (sender_id);
create index on payment_requests (recipient_email);
create index on payment_requests (share_link);
```

### 5.1 RLS Policies

```sql
alter table profiles enable row level security;
alter table payment_requests enable row level security;

-- Profiles: readable by anyone authenticated (for counterparty display).
create policy profiles_read on profiles for select to authenticated using (true);
create policy profiles_self_insert on profiles for insert to authenticated
  with check (id = auth.uid());

-- payment_requests SELECT: sender or recipient only.
create policy pr_read_involved on payment_requests for select to authenticated
  using (sender_id = auth.uid() or recipient_email = auth.email());

-- payment_requests INSERT: only for self as sender.
create policy pr_insert_sender on payment_requests for insert to authenticated
  with check (sender_id = auth.uid());

-- payment_requests UPDATE: sender can cancel; recipient can pay/decline.
-- Enforced via server-side API route; RLS permits both and the route handler
-- guards the specific status transition.
create policy pr_update_involved on payment_requests for update to authenticated
  using (sender_id = auth.uid() or recipient_email = auth.email());

-- Public share_link read: separate anon-safe view.
create view public_requests as
  select id, share_link, amount_cents, note, status, expires_at, created_at,
         (select email from profiles where id = sender_id) as sender_email,
         recipient_email
  from payment_requests;
grant select on public_requests to anon;
```

### 5.2 Triggers

```sql
-- Auto-create profile on auth.users insert.
create function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email) values (new.id, new.email) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
```

---

## 6. API Routes

All under `src/app/api/requests/`. All return JSON. All validate inputs with Zod. All use server-side Supabase client with RLS.

| Method | Path | Purpose | Auth | Codes |
|---|---|---|---|---|
| POST | `/api/requests` | Create request | required | 201, 400, 401 |
| GET | `/api/requests` | List requests involving current user | required | 200, 401 |
| GET | `/api/requests/[id]` | Fetch single | required + involved | 200, 401, 403, 404 |
| POST | `/api/requests/[id]/pay` | Mark paid (2.5s delay) | required + recipient | 200, 401, 403, 404, 410 |
| POST | `/api/requests/[id]/decline` | Mark declined | required + recipient | 200, 401, 403, 404, 410 |
| POST | `/api/requests/[id]/cancel` | Mark cancelled | required + sender | 200, 401, 403, 404, 410 |
| GET | `/api/requests/share/[link]` | Public read by share_link | optional | 200, 404 |

**Validation schema (example):**
```ts
// src/lib/validators.ts
export const createRequestSchema = z.object({
  recipientEmail: z.string().email(),
  amountCents: z.number().int().positive().max(99999999),
  note: z.string().max(200).optional(),
});
```

---

## 7. Fintech Discipline Checklist

- [x] Amounts stored as `integer cents`, never `numeric` or `float`.
- [x] UI formats via `new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(cents/100)`.
- [x] Input parsed from string → cents in a single helper (`parseAmountToCents`).
- [x] Server-side revalidation of every input (client validation is UX only).
- [x] Status transitions atomic via `WHERE status='pending'` — no read-then-write.
- [x] Expiration enforced in SQL predicate, not application code.
- [x] RLS defense in depth (policies + API route guards).
- [x] Public share_link route exposes only non-sensitive fields via a view.
- [x] HTTP codes: 400 (bad input), 401 (not auth'd), 403 (not involved), 404 (not found), 410 (gone / state-changed).

---

## 8. Spec-Kit Workflow

Install:
```sh
uvx --from git+https://github.com/github/spec-kit specify init --here
```

This creates `.specify/` and registers four slash commands with Claude Code:
- `/specify <prompt>` → writes `specs/NNN-<slug>/spec.md`
- `/plan` → writes `specs/NNN-<slug>/plan.md`
- `/tasks` → writes `specs/NNN-<slug>/tasks.md`
- `/implement` → executes tasks.md

All files live locally under `specs/001-p2p-payment-request/`. Run 2 commits them, Run 1 does not push.

---

## 9. Video Stages — "Let's continue" Flow

User says one opening prompt. Each subsequent stage is triggered by the user saying **"let's continue"** (or similar). At each stage start, Claude prints a prominent English banner (see §10).

| # | Stage | Duration | What Claude does |
|---|---|---|---|
| 1 | Spec-Kit Init + `/specify` | ~60s | Install Spec-Kit, write spec.md from assignment brief |
| 2 | `/plan` | ~60s | Tech decisions doc (stack, data model rationale) |
| 3 | `/tasks` | ~60s | Break work into 40-50 tasks across 8 phases |
| 4 | DB + Auth | ~120s | Supabase migration via MCP, seed profiles trigger, 2 test users |
| 5 | Core scaffold | ~60s | Next.js layout, Supabase browser/server clients, middleware, env |
| 6 | Create Request flow | ~120s | Validator, POST route, form page, toast |
| 7 | Dashboard | ~120s | Tabs, cards, filter, search, status badges |
| 8 | Pay / Decline / Cancel | ~120s | Three API routes (race-safe), buttons, detail page |
| 9 | Expiration + Share link | ~60s | Countdown component, public `/pay/[link]` page |
| 10 | E2E Tests | ~180s | `test-agent` writes 9 Playwright specs, `npx playwright test` with video |
| 11 | Deploy + Demo | ~120s | `vercel --prod`, env push, open live URL, walk through features |

Opening prompt: *"Let's build a P2P payment request feature end to end using GitHub Spec-Kit. Use the assignment requirements."*

Total recording target: **15-20 minutes**.

---

## 10. English Status Banner Format

At the start of every stage, Claude outputs:

```
════════════════════════════════════════════════════════════════
🎬 STAGE {n}/11 — {Stage Title}

What: {one sentence, present tense}
Why it matters: {one sentence, fintech/engineering context}
Tools: {MCPs + skills used in this stage}
════════════════════════════════════════════════════════════════
```

Example:
```
════════════════════════════════════════════════════════════════
🎬 STAGE 4/11 — Database & Authentication

What: Creating the Postgres schema with Row Level Security
policies and seeding two test users via the Supabase MCP.
Why it matters: RLS is the primary defense that prevents a user
from reading or mutating another user's payment requests.
Tools: Supabase MCP (apply_migration, execute_sql), supabase-postgres-best-practices skill.
════════════════════════════════════════════════════════════════
```

This appears first in the Claude response so the user can read it while narrating to the camera.

---

## 11. AI Config Files (committed to repo)

- **`CLAUDE.md`** — project guide for Claude Code (stack, money rule, RLS invariant, commands, file boundaries).
- **`AGENTS.md`** — tool-agnostic version of CLAUDE.md for generic agent consumers.
- **`.claude/settings.json`** — hooks: PostToolUse (prettier + eslint fix), Stop (tsc --noEmit); permissions allow-list for safe commands.
- **`.specify/`** — Spec-Kit config (auto-generated).
- **`.env.example`** — placeholder Supabase URL, anon key, service role key.
- **`README.md`** — public-facing: live URL, YouTube build video link, setup, test, tech stack.

---

## 12. E2E Test Coverage (Playwright, chromium project, `video: 'on'`)

Ten spec files under `tests/`:

1. `auth.spec.ts` — login / logout / protected route redirect.
2. `signup-flow.spec.ts` — new account → profile row created.
3. `create-request.spec.ts` — happy path + validation errors.
4. `dashboard.spec.ts` — tabs, filter, search.
5. `pay-request.spec.ts` — pay flow → success page → status flips in both dashboards.
6. `decline-request.spec.ts` — recipient declines, sender sees Declined.
7. `cancel-request.spec.ts` — sender cancels, recipient sees Cancelled.
8. `expiration.spec.ts` — fixture inserts a row with `expires_at < now()`, pay returns 410.
9. `shareable-link.spec.ts` — public page loads; recipient pay flow through share link.
10. `responsive.spec.ts` — dashboard renders correctly at 375 / 768 / 1280.

Videos auto-saved to `test-results/`. Written by `test-agent` in parallel where test files are independent.

---

## 13. Infra Setup (Run 1 — before first stage)

Done once, with video off. User's pre-existing accounts/repo are used.

```sh
# 1. Clone empty repo
cd /Users/ragipgunay/Desktop/Desktop/projects/lovieco
git clone https://github.com/RgpGny/lovie-payment-task.git .

# 2. Scaffold Next.js (overwrite README conflict)
npx create-next-app@latest . --ts --tailwind --app --no-eslint --yes

# 3. Install deps
npm i @supabase/ssr @supabase/supabase-js zod nanoid sonner lucide-react \
      class-variance-authority clsx tailwind-merge
npm i -D @playwright/test prettier eslint eslint-config-next
npx playwright install chromium

# 4. shadcn/ui
npx shadcn@latest init --yes
npx shadcn@latest add button card input label badge tabs sonner

# 5. Spec-Kit
uvx --from git+https://github.com/github/spec-kit specify init --here

# 6. Playwright MCP
claude mcp add playwright --scope project -- npx @playwright/mcp@latest

# 7. Supabase link (.env.local)
# Fetched via Supabase MCP (get_project_url, get_publishable_keys) — no manual copy-paste.

# 8. Vercel link
vercel link --yes --project lovie-payment-task
vercel env pull .env.local
```

All of this happens **before** the video starts. The video opens with a clean but scaffolded repo, with Spec-Kit ready.

---

## 14. Explicit Out of Scope (YAGNI)

Do not implement, do not design for:
- Magic-link auth (password is simpler and the spec allows it).
- Email notifications.
- Multi-currency (USD only).
- Real payment processor integration (the simulation is the requirement).
- Users without accounts paying a request (they must sign up first — unambiguously simpler).
- Refunds, partial payments, recurring requests.
- Phone number as recipient (email only — simpler, spec says "email/phone" but email alone satisfies).
- Cron job for expiration updates (expiration is purely derived at read time; no background job needed).
- AI features (chat, gateway, agents).

Any temptation to add these should be resisted. The assignment rewards disciplined scope.

---

## 15. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| 2.5s pay-simulation delay causes Playwright flake | `await expect(...).toBeVisible({ timeout: 10000 })` on success page |
| RLS blocks a legitimate read during testing | Integration smoke uses service-role key for fixture inserts only; assertions use regular client |
| Vercel deploy fails on first push (env missing) | Pre-push `vercel env pull`; verify `npm run build` locally before `vercel --prod` |
| Spec-Kit slash commands collide with Claude Code built-ins | Spec-Kit registers under its own `.claude/commands/` — no collision |
| Supabase branching unavailable on free tier | Not used; we reset the single project between runs |
| Rehearsal DB pollutes Run 2 | Pre-Run-2 script drops tables + deletes auth users via MCP |

---

## 16. Open Questions

None. All decisions are made:
- Auth = email+password (confirmed).
- Scope = mirror friend's feature set (confirmed).
- Two-run strategy (confirmed).
- "Let's continue" trigger + English banner (confirmed).
- Supabase reset between runs, no branching (confirmed).

---

## 17. Next Step

Upon user approval of this design doc, invoke `superpowers:writing-plans` skill to produce a phased implementation plan broken into independently-executable tasks matching the 11 video stages, with success criteria per stage.
