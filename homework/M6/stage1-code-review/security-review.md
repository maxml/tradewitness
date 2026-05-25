# Security Mate — Review Summary

**Reviewer:** security-mate (Opus 4.7)
**Scope:** Explicit file list (TradeWitness M6 stage-1 code review):
- `apps/app/src/server/actions/*.ts` (journal, user, stripe, archive, strategies, feedback, trades)
- `apps/app/src/app/api/**/route.ts` (feature-flags, claude, follow-up-claude, webhooks/clerk, webhooks/stripe)
- `apps/app/src/app/private/admin/features/actions.ts`
- `apps/app/src/lib/r2.ts`, `apps/app/src/drizzle/db.ts`
- `mcps/feature-flags/src/*.ts`, `mcps/search-docs/src/index.ts`, `mcps/rag/query.ts`, `mcps/rag/ingest.ts`
- `packages/feature-flags-core/src/index.ts`

**Scope size:** ~18 source files (~1,300 LOC reviewed)
**Time:** ~single pass, read-only
**Context honoured:** CLAUDE.md, AGENTS.md, ADR-0001 (RLS disabled → app-layer authz is the ONLY access control), ADR-0002 (R2 via aws4fetch).

## Findings

- **HIGH:** 8 issues
- **MEDIUM:** 7 issues
- **LOW:** 3 issues (incl. 1 informational skipped-scan note)
- 1 `clean` status line (A01 ownership filters that are implemented correctly)

## Top concerns (HIGH)

1. **apps/app/src/app/api/webhooks/stripe/route.ts:18** — Stripe webhook returns **HTTP 200 on signature-verification failure** and never fails closed; the handler then calls `createTransaction` with attacker-controlled `metadata.buyerId`/`credits`. (OWASP A07)
2. **apps/app/src/server/actions/stripe.ts:58 + apps/app/src/server/actions/user.ts:101** — `createTransaction` / `updateCredits` are `"use server"` actions that **mint tokens for any client-supplied `userId`/`buyerId` with no auth or ownership check** → credit fraud / account takeover of credits. (OWASP A01)
3. **apps/app/src/server/actions/archive.ts:104** — `getReportById` reads `ReportsTable` **by `reportId` only, no `userId` filter, no `auth()`** → IDOR exposing any user's AI reports. RLS is disabled (ADR-0001), so this missing filter is a real data leak. `saveReport` (archive.ts:41) has the mirror-image write IDOR. (OWASP A01)

Other HIGH: Clerk webhook signature-verification bypass via `CLERK_WEBHOOK_SKIP_VERIFY` (clerk/route.ts:38); hardcoded shared secret `local-m3-change-me` as the auth fallback in the feature-flags API (route.ts:8) and in the MCP HTTP wrapper which also binds `0.0.0.0` by default (http.ts:8).

## Notable MEDIUM

- Non-constant-time API-key comparison (`===`) in feature-flags route and MCP bearer check (timing attack).
- Clerk webhook logs **all headers (incl. svix-signature) and user PII** (email/name) to stdout.
- Verbose `error.message` returned to clients + raw LLM output logged in claude/follow-up-claude routes.
- **Non-atomic token decrement** (read-then-write race) in claude/follow-up-claude → token over-spend.
- No rate-limit / body-size cap on the paid Claude endpoints → cost-amplification DoS.
- `r2.ts` uses caller-supplied `key`/`contentType` unvalidated (path/key control if ever fed user input).
- Divergent, client-trusted plan→token maps (stripe.ts vs user.ts) → integrity bug + forged-metadata credit grants.

## Correctly-implemented controls (for balance)

- `journal.ts`, `trades.ts` (update/delete), `strategies.ts` (delete/edit), and `archive.ts` `addRemoveFavorite` / `deleteReportFromDB` / `getReports` all apply `and(eq(id), eq(userId))` ownership filters per ADR-0001. The IDORs are isolated to the four actions named above.
- Admin feature-flag server action (`private/admin/features/actions.ts`) correctly checks `currentUser()` + an `ADMIN_EMAILS` allowlist before mutating.
- `feature-flags-core` `DependencyGraph` validation logic is sound.
- `getFilePath()` in the feature-flags route resolves from an env var (not per-request user input), so no request-driven path traversal.

## Cross-specialist collaboration

- No mailbox/inbox present in this run; finalised with own judgment. The Stripe/credit findings (A01/A07/A08) overlap an architecture-mate review of ADR-0001's "authz at app layer" mandate — recommend confirming `createTransaction`/`updateCredits`/`saveReport` against that ADR.

## Status

- ✅ All OWASP Top-10 categories scanned across the in-scope files
- ⏭️ Dependency CVE audit (`npm/pnpm audit`) SKIPPED — offline environment per caller constraint (tracked as LOW/A06)
- ✅ Secrets scan completed (found hardcoded `local-m3-change-me`; `.env.example` files contain only placeholders, no real secrets committed)
