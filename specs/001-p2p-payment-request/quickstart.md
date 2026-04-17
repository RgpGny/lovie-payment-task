# Quickstart — P2P Payment Request

## Prerequisites

- Node.js ≥ 20.19 (the repo ships `package.json` engines compatible with Node 24 LTS).
- `npm` ≥ 10.
- A Supabase project with the migrations in `supabase/migrations/` applied. For development this project uses `omxnewprtonfxtalzmco`.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` set in `.env.local`.

## Install & Run

```bash
npm install
npm run dev            # http://localhost:3000
```

Sign in as either of the seeded test users:

- `alice@payrequest.test` / `password123`
- `bob@payrequest.test` / `password123`

## End-to-End Tests

```bash
npx playwright test            # headless, video on, chromium
npx playwright show-report     # open the HTML report
```

Every test records a video under `test-results/`.

## Production Build

```bash
npm run build
npm start
```

## Deploy

```bash
vercel --prod --yes
```

Environment variables are already registered in the `lovie-payment-task` Vercel project.

## Resetting Local Supabase State

If you need to clean the database between rehearsal runs (before re-shooting the video), run:

```sql
-- via Supabase MCP mcp__supabase__execute_sql
delete from payment_requests;
delete from auth.users where email like '%@payrequest.test';
```

The profile row cascades from `auth.users` deletion. The next sign-up / seed recreates them.
