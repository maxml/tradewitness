# M2 — Report

## Local launch (Block 2 requirement)

Confirmed: `pnpm install` + `pnpm dev` boots both apps locally —
`apps/landing` on `http://localhost:3000`, `apps/app` on
`http://localhost:3001`. Database is Supabase (Drizzle migrations
applied via `pnpm --filter @tradewitness/app db:migrate`); Clerk auth,
Cloudflare R2 and Anthropic keys are set via `apps/app/.env.local`
(template in repo `.env.example`). On this resubmission the changed
server actions (`trades.ts`, `archive.ts`, `strategies.ts`) also pass
`tsc --noEmit` with exit 0.

## IDE
- **Primary (first pass):** Gemini CLI → `GEMINI.md`.
- **Secondary (second pass / NH-4):** Claude Code → `CLAUDE.md`.

Both files live in the repo root. `CLAUDE.md` is the source of truth
when working in Claude Code (Claude Code does not load `GEMINI.md`
natively); `GEMINI.md` stays for Gemini CLI sessions.

## Rules diff (manual additions on top of autogen)

Added on top of what Gemini's `/init` produced:

- **turbo.json globalEnv discipline** — any new env var must be
  whitelisted in `turbo.json::globalEnv` in the same commit, otherwise
  Turborepo serves stale builds. Hit this in real life on
  `ANTHROPIC_API_KEY`.
- **Tailwind segregation between apps** — `apps/landing` is Tailwind v4,
  `apps/app` is v3. Do **not** try to hoist a single config to the root
  — the v4 CSS-first migration breaks v3 plugins.
- **Drizzle: `db:generate` + `db:migrate` only, never `db:push`** —
  `db:push` diverges from the migration history that production replays
  on a fresh DB.
- **Clerk owns auth, RLS stays off** — Supabase `auth.uid()` is empty
  under Clerk; enabling RLS silently breaks every Drizzle write.
  Authorization is enforced in the SQL `where` (Rule 4 below).
- **Server-action ownership predicate (Rule 4 in CLAUDE.md)** — every
  read/update/delete on a user-owned table must include
  `eq(<table>.userId, userId)` in the `where`. Codified after finding
  five 🔴 IDORs in this codebase (FINDINGS #1, #2, #6, #7).
- **Atomic commits for AI-assisted work** — split by logical concern,
  one bug per commit. Mega-commits get rejected at review.

## NH-4 — Gemini CLI vs Claude Code autogen comparison

I ran `/init` (or the equivalent) in both. Output compared on the same
repo at the same commit.

**What both got right (the 70% autogen baseline):**

- Tech stack from `package.json` files (Next versions, React majors,
  Tailwind, Drizzle, Clerk).
- Top-level folder structure (`apps/`, `packages/`, `docs/`).
- Standard commands (`pnpm install`, `pnpm dev`, `pnpm build`,
  `db:migrate`).

**What Gemini caught well, Claude Code missed initially:**

- Gemini surfaced the *Tailwind v3/v4 split between apps* on its first
  pass — likely because it walks `package.json` files of every workspace
  and notices the major divergence. Claude Code mentioned it only after
  I asked specifically about styling.

**What Claude Code caught well, Gemini missed:**

- Reading `apps/app/src/server/actions/trades.ts` end-to-end, Claude
  Code flagged the *missing `userId` predicate* pattern as a class of
  bug — which is exactly the systemic IDOR cluster in this repo. Gemini
  produced a generic "validate inputs" rule that didn't tie to the SQL
  layer.
- Claude Code suggested explicit ADR confidence labels (HIGH / MEDIUM /
  LOW) so reviewers can tell which decisions are inferred vs documented.

**What I added by hand (the 30% that no autogen will infer):**

- Rule 5 (atomic commits for AI work) — direct response to teacher
  feedback on the previous mega-commit.
- The `react@19.0.0-rc-66855b96-20241106` pin gotcha — neither tool
  surfaced *why* the pin exists (`@mui/x-date-pickers@7` regression on
  stable React 19); only commit history reveals it.
- Rule 4 (server-action ownership predicate) — emerged from the
  FINDINGS audit, not from reading individual files.

**Verdict:** Gemini CLI is faster on monorepo-shape reasoning (walks
the workspace tree well). Claude Code goes deeper on a single file and
notices behavioral patterns / bugs while indexing. Best results came
from running both, diffing the outputs, and keeping a `CLAUDE.md`
focused on this codebase's specific gotchas.

## 3 questions

- **How long would this take manually?** ~6–8 hours: re-reading every
  Server Action for the IDOR pattern, hand-writing the C4 Mermaid
  diagram, drafting three ADRs, writing the Troubleshooting section
  from raw incident memory. With the IDE doing structural reads, it
  collapsed to roughly 2 hours of orchestration plus my decision-making
  on what to keep.
- **Most magical IDE feature.** For Gemini: the recursive workspace
  walk that mapped the full Turborepo + the C4 diagram in a single
  prompt. For Claude Code: pattern-class detection — it read one
  vulnerable Server Action and proactively asked "are there others
  shaped like this?", which is how findings #6 and #7 surfaced.
- **Where AI broke things and how I fixed it.** The first pass produced
  one mega-commit (616 lines, 10 minutes after baseline) that the
  reviewer rejected. I also accepted an AI suggestion to use
  `@aws-sdk/client-s3` for R2; that bloated the serverless bundle and
  was reverted to native `fetch + aws4fetch`. On this resubmission the
  AI initially also tried to "consolidate" the IDOR fixes for
  `archive.ts` and `strategies.ts` into one commit; I split them per
  the atomic-commits rule so each fix has its own SHA in `FINDINGS.md`.
