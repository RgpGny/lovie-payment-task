<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# PayRequest — Agent Instructions

P2P payment request web app built for the Lovie interview assignment. These instructions apply to any AI coding agent working in this repo (Claude Code, Copilot, Codex, Gemini, etc.). `CLAUDE.md` imports this file with `@AGENTS.md`, so they are always in sync.

## Stack

Next.js 16 App Router + TypeScript strict, Supabase (Postgres + Auth + RLS), Tailwind v4, shadcn/ui, Playwright, Vercel.

## Critical Rules

- **Money:** store as integer cents, never float. Display with `Intl.NumberFormat` USD.
- **Atomicity:** all state transitions use `WHERE status='pending' AND expires_at > now()` — never read-then-write.
- **RLS invariant:** users read/write only rows where `sender_id = auth.uid()` OR `recipient_email = auth.email()`.
- **Expiration:** derived at read time; no background job.
- **Validation:** Zod schema enforced on both client and server. Client validation is UX; server validation is trust.

## Commands

- `npm run dev` — dev server on :3000
- `npm run build` — production build (run before deploy)
- `npm run typecheck` — `tsc --noEmit` (runs in Stop hook)
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
