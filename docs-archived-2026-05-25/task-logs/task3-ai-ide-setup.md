# Technical Plan: Task 3 - AI IDE Integration & Project Onboarding (Homework M2)

## Background & Motivation
To transform this repository into an AI-friendly environment and complete the "Hard&Soft AI Course - Homework M2", we must ensure that any new developer (or AI agent) can understand, build, and debug this application instantly. 

We are treating this Turborepo (TradeWitness) as a legacy or undocumented codebase that we have inherited. We must formalize its rules, document its local setup, audit its code quality, and prepare the final `report.md`.

## Scope & Impact
This task is split into Mandatory (MUST) blocks and one Optional (NICE-TO-HAVE) block.

- **Block 1 (MUST):** Create a robust `GEMINI.md` rules file in the root directory. It will contain tech stack details, architecture structure, commands, conventions, and anti-patterns. We will append at least 3 custom rules manually.
- **Block 2 (MUST):** Update the root `README.md` and `.env.example`. The README must provide a step-by-step guide to run the monorepo locally (including Supabase, Postgres, and Turborepo commands) so that a newcomer can spin it up in under 30 minutes.
- **Block 3 (MUST):** Conduct an AI-driven codebase audit. Produce a `FINDINGS.md` file listing at least 3 significant issues (e.g., hotspots, edge cases, outdated dependencies). We will then fix at least one of these issues and link the commit in `FINDINGS.md`.
- **NICE-TO-HAVE (NH-1 & NH-2):** Generate a Mermaid architecture diagram in `docs/architecture.md` and convert our existing `architecture-decisions.md` into formal MADR (Architecture Decision Record) files in `docs/adr/`.
- **Report:** Write the final `report.md` summarizing the experience, time spent, and IDE usage.

## Implementation Steps

### Phase 1: Rules File (`GEMINI.md`)
1. Create `GEMINI.md` in the root of the repository.
2. Structure it with:
   - **Overview:** Brief description of TradeWitness (Turborepo with Next.js landing and app).
   - **Tech Stack:** Next.js 15/16, Tailwind v3/v4, Supabase, Cloudflare R2, Clerk, pnpm workspaces.
   - **Architecture:** Mention `apps/landing`, `apps/app`, and `packages/api-types`.
   - **Commands:** `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm --filter @tradewitness/app db:migrate`.
   - **Conventions:** Strict TypeScript, use `globalThis` for DB caching in dev, functional components.
   - **What NOT to do:** Do not use `db:push` (use `db:migrate`), do not import `@aws-sdk/client-s3` (use `aws4fetch`), do not enable Supabase RLS on `apps/app` tables.
3. Manually add 3 "unwritten rules" (e.g., always verify Turborepo caching, handle Tailwind versions carefully).

### Phase 2: README & .env.example
1. Verify the current local setup (we already did this in Task 1 and 2).
2. Generate a comprehensive `README.md` containing:
   - Project description.
   - Prerequisites (Node.js 20+, pnpm 9.x).
   - Environment variables setup (reference `.env.example`).
   - Installation and running instructions.
   - Troubleshooting section (e.g., Supabase connection limits, Tailwind conflicts).
3. Ensure `.env.example` in the root explicitly maps out the variables needed for both `apps/landing` and `apps/app`.

### Phase 3: Codebase Audit (`FINDINGS.md`)
1. Run an analysis over `apps/app/src` and `apps/landing/src`.
2. Look for:
   - `HOTSPOTS`: Overly complex functions.
   - `EDGE CASES`: Missing error handling (especially in API routes).
   - `OUTDATED DEPS`: Check versions in `package.json`.
   - `HARDCODED VALUES`: Magic numbers or strings.
   - `DEAD CODE`: Unused exports or commented-out blocks.
3. Document the top 3-5 issues in `FINDINGS.md` (Table format: Risk, Location, Description, Fix, Status).
4. Pick one `🔴` or `🟡` issue, fix it with a minimal diff, and commit the fix. Mark it as `✅` in `FINDINGS.md`.

### Phase 4: Extras (Architecture & ADR)
1. **Mermaid Diagram:** Create `docs/architecture.md` containing a C4 Container diagram showing the user, Cloudflare R2, Supabase, Landing App, and Web App.
2. **ADR Generation:** Create 3 files in `docs/adr/`:
   - `0001-use-supabase-and-drizzle.md`
   - `0002-use-cloudflare-r2-with-aws4fetch.md`
   - `0003-turborepo-monorepo-structure.md`

### Phase 5: Final Report (`report.md`)
1. Create `report.md` in the root.
2. Fill out the required sections: IDE used (Gemini CLI), Rules diff (what was added manually), Time estimation, "Magic" AI moments, and debugging experiences.

## Verification & Smoke Tests
- `GEMINI.md` is committed in the root.
- `README.md` is readable and accurate.
- `FINDINGS.md` contains at least 3 issues and 1 verified fix.
- Architecture diagrams render correctly on GitHub.
- The Git history clearly shows the empty baseline commit followed by our logical steps.