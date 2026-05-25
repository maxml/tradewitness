# Architecture Mate — Review Summary

**Reviewer:** architecture-mate (Opus 4.7)
**Scope:** Explicit file list (TradeWitness M6 stage-1 code review):
- `apps/app/src/server/actions/*.ts` (archive, stripe, user, journal, trades, strategies, feedback)
- `apps/app/src/app/api/**/route.ts` (claude, follow-up-claude, feature-flags, webhooks/clerk, webhooks/stripe)
- `apps/app/src/app/private/admin/features/actions.ts`
- `apps/app/src/lib/r2.ts`, `apps/app/src/drizzle/db.ts`
- `mcps/feature-flags/src/{index,http}.ts`, `mcps/search-docs/src/index.ts`, `mcps/rag/{query,ingest}.ts`
- `packages/feature-flags-core/src/index.ts`, `packages/api-types/src/index.ts`

**Scope size:** ~19 source files (~1,300 LOC)
**ADRs loaded:** 5 real (ADR-0001 Supabase+Drizzle, ADR-0002 R2/aws4fetch, ADR-0003 Turborepo; plus `docs/architecture.md` C4 and `docs/architecture-decisions.md` WIP). The 12 files under `docs/m3-corpus/adrs/` are placeholder Lorem-ipsum stubs (no real decisions) and were disregarded for compliance. Project rules from `CLAUDE.md` / `AGENTS.md` treated as binding architecture constraints.

## Findings

- **C1 (HIGH):** 5 issues
- **C2 (MEDIUM):** 6 issues
- **C3 (LOW):** 3 issues
- 1 `clean` status line (ADR-0002 R2/aws4fetch compliance)

## Top concerns (C1)

1. **`apps/app/src/app/api/feature-flags/route.ts:94`** — Direct `fs.writeFile` to `data/feature-flags/features.json`. This is the literal direct-edit path that `CLAUDE.md` forbids; it is the single persistence layer for the whole flag system but lives in a route handler rather than in `feature-flags-core`. (ADR violated: `CLAUDE.md` M3 rule; no ADR documents flag storage.)
2. **`apps/app/src/server/actions/archive.ts:110`** — `getReportById` queries `ReportsTable` by id only, no `userId` filter, no `auth()` — IDOR. (ADR violated: **ADR-0001**, "enforce authorization purely at the application layer via `where(eq(userId, currentUser))`".) `saveReport` (line 41) is the mirror write-side IDOR. Cross-refs security-review HIGH #3.
3. **`apps/app/src/server/actions/stripe.ts:58` + `user.ts:101`** — `createTransaction` / `updateCredits` mint credits for any caller-supplied `buyerId`/`userId` with no auth/ownership check. With RLS off (ADR-0001), there is no DB backstop. (ADR violated: **ADR-0001**.) Cross-refs security-review HIGH #2.

Other C1: **`private/admin/features/actions.ts:35`** — admin server action calls the app's *own* `/api/feature-flags` route over HTTP (app-calling-itself across a transport boundary) instead of shared domain logic.

## Notable C2

- **Divergent `PLAN_TOKEN_MAP`** (`stripe.ts:13` vs `user.ts:96`) — same plan->credits decision encoded three times, two of them contradicting each other. Integrity bug + maintenance hazard.
- **Token-spend logic inlined in route handlers** (`claude/route.ts:42`, duplicated in `follow-up-claude`) — business logic in the controller layer, already drifted (cost 1 vs 2, different gates). Needs a `spendTokens()` db-layer function.
- **`packages/api-types` is an orphan** — declared "the source of truth for the wire format" and listed as a dependency in both apps, but imported by zero `.ts` files; the app validates trades with its own `zodSchema/schema.ts` and field names have drifted. Premature abstraction that undermines ADR-0003's stated justification for the monorepo.
- **Stripe webhook has no contract** (`webhooks/stripe/route.ts:18`) — fail-open 200 on signature failure, untyped attacker-influenceable metadata flows into credit grant, no idempotency. Event-driven integration without a schema.
- **Duplicated dependency-graph validation** — `mcps/feature-flags/src/index.ts` hand-rolls `validateStateChange` while `http.ts` and the route use the canonical `DependencyGraph` from `feature-flags-core`; two implementations of one invariant.
- **Hardcoded `"local-m3-change-me"` magic string** duplicated in four files as the shared auth token (route, both MCP servers, admin action).

## C3

- Embedding-provider + Qdrant bootstrap copy-pasted across `mcps/rag/ingest.ts`, `mcps/rag/query.ts`, `mcps/search-docs/src/index.ts` (model/vector-size drift risk: 1024 vs 1536).
- `NEXT_PUBLIC_APP_URL` (client-exposed) used as an internal server-to-server call target.
- Hand-maintained DB-row->DTO mapping in `trades.ts:40` (15 nullable-coercions inline); and inline Claude prompts/model selection in the two AI routes, which also contradict the WIP decision in `architecture-decisions.md` §5 to cut paid Anthropic API for MVP.

## Cross-reference with security-review.md

The security and architecture reviews converge on the three highest-impact items, and they are genuinely *both* security and architecture problems — which is why they should block:

- **Report IDOR (`archive.ts`)** — security-review HIGH #3 (A01). Architecturally this is a direct **ADR-0001** violation: RLS is disabled by decision, so the missing `eq(userId)` predicate removes the *only* access-control layer the architecture has.
- **Credit minting (`stripe.ts`/`user.ts`)** — security-review HIGH #2 (A01). Same ADR-0001 boundary failure; the undocumented decision to expose `userId`-parameterized server actions has no architectural backstop.
- **Stripe webhook fail-open** — security-review HIGH #1 (A07). Architecturally a missing integration contract at the payment boundary.
- **Hardcoded `local-m3-change-me`** — security-review HIGH (shared secret). Architecturally a duplicated-magic-string coupling across four components.

## Proposed ADRs

The two biggest *undocumented* architectural decisions surfaced by this review:

### ADR-0004 — App-layer authorization is the only access-control boundary (RLS disabled)

**Status:** Proposed (drafted by architecture-mate during M6 stage-1 review)
**Date:** 2026-05-25
**Deciders:** TBD (PR author + tech lead)

**Context.** ADR-0001 mentions, almost in passing, that Supabase RLS is disabled because Clerk doesn't populate `auth.uid()`, and that authz is therefore enforced in app code via `where(eq(userId, currentUser))`. This is buried as a "consequence" of a database-vendor ADR, yet it is in fact the single most load-bearing security invariant in the system. The review found three places that silently violate it (`getReportById`, `saveReport`, `createTransaction`/`updateCredits`) precisely because it is not stated as a first-class, testable rule.

**Decision.** Document explicitly that: every read/write of a user-owned table MUST be gated by both an `auth()`/`currentUser()` check AND a Drizzle `eq(userId)` predicate (or a webhook-verified identity); there is NO database-level (RLS) fallback; and any data-mutating `"use server"` action MUST derive `userId` from the session, never from a caller-supplied argument.

**Consequences.** Positive: a single, lint-able/test-able rule; reviewers can mechanically check every action. Negative: every new query is security-critical with no safety net; mistakes are silent data leaks (as found). Risk: an inexperienced contributor adds an action that trusts a parameter `userId` (already happened in `stripe.ts`/`user.ts`). Mitigation: a shared `requireUser()` helper + a repository layer that always injects the predicate.

**Alternatives considered.** Re-enable RLS with a Clerk->Postgres JWT bridge (rejected in ADR-0001 for complexity, but worth revisiting as defense-in-depth).

### ADR-0005 — Feature-flag storage, persistence layer, and access topology

**Status:** Proposed (drafted by architecture-mate during M6 stage-1 review)
**Date:** 2026-05-25
**Deciders:** TBD

**Context.** Feature flags are stored as a flat JSON file (`data/feature-flags/features.json`). Mutation flows through `apps/app/src/app/api/feature-flags/route.ts`, which does the raw `fs` read-modify-write. Three other components (admin server action, stdio MCP, HTTP wrapper) reach that route over HTTP. `feature-flags-core` exists but only carries validation (`DependencyGraph`), not persistence — so the storage decision, the "file is the store" choice, the dev-key auth, and the "everything funnels through one Next route" topology are entirely undocumented. The result is the `CLAUDE.md`-forbidden direct file write living inside a route, plus the app calling itself over HTTP, plus a duplicated hand-rolled validator in the stdio MCP.

**Decision.** Document (and ideally refactor toward): JSON file as the system of record for M3/MVP; a single persistence/repository module in `feature-flags-core` that owns file I/O and reuses `DependencyGraph`; in-process consumers (Next route, admin action) call that module directly; only out-of-process consumers (n8n via the HTTP wrapper, the stdio MCP) cross the network boundary; one shared definition of the API key / dev-key.

**Consequences.** Positive: removes the forbidden in-route file write, kills the app-calls-itself hop, and gives one implementation of the dependency invariant. Negative: a flat JSON file with concurrent writers has no locking (lost-update risk under concurrency). Risk: file-store does not scale past a single instance. Mitigation: note the single-writer assumption explicitly; plan a DB-backed store if flags move multi-instance.

## Status

- ✅ All real ADRs (0001-0003) + architecture.md + architecture-decisions.md cross-referenced against the scope
- ✅ M3-corpus "ADRs" inspected and confirmed to be Lorem-ipsum placeholders (not decisions)
- ✅ Layer boundaries scanned (routes/actions vs db/core layers; MCP/RAG package internals)
- ✅ API/contract stability checked (api-types orphan, webhook contract, plan->credit map drift)
- ✅ Cross-referenced security-review.md; overlap noted on the three blocking C1s
