# PayRequest — P2P Payment Request Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

---

## 🚨🚨🚨 READ THIS FIRST — NON-NEGOTIABLE RULES 🚨🚨🚨

This project is being built **live, on video, fully AI-driven from spec to deployment**. The user has zero tolerance for manual intervention. You (Claude) are the sole operator. The following rules are MANDATORY — violating any one of them breaks the demo:

### RULE 1 — COMMIT AT THE END OF EVERY STAGE

At the final step of every Stage (0 through 11), you **MUST** run `git add -A` and `git commit -m "<stageN>: <description>"` before declaring the stage complete. Do not wait for the user. Do not ask. Skipping commits is a failure mode.

After every commit, verify with `git log --oneline | head -3` and print the hash.

### RULE 2 — RESUME PROTOCOL (if session is fresh or restarted)

If you do **not** see your own prior messages in this conversation (fresh session, or after `/exit`), you must:

1. Run `git log --oneline` — this tells you which Stages were already committed.
2. Run `git status` — this tells you what is in progress.
3. Run `git branch --show-current` — this tells you which branch you are on.
4. Determine the next Stage to execute based on the most recent commit message (`feat(stageN): ...`).
5. Print a short banner: `Resuming at Stage N+1 (found stageN commit at <hash>)`.
6. Continue from there. Do NOT restart from Stage 0.

### RULE 3 — MCP VERIFICATION AT STAGE 0

As the very first action of Stage 0, run these three checks in parallel and print the results:

```bash
claude mcp list 2>&1 | head -10
vercel whoami
gh auth status 2>&1 | head -3
```

And call these MCP tools to confirm Supabase is on the right project and can write:

- `mcp__supabase__get_project_url` (must return `omxnewprtonfxtalzmco`)
- `mcp__supabase__list_tables` with `{"schemas": ["public"], "verbose": false}` (must return without error)

If any check fails, **STOP** and tell the user. Do not proceed.

### RULE 4 — AUTOMATIC EVERYTHING

The user is reading a video script aloud while you work. They will say **"we can continue"** between stages. They will NOT be fixing your mistakes, clicking buttons, or typing secrets. All of these must be automated by you:

- Supabase migrations → via `mcp__supabase__apply_migration`
- Supabase seed users → via `curl` against Auth Admin API (service role key is in `.env.local`)
- Vercel deploy → via `vercel --prod --yes` (CLI already authenticated)
- Git commits → every stage, as per Rule 1
- Playwright MCP visual smoke tests → after Stage 6, 7, 8, 9

### RULE 5 — NARRATION EVERY STEP (THE USER CANNOT BE SILENT ON VIDEO)

The user is recording a video and needs to talk constantly. You must keep feeding them English narration to read aloud. **Do not do a large chunk of work in silence** — break every stage into small chunks, and after every chunk, pause and write a narration block, then wait for the user to say "we can continue" before moving to the next chunk.

A "chunk" is one of:
- Installing a dependency or tool
- Writing or editing a single meaningful file (or ≤ 3 small related files)
- Running a migration
- Running a test command
- Making a commit
- Deploying

After every chunk, **immediately** print:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Read this aloud (point at the screen):

"<2-4 sentences of English narration describing what I just did, why it
matters for a fintech product, and what this enables. Written in natural
spoken English, not a bullet list. Third person about Claude is fine:
'Claude just wrote the POST handler for creating requests. Notice the
Zod validation on the server — the client cannot bypass it.'>"

Say "we can continue" when you're ready for the next step.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then **stop and wait**. Do not do more work until the user types "we can continue".

Target cadence: **4–8 narration blocks per stage**, each followed by a pause. A 10-minute video across 11 stages needs roughly 50–70 of these blocks — the user should never be reading ahead or sitting in silence.

Narration rules:
- Written for a spoken delivery — no markdown formatting, no bullet lists inside the quote.
- 2–4 sentences, ~25–60 words.
- Explain the **why** (engineering, fintech, or workflow intent), not just the what.
- Reference what's visible on screen when possible ("the Supabase dashboard now shows two tables", "notice the new commit hash").
- Never repeat the banner text verbatim — narrations are conversational, banners are structural.

The banner at the start of each stage is still required (one per stage). Narration blocks are additional (many per stage).

### RULE 6 — SPEC-KIT RESTART (exactly one expected)

Stage 0 installs Spec-Kit (`.claude/skills/speckit-*`). Those skills won't load until the next session start. After Stage 0 commit, print this to the user verbatim:

> "Stage 0 complete. Spec-Kit skills are installed but only load on session restart. Please type `/exit`, then run `claude --dangerously-skip-permissions --continue`, then say 'we can continue'. This is the only restart required."

Wait for them. When you come back (in the `--continue`'d session), follow the Resume Protocol from Rule 2, detect the Stage 0 commit, and continue to Stage 1.

---

**Goal:** Ship a Venmo-style peer-to-peer payment request app (create/pay/decline/cancel, 7-day expiration, shareable links) end-to-end using Spec-Kit + Claude Code, with Playwright E2E coverage and a Vercel production deployment, all demonstrated in a single end-to-end video.

**Architecture:** Next.js 16 App Router (server components by default, API routes for mutations, middleware for auth guard) on Vercel Fluid Compute, backed by Supabase Postgres with Row Level Security. Money is integer cents. Status transitions are atomic `WHERE status='pending'` updates. Expiration is a read-time predicate (no cron). Public share link reads via a dedicated view granted to `anon`.

**Tech Stack:** Next.js 16, TypeScript strict, Tailwind v4, shadcn/ui, @supabase/ssr, Zod, nanoid, @playwright/test, Spec-Kit CLI (GitHub), Supabase MCP, Playwright MCP, Vercel CLI.

---

## How to Use This Plan

This plan is structured in **12 stages**. Stage 0 runs **before** the video (infra setup). Stages 1-11 map 1:1 to the video stages. In Run 1 (rehearsal), execute every stage sequentially. In Run 2 (video on), the user says "let's start" then "let's continue" between stages — do not solicit approval mid-stage.

**At the start of every stage (1-11), print the English status banner:**

```
════════════════════════════════════════════════════════════════
🎬 STAGE {n}/11 — {Title}

What: {one-sentence present-tense summary}
Why it matters: {one-sentence context, fintech or engineering}
Tools: {MCPs + skills used this stage}
════════════════════════════════════════════════════════════════
```

**Commit cadence:** Commit at the end of each stage with a conventional-commit message prefixed `feat(stageN):` or `chore(stageN):`. In Run 1, commit locally only (no push). In Run 2, `git push` at the end of Stage 11.

**DB reset between runs:** Before Run 2, execute the reset SQL in §"DB Reset" below.

---

## File Structure (final state after Stage 11)

```
.
├── .claude/settings.json          # hooks + permissions
├── .specify/                      # Spec-Kit state (generated)
├── .env.example                   # env var template
├── .env.local                     # gitignored, real secrets
├── AGENTS.md                      # tool-agnostic agent guide
├── CLAUDE.md                      # Claude Code guide
├── README.md                      # public-facing docs
├── next.config.ts                 # Next.js config
├── package.json
├── playwright.config.ts           # video:'on', chromium project
├── postcss.config.mjs
├── tailwind.config.ts             # Tailwind v4 config
├── tsconfig.json
├── vercel.ts                      # Vercel project config
├── components.json                # shadcn config
├── public/                        # static assets
├── specs/001-p2p-payment-request/
│   ├── spec.md                    # from /specify
│   ├── plan.md                    # from /plan
│   └── tasks.md                   # from /tasks
├── supabase/
│   └── migrations/
│       ├── 0001_init.sql          # schema + RLS + triggers + view
│       └── 0002_seed_users.sql    # two test users
├── src/
│   ├── middleware.ts              # auth guard on /dashboard, /requests
│   ├── app/
│   │   ├── layout.tsx             # root layout + Toaster
│   │   ├── globals.css
│   │   ├── page.tsx               # landing → redirect to /dashboard or /login
│   │   ├── login/page.tsx         # email+password form
│   │   ├── signup/page.tsx        # signup form
│   │   ├── auth/callback/route.ts # supabase auth callback
│   │   ├── (protected)/
│   │   │   ├── layout.tsx         # header + user context
│   │   │   ├── dashboard/page.tsx # tabs + filters + search
│   │   │   └── requests/
│   │   │       ├── new/page.tsx   # create request form
│   │   │       ├── [id]/page.tsx  # detail view
│   │   │       └── [id]/success/page.tsx
│   │   ├── pay/[link]/page.tsx    # public shareable page
│   │   └── api/requests/
│   │       ├── route.ts           # POST create, GET list
│   │       ├── [id]/route.ts      # GET single
│   │       ├── [id]/pay/route.ts
│   │       ├── [id]/decline/route.ts
│   │       ├── [id]/cancel/route.ts
│   │       └── share/[link]/route.ts
│   ├── components/
│   │   ├── header.tsx
│   │   ├── request-form.tsx
│   │   ├── request-card.tsx
│   │   ├── request-detail.tsx
│   │   ├── dashboard-tabs.tsx
│   │   ├── status-badge.tsx
│   │   ├── countdown-timer.tsx
│   │   └── ui/                    # shadcn primitives
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts          # browser client
│       │   ├── server.ts          # server client (cookies)
│       │   └── middleware.ts      # session refresh helper
│       ├── types.ts               # generated + hand-written types
│       ├── validators.ts          # Zod schemas
│       ├── money.ts               # cents/dollars helpers
│       ├── expiration.ts          # isExpired, formatCountdown
│       └── utils.ts               # cn() + misc
└── tests/
    ├── fixtures.ts                # test auth helpers, seed helpers
    ├── auth.spec.ts
    ├── signup-flow.spec.ts
    ├── create-request.spec.ts
    ├── dashboard.spec.ts
    ├── pay-request.spec.ts
    ├── decline-request.spec.ts
    ├── cancel-request.spec.ts
    ├── expiration.spec.ts
    ├── shareable-link.spec.ts
    └── responsive.spec.ts
```

---

## Stage 0 — Infra Setup (Pre-Video)

**Goal:** Video açılmadan önce tüm altyapı hazır olsun. Video'da sadece spec→code→deploy görünsün.

**Banner:** (no banner — video not on)

### Task 0.1: Clone repo + install Next.js scaffold

**Files:**
- Create: all repo contents from `create-next-app`

- [ ] **Step 1: Confirm working directory is empty**

```bash
cd /Users/ragipgunay/Desktop/Desktop/projects/lovieco
ls -la
```
Expected: only `.` and `..` (plus `docs/` from brainstorming).

- [ ] **Step 2: Clone empty GitHub repo into this dir**

```bash
cd /Users/ragipgunay/Desktop/Desktop/projects/lovieco
git clone https://github.com/RgpGny/lovie-payment-task.git tmp-clone
mv tmp-clone/.git .
rm -rf tmp-clone
git status
```
Expected: `On branch main` with `docs/` untracked.

- [ ] **Step 3: Scaffold Next.js (allow write in non-empty dir)**

```bash
npx create-next-app@latest . \
  --typescript --tailwind --app --src-dir \
  --no-eslint --import-alias "@/*" --use-npm --yes
```
Expected: `src/app/page.tsx`, `package.json`, `tsconfig.json`, etc. created. If it refuses due to non-empty dir, move `docs/` temporarily:
```bash
mv docs /tmp/lovie-docs && npx create-next-app@latest . ... && mv /tmp/lovie-docs docs
```

- [ ] **Step 4: Install runtime deps**

```bash
npm install @supabase/ssr @supabase/supabase-js zod nanoid sonner lucide-react \
  class-variance-authority clsx tailwind-merge
```

- [ ] **Step 5: Install dev deps**

```bash
npm install -D @playwright/test prettier eslint eslint-config-next @types/node
npx playwright install chromium
```

- [ ] **Step 6: Init shadcn**

```bash
npx shadcn@latest init --yes --defaults
npx shadcn@latest add --yes button card input label badge tabs sonner dropdown-menu
```

- [ ] **Step 7: Install Spec-Kit**

```bash
uvx --from git+https://github.com/github/spec-kit specify init --here --ai claude
ls -la .specify .claude/commands
```
Expected: `.specify/` directory exists; `.claude/commands/` contains `specify.md`, `plan.md`, `tasks.md`, `implement.md`.

- [ ] **Step 8: Commit scaffold**

```bash
git add -A
git commit -m "chore(stage0): scaffold Next.js + deps + shadcn + Spec-Kit"
```

### Task 0.2: Configure Supabase link via MCP

**Files:**
- Create: `.env.example`, `.env.local`

- [ ] **Step 1: Fetch Supabase project URL + anon key via MCP**

Call `mcp__supabase__get_project_url` (returns `https://omxnewprtonfxtalzmco.supabase.co`). Call `mcp__supabase__get_publishable_keys` (returns anon key).

- [ ] **Step 2: Write `.env.example`**

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 3: Write `.env.local`**

Populate with actual values from MCP. Service role key comes from user — prompt: "Paste SUPABASE_SERVICE_ROLE_KEY (Dashboard → Settings → API)".

- [ ] **Step 4: Verify .env.local is gitignored**

```bash
grep -q "^.env\*\.local" .gitignore && echo OK || echo FAIL
```

### Task 0.3: Configure Vercel link

**Files:**
- Create: `vercel.ts`, `.vercel/project.json` (auto)

- [ ] **Step 1: Link to Vercel project**

```bash
vercel link --yes --project lovie-payment-task
```
If project doesn't exist yet, create it in the Vercel dashboard with that name first, then re-run.

- [ ] **Step 2: Push env vars to Vercel**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production < <(echo $NEXT_PUBLIC_SUPABASE_URL)
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production < <(echo $NEXT_PUBLIC_SUPABASE_ANON_KEY)
vercel env add SUPABASE_SERVICE_ROLE_KEY production < <(echo $SUPABASE_SERVICE_ROLE_KEY)
```
Or use the Vercel dashboard once.

- [ ] **Step 3: Create `vercel.ts`**

```ts
// vercel.ts
import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: 'npm run build',
};
```

### Task 0.4: Add Playwright MCP to Claude Code

- [ ] **Step 1: Register MCP at project scope**

```bash
claude mcp add playwright --scope project -- npx @playwright/mcp@latest
```

- [ ] **Step 2: Verify it appears**

```bash
claude mcp list | grep playwright
```
Expected: `playwright: npx @playwright/mcp@latest`.

### Task 0.5: Write AI config files

**Files:**
- Create: `CLAUDE.md`, `AGENTS.md`, `.claude/settings.json`

- [ ] **Step 1: Write `CLAUDE.md`**

```md
# PayRequest

P2P payment request web app built for the Lovie interview assignment.

## Stack
Next.js 16 App Router + TypeScript strict, Supabase (Postgres + Auth + RLS), Tailwind v4, shadcn/ui, Playwright, Vercel.

## Critical Rules
- **Money:** store as integer cents, never float. Display with Intl.NumberFormat USD.
- **Atomicity:** all state transitions use `WHERE status='pending' AND expires_at > now()` — never read-then-write.
- **RLS invariant:** users read/write only rows where `sender_id = auth.uid()` OR `recipient_email = auth.email()`.
- **Expiration:** derived at read time; no background job.
- **Validation:** Zod schema enforced on both client and server. Client validation is UX; server validation is trust.

## Commands
- `npm run dev` — dev server on :3000
- `npm run build` — production build (run before deploy)
- `npm run typecheck` — tsc --noEmit (runs in Stop hook)
- `npx playwright test` — E2E with video recording
- `npx playwright show-report` — HTML report

## File Boundaries
- `src/lib/` — pure utilities, Supabase clients, validators, money helpers. No React.
- `src/app/api/` — server-only route handlers. Validate with Zod. Return JSON.
- `src/app/(protected)/` — requires session (enforced by middleware).
- `src/components/` — shared UI. Keep pages thin; move logic into components.
- `supabase/migrations/` — SQL migrations. Apply via Supabase MCP.
- `tests/` — Playwright E2E only. No unit tests (keep it shippable in a day).

## Do Not
- Add magic-link auth, email notifications, multi-currency, phone numbers, or cron jobs — out of scope.
- Use floats for money anywhere.
- Update status without a `WHERE status='pending'` guard.
```

- [ ] **Step 2: Write `AGENTS.md`** (same content, header says "Agent Instructions")

```md
# Agent Instructions

(Contents same as CLAUDE.md above — kept in sync for tool-agnostic consumers.)
```

- [ ] **Step 3: Write `.claude/settings.json`**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "if [ -f \"$CLAUDE_FILE_PATH\" ] && [[ \"$CLAUDE_FILE_PATH\" =~ \\.(ts|tsx|js|jsx|json|md|css)$ ]]; then npx prettier --write \"$CLAUDE_FILE_PATH\" 2>/dev/null && npx eslint --fix \"$CLAUDE_FILE_PATH\" 2>/dev/null; fi"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "npx tsc --noEmit 2>&1 | head -20 || true" }
        ]
      }
    ]
  },
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(npx *)",
      "Bash(git status)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git diff *)",
      "Bash(vercel *)"
    ]
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md AGENTS.md .claude vercel.ts .env.example
git commit -m "chore(stage0): add CLAUDE.md, AGENTS.md, Claude settings, Vercel config"
```

---

## Stage 1 — `/specify` (spec.md)

**Banner:**
```
🎬 STAGE 1/11 — Specification
What: Using GitHub Spec-Kit to draft the executable specification for the P2P payment request feature.
Why it matters: A clear spec is the source of truth. AI tools implement specs, not prompts — ambiguity here becomes bugs later.
Tools: Spec-Kit `/specify`, superpowers:writing-clearly-and-concisely.
```

### Task 1.1: Invoke /specify

- [ ] **Step 1: Run `/specify` slash command**

Send to self: `/specify Build a P2P payment request feature: users request money from other users via email, recipients can pay/decline, senders can cancel, requests expire in 7 days, each has a shareable public link. See docs/superpowers/specs/2026-04-17-p2p-payment-design.md for the full brief.`

Expected output: `specs/001-p2p-payment-request/spec.md` created with user stories, requirements, edge cases.

- [ ] **Step 2: Verify spec has all sections**

```bash
grep -E "^#" specs/001-p2p-payment-request/spec.md
```
Expected headings: User Stories, Functional Requirements, Edge Cases, Non-Functional, Out of Scope.

- [ ] **Step 3: Commit**

```bash
git add specs/
git commit -m "feat(stage1): spec for P2P payment request feature"
```

---

## Stage 2 — `/plan` (plan.md)

**Banner:**
```
🎬 STAGE 2/11 — Technical Plan
What: Generating the technical plan with stack choices, data model, and architectural decisions.
Why it matters: Pinning down decisions up front avoids rework — things like "cents not floats" are cheap here, expensive later.
Tools: Spec-Kit `/plan`.
```

### Task 2.1: Invoke /plan

- [ ] **Step 1: Run `/plan`**

`/plan Use Next.js 16 App Router + TypeScript, Supabase (Postgres + Auth + RLS), Tailwind v4 + shadcn/ui, Playwright for E2E with video recording, Vercel for deployment. Money as integer cents. Atomic status transitions with WHERE status='pending'. Expiration is a read-time predicate, no cron.`

- [ ] **Step 2: Verify plan.md references the design doc's data model**

```bash
grep -iE "cents|RLS|share_link|expires_at" specs/001-p2p-payment-request/plan.md
```

- [ ] **Step 3: Commit**

```bash
git add specs/
git commit -m "feat(stage2): technical plan with stack and data model"
```

---

## Stage 3 — `/tasks` (tasks.md)

**Banner:**
```
🎬 STAGE 3/11 — Task Breakdown
What: Breaking the plan into numbered, phase-organized tasks for AI execution.
Why it matters: Task-sized units let me (and any agent) make steady, verifiable progress with small, reviewable commits.
Tools: Spec-Kit `/tasks`.
```

### Task 3.1: Invoke /tasks

- [ ] **Step 1: Run `/tasks`**

`/tasks Organize into 8 phases: (1) Database + Auth, (2) Core scaffold + middleware, (3) Create request flow, (4) Dashboard, (5) Pay/Decline/Cancel actions, (6) Expiration + Shareable link, (7) E2E tests, (8) Deploy.`

- [ ] **Step 2: Verify tasks.md has 40+ tasks**

```bash
grep -c "^- \[ \]" specs/001-p2p-payment-request/tasks.md
```
Expected: `≥ 40`.

- [ ] **Step 3: Commit**

```bash
git add specs/
git commit -m "feat(stage3): task breakdown across 8 phases"
```

---

## Stage 4 — Database & Authentication

**Banner:**
```
🎬 STAGE 4/11 — Database & Authentication
What: Creating the Postgres schema with Row Level Security policies and seeding two test users via the Supabase MCP.
Why it matters: RLS is the primary defense preventing one user from reading or mutating another user's payment requests — a fintech non-negotiable.
Tools: Supabase MCP (apply_migration, execute_sql), supabase-postgres-best-practices skill.
```

### Task 4.1: Schema migration

**Files:**
- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- supabase/migrations/0001_init.sql
create extension if not exists pgcrypto;

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create type request_status as enum ('pending','paid','declined','cancelled');

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
  cancelled_at timestamptz,
  check (sender_id is not null)
);

create index payment_requests_sender_idx on payment_requests (sender_id);
create index payment_requests_recipient_idx on payment_requests (recipient_email);
create index payment_requests_share_idx on payment_requests (share_link);

alter table profiles enable row level security;
alter table payment_requests enable row level security;

create policy profiles_read on profiles for select to authenticated using (true);
create policy profiles_self_insert on profiles for insert to authenticated
  with check (id = auth.uid());

create policy pr_read_involved on payment_requests for select to authenticated
  using (sender_id = auth.uid() or recipient_email = auth.email());

create policy pr_insert_sender on payment_requests for insert to authenticated
  with check (sender_id = auth.uid());

create policy pr_update_involved on payment_requests for update to authenticated
  using (sender_id = auth.uid() or recipient_email = auth.email());

create view public_requests as
  select id, share_link, amount_cents, note, status, expires_at, created_at,
    (select email from profiles where id = sender_id) as sender_email,
    recipient_email
  from payment_requests;
grant select on public_requests to anon, authenticated;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

- [ ] **Step 2: Apply via Supabase MCP**

Call `mcp__supabase__apply_migration` with `name: "0001_init"` and the SQL above.

- [ ] **Step 3: Verify tables exist**

Call `mcp__supabase__list_tables` on schema `public`. Expected: `profiles`, `payment_requests`, and view `public_requests`.

### Task 4.2: Seed test users

**Files:**
- Create: `supabase/migrations/0002_seed_users.sql` (for local record)

- [ ] **Step 1: Create users via Admin API (MCP execute_sql can call auth.users directly)**

Call `mcp__supabase__execute_sql`:

```sql
-- Seed two test users using Supabase Admin functions (requires service-role in MCP).
-- Note: MCP execute_sql runs as service role, so we can insert into auth.users.
-- Using the official auth function for password hashing:

-- Preferred: use Supabase CLI or the auth.admin.createUser via service role.
-- Inside MCP we can use the internal auth function:
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
)
values
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'alice@payrequest.test', crypt('password123', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email"}'::jsonb, '{}'::jsonb, false),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'bob@payrequest.test', crypt('password123', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email"}'::jsonb, '{}'::jsonb, false)
on conflict (email) do nothing;
```

If the direct-insert approach fails (Supabase has been tightening this), fall back to two sign-up calls via the Supabase JS client in a tiny Node script — but prefer SQL for determinism.

- [ ] **Step 2: Verify profiles were created by trigger**

```sql
select email from profiles order by email;
```
Expected: `alice@payrequest.test`, `bob@payrequest.test`.

- [ ] **Step 3: Write migration file for the repo record**

Same SQL above into `supabase/migrations/0002_seed_users.sql`.

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat(stage4): database schema, RLS policies, seed test users"
```

---

## Stage 5 — Core Scaffold

**Banner:**
```
🎬 STAGE 5/11 — Core Scaffold
What: Setting up Supabase clients for browser and server contexts, the auth-guard middleware, and the root layout with toaster.
Why it matters: Getting the auth plumbing right once means every protected route is safe by default — defense in depth.
Tools: @supabase/ssr, Next.js middleware.
```

### Task 5.1: Supabase clients

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Write browser client**

```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Write server client**

```ts
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* called from a Server Component — ignore */ }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Write middleware session-refresh helper**

```ts
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = pathname.startsWith('/dashboard') ||
                      pathname.startsWith('/requests');
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}
```

### Task 5.2: Next.js middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Write middleware.ts**

```ts
// src/middleware.ts
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### Task 5.3: Shared utilities

**Files:**
- Create: `src/lib/money.ts`, `src/lib/expiration.ts`, `src/lib/validators.ts`, `src/lib/types.ts`

- [ ] **Step 1: Write money helpers**

```ts
// src/lib/money.ts
export function centsToDollars(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
  }).format(cents / 100);
}

export function parseAmountToCents(input: string): number {
  const cleaned = input.trim().replace(/[^0-9.]/g, '');
  if (!cleaned) throw new Error('Amount required');
  const match = /^(\d+)(\.\d{1,2})?$/.exec(cleaned);
  if (!match) throw new Error('Invalid amount format');
  const dollars = parseFloat(cleaned);
  if (!Number.isFinite(dollars) || dollars <= 0) throw new Error('Amount must be positive');
  const cents = Math.round(dollars * 100);
  if (cents > 99_999_999) throw new Error('Amount too large');
  return cents;
}
```

- [ ] **Step 2: Write expiration helpers**

```ts
// src/lib/expiration.ts
export function isExpired(expiresAt: string | Date): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

export function formatCountdown(expiresAt: string | Date): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (d > 0) return `${d}d ${h}h remaining`;
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}
```

- [ ] **Step 3: Write Zod validators**

```ts
// src/lib/validators.ts
import { z } from 'zod';

export const createRequestSchema = z.object({
  recipientEmail: z.string().email().max(254).toLowerCase().trim(),
  amountCents: z.number().int().positive().max(99_999_999),
  note: z.string().max(200).optional().or(z.literal('')),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
```

- [ ] **Step 4: Write shared types**

```ts
// src/lib/types.ts
export type RequestStatus = 'pending' | 'paid' | 'declined' | 'cancelled';

export type PaymentRequest = {
  id: string;
  share_link: string;
  sender_id: string;
  recipient_email: string;
  amount_cents: number;
  note: string | null;
  status: RequestStatus;
  created_at: string;
  expires_at: string;
  paid_at: string | null;
  declined_at: string | null;
  cancelled_at: string | null;
};

export type PaymentRequestWithSender = PaymentRequest & {
  sender_email: string;
};

export type DerivedStatus = RequestStatus | 'expired';
```

### Task 5.4: Root layout + landing redirect

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Update root layout with Toaster**

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'PayRequest',
  description: 'P2P payment requests',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Landing redirect**

```tsx
// src/app/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  redirect(user ? '/dashboard' : '/login');
}
```

### Task 5.5: Login + signup pages

**Files:**
- Create: `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/auth/callback/route.ts`

- [ ] **Step 1: Write login page**

```tsx
// src/app/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const next = useSearchParams().get('next') ?? '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    router.push(next);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter your email and password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              No account? <Link href="/signup" className="underline">Sign up</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 2: Write signup page** (structurally mirrors login; calls `signUp` and redirects to `/login?signedup=1`)

```tsx
// src/app/signup/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Account created. You can sign in now.');
    router.push('/login');
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Email + password, instant access.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password (6+ chars)</Label>
              <Input id="password" type="password" required minLength={6} autoComplete="new-password"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating…' : 'Create account'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Have an account? <Link href="/login" className="underline">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 3: Write auth callback**

```ts
// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
```

### Task 5.6: Protected layout + header

**Files:**
- Create: `src/app/(protected)/layout.tsx`, `src/components/header.tsx`

- [ ] **Step 1: Protected layout**

```tsx
// src/app/(protected)/layout.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return (
    <>
      <Header email={user.email ?? ''} />
      <main className="mx-auto max-w-3xl p-4 sm:p-6">{children}</main>
    </>
  );
}
```

- [ ] **Step 2: Header component**

```tsx
// src/components/header.tsx
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function Header({ email }: { email: string }) {
  const router = useRouter();
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 p-4">
        <Link href="/dashboard" className="font-semibold">PayRequest</Link>
        <div className="flex items-center gap-2">
          <Button asChild size="sm"><Link href="/requests/new"><Plus className="mr-1 size-4"/>New</Link></Button>
          <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
```

### Task 5.7: Verify + commit

- [ ] **Step 1: Type check**

```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 2: Dev server smoke**

```bash
npm run dev
```
In another shell: `curl -sSL -o /dev/null -w "%{http_code}\n" http://localhost:3000/`. Expected: `307` (redirect to `/login`).

Kill dev server.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(stage5): Supabase clients, middleware, login/signup, protected layout"
```

---

## Stage 6 — Create Request Flow

**Banner:**
```
🎬 STAGE 6/11 — Create Request Flow
What: Building the form, the POST /api/requests route with Zod validation, and the toast-based success feedback.
Why it matters: Every fintech mutation needs server-side validation — the client can be bypassed, the server can't.
Tools: shadcn/ui, Zod, nanoid.
```

### Task 6.1: POST /api/requests route

**Files:**
- Create: `src/app/api/requests/route.ts`

- [ ] **Step 1: Write route handler**

```ts
// src/app/api/requests/route.ts
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createClient } from '@/lib/supabase/server';
import { createRequestSchema } from '@/lib/validators';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { recipientEmail, amountCents, note } = parsed.data;

  if (recipientEmail === user.email?.toLowerCase()) {
    return NextResponse.json({ error: 'Cannot request from yourself' }, { status: 400 });
  }

  const shareLink = nanoid(10);
  const { data, error } = await supabase
    .from('payment_requests')
    .insert({
      sender_id: user.id,
      recipient_email: recipientEmail,
      amount_cents: amountCents,
      note: note || null,
      share_link: shareLink,
    })
    .select('id, share_link')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('payment_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

### Task 6.2: Request form

**Files:**
- Create: `src/components/request-form.tsx`, `src/app/(protected)/requests/new/page.tsx`

- [ ] **Step 1: Form component**

```tsx
// src/components/request-form.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { parseAmountToCents } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function RequestForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    let amountCents: number;
    try { amountCents = parseAmountToCents(String(fd.get('amount') ?? '')); }
    catch (err) { toast.error((err as Error).message); return; }

    setLoading(true);
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        recipientEmail: String(fd.get('recipientEmail') ?? '').toLowerCase().trim(),
        amountCents,
        note: String(fd.get('note') ?? ''),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? 'Could not create request');
      return;
    }
    const { id } = await res.json();
    toast.success('Request sent');
    router.push(`/requests/${id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recipientEmail">Recipient email</Label>
        <Input id="recipientEmail" name="recipientEmail" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (USD)</Label>
        <Input id="amount" name="amount" inputMode="decimal" placeholder="50.00" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" name="note" maxLength={200} placeholder="Dinner last night" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Sending…' : 'Send request'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Page wrapper**

```tsx
// src/app/(protected)/requests/new/page.tsx
import { RequestForm } from '@/components/request-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewRequestPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>New request</CardTitle>
        <CardDescription>Request money from someone. They can pay, decline, or ignore.</CardDescription>
      </CardHeader>
      <CardContent><RequestForm /></CardContent>
    </Card>
  );
}
```

### Task 6.3: Verify + commit

- [ ] **Step 1: Type check + build**

```bash
npm run typecheck && npm run build
```

- [ ] **Step 2: Manual smoke via Playwright MCP**

Use `mcp__playwright__*` tools: navigate to `http://localhost:3000/login`, sign in as `alice@payrequest.test / password123`, click "New", fill form (`bob@payrequest.test`, `50`, `dinner`), submit, confirm URL changes to `/requests/<uuid>` and toast shows "Request sent".

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(stage6): create request API + form"
```

---

## Stage 7 — Dashboard

**Banner:**
```
🎬 STAGE 7/11 — Dashboard
What: Building the dashboard with Incoming/Outgoing tabs, status filter, search, and formatted request cards.
Why it matters: The dashboard is where the user spends most of their time — status visibility drives trust in a fintech product.
Tools: shadcn Tabs + Badge, Intl.NumberFormat.
```

### Task 7.1: Status badge + request card

**Files:**
- Create: `src/components/status-badge.tsx`, `src/components/request-card.tsx`

- [ ] **Step 1: Status badge**

```tsx
// src/components/status-badge.tsx
import { Badge } from '@/components/ui/badge';
import type { DerivedStatus } from '@/lib/types';

const map: Record<DerivedStatus, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-amber-100 text-amber-900 hover:bg-amber-100' },
  paid:      { label: 'Paid',      className: 'bg-green-100 text-green-900 hover:bg-green-100' },
  declined:  { label: 'Declined',  className: 'bg-red-100 text-red-900 hover:bg-red-100' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
  expired:   { label: 'Expired',   className: 'bg-gray-100 text-gray-500 line-through hover:bg-gray-100' },
};

export function StatusBadge({ status }: { status: DerivedStatus }) {
  const s = map[status];
  return <Badge className={s.className} variant="secondary">{s.label}</Badge>;
}
```

- [ ] **Step 2: Request card**

```tsx
// src/components/request-card.tsx
import Link from 'next/link';
import { centsToDollars } from '@/lib/money';
import { isExpired } from '@/lib/expiration';
import { StatusBadge } from '@/components/status-badge';
import type { PaymentRequest, DerivedStatus } from '@/lib/types';

export function deriveStatus(r: PaymentRequest): DerivedStatus {
  if (r.status === 'pending' && isExpired(r.expires_at)) return 'expired';
  return r.status;
}

export function RequestCard({ r, view }: { r: PaymentRequest; view: 'incoming' | 'outgoing' }) {
  const status = deriveStatus(r);
  const who = view === 'incoming' ? 'From' : 'To';
  const whoAddr = view === 'incoming'
    ? (r as PaymentRequest & { sender_email?: string }).sender_email ?? '…'
    : r.recipient_email;
  return (
    <Link href={`/requests/${r.id}`} className="block rounded-lg border p-4 transition hover:bg-muted/50">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="truncate text-sm text-muted-foreground">{who} <span className="font-medium">{whoAddr}</span></div>
          {r.note && <div className="truncate text-sm">{r.note}</div>}
          <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="text-lg font-semibold tabular-nums">{centsToDollars(r.amount_cents)}</div>
          <StatusBadge status={status} />
        </div>
      </div>
    </Link>
  );
}
```

### Task 7.2: Dashboard tabs + filter

**Files:**
- Create: `src/components/dashboard-tabs.tsx`, `src/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Dashboard page (server component, fetches list)**

```tsx
// src/app/(protected)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server';
import { DashboardTabs } from '@/components/dashboard-tabs';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: outgoing = [] } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('sender_id', user!.id)
    .order('created_at', { ascending: false });

  // For incoming we also want the sender_email to show.
  const { data: incomingRaw = [] } = await supabase
    .from('payment_requests')
    .select('*, sender:profiles!payment_requests_sender_id_fkey(email)')
    .eq('recipient_email', user!.email ?? '')
    .order('created_at', { ascending: false });

  type Row = (typeof incomingRaw)[number] & { sender: { email: string } | null };
  const incoming = (incomingRaw as Row[]).map((r) => ({ ...r, sender_email: r.sender?.email ?? '' }));

  return <DashboardTabs incoming={incoming} outgoing={outgoing ?? []} />;
}
```

- [ ] **Step 2: Tabs component (client, handles filter + search)**

```tsx
// src/components/dashboard-tabs.tsx
'use client';
import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { RequestCard, deriveStatus } from '@/components/request-card';
import type { PaymentRequest, DerivedStatus } from '@/lib/types';

type Incoming = PaymentRequest & { sender_email: string };
const STATUSES: Array<'all' | DerivedStatus> = ['all','pending','paid','declined','cancelled','expired'];

export function DashboardTabs({ incoming, outgoing }: { incoming: Incoming[]; outgoing: PaymentRequest[] }) {
  const [status, setStatus] = useState<typeof STATUSES[number]>('all');
  const [q, setQ] = useState('');

  const filterFn = (list: PaymentRequest[], view: 'incoming' | 'outgoing') => list.filter(r => {
    const derived = deriveStatus(r);
    if (status !== 'all' && derived !== status) return false;
    if (!q) return true;
    const needle = q.toLowerCase();
    const hay = view === 'incoming'
      ? (r as Incoming).sender_email
      : r.recipient_email;
    return hay.toLowerCase().includes(needle) || (r.note ?? '').toLowerCase().includes(needle);
  });

  const filteredIn = useMemo(() => filterFn(incoming, 'incoming'), [incoming, status, q]);
  const filteredOut = useMemo(() => filterFn(outgoing, 'outgoing'), [outgoing, status, q]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_200px]">
        <Input placeholder="Search email or note…" value={q} onChange={e => setQ(e.target.value)} />
        <select
          aria-label="Filter by status"
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={status} onChange={e => setStatus(e.target.value as typeof STATUSES[number])}
        >
          {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>
      <Tabs defaultValue="incoming">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="incoming">Incoming ({filteredIn.length})</TabsTrigger>
          <TabsTrigger value="outgoing">Outgoing ({filteredOut.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="incoming" className="space-y-2">
          {filteredIn.length === 0
            ? <p className="p-6 text-center text-sm text-muted-foreground">No incoming requests.</p>
            : filteredIn.map(r => <RequestCard key={r.id} r={r} view="incoming" />)}
        </TabsContent>
        <TabsContent value="outgoing" className="space-y-2">
          {filteredOut.length === 0
            ? <p className="p-6 text-center text-sm text-muted-foreground">No outgoing requests.</p>
            : filteredOut.map(r => <RequestCard key={r.id} r={r} view="outgoing" />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Task 7.3: Verify + commit

- [ ] **Step 1: Type check + manual smoke**

```bash
npm run typecheck && npm run build
```

- [ ] **Step 2: Playwright MCP visual check**

Sign in, open `/dashboard`, verify both tabs render, search filters, status filter works.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(stage7): dashboard with tabs, search, status filter"
```

---

## Stage 8 — Pay / Decline / Cancel

**Banner:**
```
🎬 STAGE 8/11 — Pay / Decline / Cancel
What: Implementing the three state-transition API routes with atomic updates, plus the detail page buttons.
Why it matters: "WHERE status = pending" is the single line that prevents double-payment race conditions — the heart of fintech correctness.
Tools: Supabase row-level update with returning, shadcn Button variants.
```

### Task 8.1: Detail API route

**Files:**
- Create: `src/app/api/requests/[id]/route.ts`

- [ ] **Step 1: Write GET handler**

```ts
// src/app/api/requests/[id]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('payment_requests')
    .select('*, sender:profiles!payment_requests_sender_id_fkey(email)')
    .eq('id', id)
    .single();
  if (error?.code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

### Task 8.2: Pay / Decline / Cancel routes

**Files:**
- Create: `src/app/api/requests/[id]/pay/route.ts`, `src/app/api/requests/[id]/decline/route.ts`, `src/app/api/requests/[id]/cancel/route.ts`

- [ ] **Step 1: Pay route (with 2.5s simulation)**

```ts
// src/app/api/requests/[id]/pay/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await new Promise((r) => setTimeout(r, 2500));

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('payment_requests')
    .update({ status: 'paid', paid_at: nowIso })
    .eq('id', id)
    .eq('status', 'pending')
    .eq('recipient_email', user.email ?? '')
    .gt('expires_at', nowIso)
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Request is no longer payable' }, { status: 410 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Decline route**

```ts
// src/app/api/requests/[id]/decline/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('payment_requests')
    .update({ status: 'declined', declined_at: nowIso })
    .eq('id', id)
    .eq('status', 'pending')
    .eq('recipient_email', user.email ?? '')
    .gt('expires_at', nowIso)
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Request is no longer declinable' }, { status: 410 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Cancel route**

```ts
// src/app/api/requests/[id]/cancel/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('payment_requests')
    .update({ status: 'cancelled', cancelled_at: nowIso })
    .eq('id', id)
    .eq('status', 'pending')
    .eq('sender_id', user.id)
    .gt('expires_at', nowIso)
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Request is no longer cancellable' }, { status: 410 });
  return NextResponse.json({ ok: true });
}
```

### Task 8.3: Detail page + success page

**Files:**
- Create: `src/components/request-detail.tsx`, `src/app/(protected)/requests/[id]/page.tsx`, `src/app/(protected)/requests/[id]/success/page.tsx`, `src/components/countdown-timer.tsx`

- [ ] **Step 1: Countdown timer**

```tsx
// src/components/countdown-timer.tsx
'use client';
import { useEffect, useState } from 'react';
import { formatCountdown, isExpired } from '@/lib/expiration';

export function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [text, setText] = useState(() => formatCountdown(expiresAt));
  const expired = isExpired(expiresAt);
  useEffect(() => {
    if (expired) return;
    const id = setInterval(() => setText(formatCountdown(expiresAt)), 30_000);
    return () => clearInterval(id);
  }, [expiresAt, expired]);
  const danger = !expired && (new Date(expiresAt).getTime() - Date.now() < 86_400_000);
  return <span className={danger ? 'text-red-600' : 'text-muted-foreground'}>{text}</span>;
}
```

- [ ] **Step 2: Detail component**

```tsx
// src/components/request-detail.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { CountdownTimer } from '@/components/countdown-timer';
import { centsToDollars } from '@/lib/money';
import { isExpired } from '@/lib/expiration';
import type { PaymentRequest, DerivedStatus } from '@/lib/types';

type Props = {
  r: PaymentRequest & { sender_email?: string };
  viewerEmail: string;
  viewerId: string;
};

export function RequestDetail({ r, viewerEmail, viewerId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<'pay' | 'decline' | 'cancel' | null>(null);

  const derived: DerivedStatus = r.status === 'pending' && isExpired(r.expires_at) ? 'expired' : r.status;
  const isRecipient = r.recipient_email === viewerEmail.toLowerCase();
  const isSender = r.sender_id === viewerId;
  const canAct = derived === 'pending';

  async function act(kind: 'pay' | 'decline' | 'cancel') {
    setLoading(kind);
    const res = await fetch(`/api/requests/${r.id}/${kind}`, { method: 'POST' });
    setLoading(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? 'Action failed');
      return;
    }
    if (kind === 'pay') { router.push(`/requests/${r.id}/success`); return; }
    toast.success(kind === 'decline' ? 'Request declined' : 'Request cancelled');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="text-4xl font-semibold tabular-nums">{centsToDollars(r.amount_cents)}</div>
        <StatusBadge status={derived} />
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-muted-foreground">From</dt><dd>{r.sender_email ?? '…'}</dd>
        <dt className="text-muted-foreground">To</dt><dd>{r.recipient_email}</dd>
        {r.note && (<><dt className="text-muted-foreground">Note</dt><dd>{r.note}</dd></>)}
        <dt className="text-muted-foreground">Sent</dt><dd>{new Date(r.created_at).toLocaleString()}</dd>
        <dt className="text-muted-foreground">Expires</dt><dd><CountdownTimer expiresAt={r.expires_at} /></dd>
      </dl>
      <div className="flex flex-wrap gap-2">
        {isRecipient && canAct && (<>
          <Button disabled={loading !== null} onClick={() => act('pay')}>
            {loading === 'pay' ? 'Processing…' : `Pay ${centsToDollars(r.amount_cents)}`}
          </Button>
          <Button variant="outline" disabled={loading !== null} onClick={() => act('decline')}>
            {loading === 'decline' ? 'Declining…' : 'Decline'}
          </Button>
        </>)}
        {isSender && canAct && (
          <Button variant="outline" disabled={loading !== null} onClick={() => act('cancel')}>
            {loading === 'cancel' ? 'Cancelling…' : 'Cancel request'}
          </Button>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        Share link: <code>{typeof window !== 'undefined' ? `${location.origin}/pay/${r.share_link}` : `/pay/${r.share_link}`}</code>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Detail page**

```tsx
// src/app/(protected)/requests/[id]/page.tsx
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RequestDetail } from '@/components/request-detail';

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: r } = await supabase
    .from('payment_requests')
    .select('*, sender:profiles!payment_requests_sender_id_fkey(email)')
    .eq('id', id)
    .maybeSingle();

  if (!r) notFound();
  const withSender = { ...r, sender_email: (r as { sender?: { email: string } }).sender?.email };

  return <RequestDetail r={withSender} viewerEmail={user!.email ?? ''} viewerId={user!.id} />;
}
```

- [ ] **Step 4: Success page**

```tsx
// src/app/(protected)/requests/[id]/success/page.tsx
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SuccessPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <CheckCircle2 className="size-16 text-green-600" />
      <h1 className="text-2xl font-semibold">Payment sent</h1>
      <p className="text-muted-foreground">Your payment has been processed.</p>
      <Button asChild><Link href="/dashboard">Back to dashboard</Link></Button>
    </div>
  );
}
```

### Task 8.4: Verify + commit

- [ ] **Step 1: Type check + manual smoke**

```bash
npm run typecheck && npm run build
```

- [ ] **Step 2: Playwright MCP: full pay flow**

Sign in as Alice → create request to Bob → sign out → sign in as Bob → /dashboard → click request → Pay → success page.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(stage8): pay/decline/cancel API + detail + success pages"
```

---

## Stage 9 — Expiration + Shareable Link

**Banner:**
```
🎬 STAGE 9/11 — Expiration & Shareable Links
What: Enforcing 7-day expiration at read time and building the public /pay/[link] page.
Why it matters: Derived expiration avoids a cron job — simpler operations and a single source of truth.
Tools: SQL view, Next.js dynamic routes.
```

### Task 9.1: Public share route

**Files:**
- Create: `src/app/api/requests/share/[link]/route.ts`

- [ ] **Step 1: Write route (reads from public_requests view)**

```ts
// src/app/api/requests/share/[link]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: Request, ctx: { params: Promise<{ link: string }> }) {
  const { link } = await ctx.params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('public_requests')
    .select('*')
    .eq('share_link', link)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}
```

### Task 9.2: Public page

**Files:**
- Create: `src/app/pay/[link]/page.tsx`

- [ ] **Step 1: Write page**

```tsx
// src/app/pay/[link]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { centsToDollars } from '@/lib/money';
import { isExpired, formatCountdown } from '@/lib/expiration';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';

export default async function PublicPayPage({ params }: { params: Promise<{ link: string }> }) {
  const { link } = await params;
  const supabase = await createClient();
  const { data: r } = await supabase
    .from('public_requests').select('*').eq('share_link', link).maybeSingle();
  if (!r) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const viewerIsRecipient = user?.email?.toLowerCase() === r.recipient_email;
  const derived = r.status === 'pending' && isExpired(r.expires_at) ? 'expired' : r.status;

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <div className="text-center text-lg font-semibold">Payment request</div>
      <div className="text-center text-5xl font-semibold tabular-nums">{centsToDollars(r.amount_cents)}</div>
      <div className="flex justify-center"><StatusBadge status={derived} /></div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-muted-foreground">From</dt><dd>{r.sender_email}</dd>
        <dt className="text-muted-foreground">To</dt><dd>{r.recipient_email}</dd>
        {r.note && (<><dt className="text-muted-foreground">Note</dt><dd>{r.note}</dd></>)}
        <dt className="text-muted-foreground">Expires</dt><dd>{formatCountdown(r.expires_at)}</dd>
      </dl>
      <div className="flex justify-center">
        {derived !== 'pending' ? (
          <p className="text-sm text-muted-foreground">This request is {derived} and can no longer be paid.</p>
        ) : viewerIsRecipient ? (
          <Button asChild><Link href={`/requests/${r.id}`}>Open to pay or decline</Link></Button>
        ) : user ? (
          <p className="text-sm text-muted-foreground">Sign in as {r.recipient_email} to pay this request.</p>
        ) : (
          <Button asChild><Link href={`/login?next=/pay/${r.share_link}`}>Sign in to continue</Link></Button>
        )}
      </div>
    </main>
  );
}
```

### Task 9.3: Verify + commit

- [ ] **Step 1: Type check + manual smoke**

```bash
npm run typecheck && npm run build
```

- [ ] **Step 2: Playwright MCP: public share link**

Create request as Alice, copy share_link, open `/pay/<link>` in an incognito context, verify status + amount visible, "Sign in to continue" button works.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(stage9): shareable link public page + API"
```

---

## Stage 10 — E2E Tests

**Banner:**
```
🎬 STAGE 10/11 — End-to-End Tests
What: Writing ten Playwright spec files in parallel via the test-agent, each recording video of the flow.
Why it matters: Automated videos of passing tests are both the regression suite and the submission artifact.
Tools: Playwright, test-agent subagent (parallel), superpowers:test-driven-development.
```

### Task 10.1: Playwright config

**Files:**
- Create: `playwright.config.ts`

- [ ] **Step 1: Write config**

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    video: 'on',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 2: Fixtures**

```ts
// tests/fixtures.ts
import { test as base, expect, type Page } from '@playwright/test';

export async function login(page: Page, email: string, password = 'password123') {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

export const test = base;
export { expect };
```

### Task 10.2: Dispatch test-agent to write all specs

- [ ] **Step 1: Dispatch subagent**

Use `Agent` tool with `subagent_type: "test-agent"`. Prompt should contain:
- The list of 10 specs required (names listed in the design doc §12).
- The fixtures file signature (`login(page, email)`).
- The seeded user credentials.
- The expected routes (`/login`, `/signup`, `/dashboard`, `/requests/new`, `/requests/[id]`, `/pay/[link]`).
- Requirement: each spec must have ≥ 1 test, assert visible UI (not internal APIs), rely on the `login` fixture, use role-based locators.

Save subagent output to `tests/*.spec.ts`.

- [ ] **Step 2: Run the suite**

```bash
npx playwright test
```
Expected: all tests pass, videos at `test-results/<test-name>/video.webm`.

- [ ] **Step 3: If any fail, iterate**

Playwright MCP to reproduce failure visually, adjust selectors or backend behavior, re-run. Keep the build green before the commit below.

- [ ] **Step 4: Commit**

```bash
git add tests playwright.config.ts
git commit -m "feat(stage10): Playwright E2E suite with video recording"
```

---

## Stage 11 — Deploy + Demo

**Banner:**
```
🎬 STAGE 11/11 — Deploy & Demo
What: Shipping to Vercel production, confirming env vars, walking through the live app, linking everything from the README.
Why it matters: "Done" means running in production with a public URL — anything less is a prototype.
Tools: Vercel CLI, vercel:deploy skill.
```

### Task 11.1: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

```md
# PayRequest — P2P Payment Request

A peer-to-peer payment request app built for the Lovie first-interview assignment. Request money, pay, decline, cancel, share a link, watch requests expire. All spec-driven, all AI-native.

## Live Demo
https://lovie-payment-task.vercel.app

## Build Video
<YouTube link inserted after Run 2 recording>

## Features
- Email + password auth (Supabase)
- Create / list / pay / decline / cancel / share payment requests
- 7-day expiration with live countdown
- Row-Level-Security isolation per user
- Public shareable link page
- Responsive (mobile → desktop)

## Tech Stack
Next.js 16 (App Router) · TypeScript · Supabase (Postgres + Auth + RLS) · Tailwind v4 · shadcn/ui · Playwright · Vercel.

## AI-Native Setup
- Claude Code (Opus) with Supabase MCP, Playwright MCP
- GitHub Spec-Kit for `/specify` → `/plan` → `/tasks` → `/implement`
- PostToolUse hooks (prettier + eslint), Stop hooks (tsc --noEmit)

## Money Discipline
Amounts stored as integer cents. All status transitions are atomic `WHERE status='pending' AND expires_at > now()`. Server-side Zod validation on every mutation.

## Local Setup
```sh
git clone https://github.com/RgpGny/lovie-payment-task.git
cd lovie-payment-task
npm install
cp .env.example .env.local  # fill in Supabase values
# Apply migrations via Supabase dashboard or CLI
npm run dev
```

## Tests
```sh
npx playwright install chromium
npx playwright test         # run E2E with video recording
npx playwright show-report  # view HTML report
```
Videos saved to `test-results/`.

## Spec-Kit Artifacts
- `specs/001-p2p-payment-request/spec.md`
- `specs/001-p2p-payment-request/plan.md`
- `specs/001-p2p-payment-request/tasks.md`

## License
MIT
```

### Task 11.2: Production deploy

- [ ] **Step 1: Verify build passes locally**

```bash
npm run build
```

- [ ] **Step 2: Confirm Vercel env vars**

```bash
vercel env ls
```
Expected: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` for `production`.

- [ ] **Step 3: Deploy**

```bash
vercel --prod --yes
```
Capture the `https://…vercel.app` URL from output.

- [ ] **Step 4: Update README with live URL**

Replace the placeholder domain with the actual production URL, commit.

- [ ] **Step 5: Smoke the live URL via Playwright MCP**

Navigate to the live URL, log in, create + pay a request, confirm status transitions.

### Task 11.3: Final commit + push (Run 2 only)

- [ ] **Step 1: Commit remaining changes**

```bash
git add -A
git commit -m "feat(stage11): deploy to Vercel production, publish live URL"
```

- [ ] **Step 2: Push to GitHub**

```bash
git push -u origin main
```

- [ ] **Step 3: Record video outro, end recording**

---

## DB Reset (between Run 1 and Run 2)

Before Run 2, clean Supabase state:

```sql
-- Call via mcp__supabase__execute_sql
drop view if exists public_requests;
drop table if exists payment_requests;
drop table if exists profiles;
drop type if exists request_status;
drop function if exists handle_new_user cascade;
delete from auth.users where email in ('alice@payrequest.test','bob@payrequest.test');
```

Also clean local dir:

```bash
cd /Users/ragipgunay/Desktop/Desktop/projects/lovieco
rm -rf !(docs|.git) 2>/dev/null
rm -rf .next .vercel .specify .claude node_modules
# Keep only docs/ and .git/ for design/plan history
git checkout -- .  # if anything lingers
```

Vercel project can stay — redeploy overwrites.

---

## Self-Review Checklist

- ✅ Every design §4 feature (auth, create, dashboard, detail, share, pay, decline/cancel, expiration, responsive) has at least one stage task.
- ✅ Every design §5 data-model concept (profiles, payment_requests, status enum, share_link, expires_at, paid/declined/cancelled timestamps, RLS, view, trigger) appears in Stage 4.
- ✅ Every API route in design §6 has an implementation task in Stages 6, 8, or 9.
- ✅ Every fintech discipline item in design §7 is enforced (cents integer in `money.ts`, atomic WHERE in Stage 8 routes, server validation in Stage 6 POST, HTTP codes in each route, public view for share_link).
- ✅ Spec-Kit workflow (design §8) is Stages 1-3.
- ✅ 11 video stages (design §9) map to Stages 1-11 in this plan.
- ✅ English status banner (design §10) is documented and required at each stage start.
- ✅ AI config files (design §11) are produced in Task 0.5.
- ✅ 10 E2E tests (design §12) are produced in Task 10.2.
- ✅ Infra setup (design §13) is Stage 0.
- ✅ Nothing in design §14 (YAGNI) is implemented.
- ✅ No placeholders, TODOs, or "similar to above" references in this plan.
- ✅ Type / function signatures consistent across stages (`parseAmountToCents`, `centsToDollars`, `isExpired`, `formatCountdown`, `deriveStatus`, `StatusBadge`, `RequestCard`, `CountdownTimer`, `RequestDetail`, `DashboardTabs`).

---

## Execution Handoff

Plan complete. Two execution options:

1. **Subagent-Driven** — dispatch a fresh subagent per task, review between tasks. Better for unfamiliar territory, worse for a tight 3-4 hour timeline.
2. **Inline Execution** — execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints. Faster, better for a single-developer shipping sprint.

**Recommendation: Inline Execution.** We're building familiar patterns, time is the constraint, and the rehearsal is itself the safety net.
