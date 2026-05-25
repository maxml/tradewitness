# CLAUDE.md — TradeWitness Agent Guidelines (Claude Code pass)

Generated via Claude Code as the second-pass IDE autogen (NH-4). This file
intentionally lives next to `GEMINI.md` so the two outputs can be compared
in `report.md`. When both files are present, treat `CLAUDE.md` as the
source of truth for Claude Code sessions; `GEMINI.md` stays for Gemini CLI.

## 1. Overview
TradeWitness is a Turborepo monorepo split into a marketing/blog site
(`apps/landing`) and an authenticated trading-journal SaaS (`apps/app`).
Traders log trades, upload screenshots (later parsed by OCR), and get a
"Discipline Score" derived from rule adherence. Mentors view aggregated
stats. The repo was assembled from two donor codebases, so the two apps
intentionally do **not** share a Tailwind/React toolchain.

## 2. Tech Stack
- **Monorepo:** Turborepo + pnpm workspaces (`pnpm@9`, `node@22.x` per `.nvmrc`).
- **`apps/app`:** Next.js 15 (App Router, Turbopack dev), React 19 RC,
  Tailwind v3, Clerk auth, Drizzle ORM (`drizzle-orm@0.38`,
  `drizzle-kit@0.30`), `postgres` driver, Cloudflare R2 via `aws4fetch`,
  Anthropic AI SDK, Redux Toolkit, MUI + shadcn-style Radix primitives.
- **`apps/landing`:** Next.js 16 (App Router), React 19 stable, Tailwind v4,
  `@supabase/supabase-js`, Framer Motion.
- **`packages/api-types`:** plain TypeScript shared types/schemas.
- **DB:** Supabase Postgres (direct port 5432 for migrations, pooled for runtime).

## 3. Architecture
```
tradewitness/
├── apps/
│   ├── app/                       # SaaS journal (Next 15, Drizzle, Clerk, R2)
│   │   └── src/
│   │       ├── app/               # Next.js App Router routes
│   │       ├── components/        # Feature UI (journal, statistics, trade-dialog)
│   │       ├── drizzle/           # schema.ts, db.ts, migrations/
│   │       ├── server/actions/    # Server Actions (trades.ts, etc.)
│   │       ├── zodSchema/         # Zod validators for forms
│   │       ├── features/          # Domain modules (ai, calendar, statistics)
│   │       └── redux/             # RTK store and slices
│   └── landing/                   # Marketing site + blog
├── packages/api-types/            # Shared types (workspace:*)
├── docs/                          # ADRs, architecture diagram, task plans
├── scripts/db-smoke.sh            # Quick DB connectivity check
├── turbo.json                     # Pipeline + globalEnv whitelist
└── pnpm-workspace.yaml
```
Entry points to read first when onboarding: `apps/app/src/server/actions/trades.ts`,
`apps/app/src/drizzle/schema.ts`, `apps/app/src/drizzle/db.ts`, `turbo.json`.

## 4. Commands
- `pnpm install` — install across the workspace.
- `pnpm dev` — `turbo dev` runs both apps (`landing` :3000, `app` :3001).
- `pnpm build` — Turborepo-orchestrated production builds.
- `pnpm --filter @tradewitness/app db:generate` — emit a new Drizzle SQL migration after editing `schema.ts`.
- `pnpm --filter @tradewitness/app db:migrate` — apply pending migrations.
- `pnpm --filter @tradewitness/app db:studio` — Drizzle Studio.
- `pnpm --filter @tradewitness/app lint` — Next/ESLint flat config.

## 5. Conventions
- **Server Actions are the auth boundary.** Every action in
  `apps/app/src/server/actions/` must (a) call `await auth()`, (b) reject
  when `userId == null`, (c) scope every Drizzle query with
  `where(and(eq(<table>.id, …), eq(<table>.userId, userId)))`. Without
  this, the action is a BOLA/IDOR.
- **Zod first, types second.** Forms validate via
  `apps/app/src/zodSchema/schema.ts`; the inferred type — not a hand-rolled
  interface — is what crosses the action boundary.
- **DB connection caching.** `apps/app/src/drizzle/db.ts` must keep the
  `globalThis` cache pattern; HMR otherwise leaks Postgres clients and
  exhausts the Supabase pool within minutes.
- **R2 access goes through `aws4fetch`,** not `@aws-sdk/client-s3`. Convert
  files/streams to `ArrayBuffer` before signing.
- **Migrations only via `db:generate` + `db:migrate`.** Never `db:push` —
  it diverges from the migration history that production replays.
- **TypeScript strict.** No implicit `any`, no `// @ts-ignore` without a
  one-line reason next to it.

## 6. What NOT to do
- **Do not enable Supabase RLS** on `apps/app` tables. Clerk owns auth, so
  `auth.uid()` is empty and RLS would silently block legitimate writes.
- **Do not hoist a single ESLint or Tailwind config to the root.** The two
  apps run on different React/Next majors — keep configs per-app.
- **Do not add `@neondatabase/serverless`** (we migrated off Neon to
  Supabase). Stay on `postgres.js` for `apps/app`.
- **Do not introduce a new env var without whitelisting it in
  `turbo.json::globalEnv`.** The cache will keep serving stale builds.
- **Do not use class components** anywhere — the codebase is functional
  components + hooks; class-based MUI examples should be ported.

## 7. Custom project rules (unwritten)
- **Rule 1 — turbo.json globalEnv discipline.** Any new `*_API_KEY`,
  `*_URL`, or feature flag must be added to `turbo.json::globalEnv`
  alongside the code change in the same commit.
- **Rule 2 — Tailwind segregation.** `apps/landing` runs Tailwind v4 (CSS-first
  config), `apps/app` runs v3 (`tailwind.config.ts`). Shared UI lives in
  `packages/api-types` for types only — visual primitives stay app-local
  until a `packages/ui` package exists.
- **Rule 3 — Drizzle generate before commit.** Editing `schema.ts` without
  running `db:generate` leaves the migrations folder out of sync; CI on a
  fresh DB will fail.
- **Rule 4 — Server Action ownership predicate.** Every read/update/delete
  on user-owned tables (`TradeTable`, `StrategyTable`, …) must include
  `eq(<table>.userId, userId)` in the `where`. Code review rejects PRs
  that touch a server action and skip this.
- **Rule 5 — Atomic commits for AI-assisted work.** When applying
  AI-generated diffs, split by logical concern (one bug per commit, one
  doc per commit). Mega-commits get rejected at review because rollback
  granularity matters.
- **Rule 6 — Confidence labels in ADRs.** Every ADR under `docs/adr/` has
  a `Confidence: HIGH|MEDIUM|LOW` line so future reviewers know whether
  the rationale was inferred from code (HIGH) or speculation (LOW).

## 8. Gotchas hit during onboarding
- `pnpm dev` will fail with `url is required` if `apps/app/.env.local`
  is missing `DATABASE_URL` — the Drizzle client is imported at module
  load by some Server Components.
- Clerk + Supabase free tier: enabling RLS in the Supabase dashboard
  silently breaks every Drizzle write. If a migration ran and writes now
  return zero rows, that is the cause.
- The `react@19.0.0-rc-66855b96-20241106` pin in `apps/app` is intentional
  — the stable React 19 release breaks `@mui/x-date-pickers@7`. Do not
  bump without re-testing date pickers.
