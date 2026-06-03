# Performance Mate — Review Summary

**Reviewer:** performance-mate (Opus 4.7)
**Scope:** Explicit file list (TradeWitness M6 stage-1 code review):
- `apps/app/src/server/actions/*.ts` (journal, user, stripe, archive, strategies, feedback, trades)
- `apps/app/src/app/api/**/route.ts` (feature-flags, claude, follow-up-claude, webhooks/clerk, webhooks/stripe)
- `apps/app/src/app/private/admin/features/actions.ts`
- `apps/app/src/lib/r2.ts`, `apps/app/src/drizzle/db.ts`
- `mcps/feature-flags/src/*.ts`, `mcps/search-docs/src/index.ts`, `mcps/rag/query.ts`, `mcps/rag/ingest.ts`
- `packages/feature-flags-core/src/index.ts`
- Plus the immediate caller `apps/app/src/app/private/layout.tsx` and `apps/app/src/drizzle/schema.ts` (for index verification).

**Scope size:** ~19 source files (~1,300 LOC reviewed)
**Runtime model:** Node.js event loop (Next.js RSC + server actions + API route handlers) and two MCP servers (stdio + raw `http`).
**Hot path:** `/private/*` layout (runs on every navigation) → `getAllTradeRecords` + `getAllStrategies`; reports-history list → `getReports`; paid `POST /api/claude` & `/api/follow-up-claude`; feature-flags GET/PATCH consumed by both MCPs.
**Context honoured:** CLAUDE.md (TS strict, run `drizzle-kit generate` after schema changes), AGENTS.md, ADR-0001 (RLS disabled → app-layer queries always carry `userId`). Cross-referenced `security-review.md`.

## Findings

- **HIGH:** 3 issues (unbounded result set on the layout hot path, serial multi-round-trip render, missing DB index causing full scan + sort)
- **MEDIUM:** 5 issues (SELECT * pulling JSONB blobs, no flags cache + double-read, unbounded LLM-prompt payload, non-atomic + serial token decrement, RAG ingest accumulates all embeddings in memory + sequential one-by-one embedding)
- **LOW:** 4 issues (MCP double-read race, per-chunk appendFile, redundant profile-exists read query, verbose hot-path logging)
- **CLEAN:** 2 status lines (no synchronous `fs.*Sync` blocking I/O in any request handler; no in-scope frontend Core-Web-Vitals regressions)

## Top concerns (HIGH)

1. **apps/app/src/server/actions/trades.ts:36** — `getAllTradeRecords` fetches the user's **entire** `TradeTable` with no `LIMIT`/pagination, then `.map()`s and `[...].reverse()`s it (two extra full-array copies), and it runs in the `/private` layout (layout.tsx:15) on **every** navigation. Estimated **+300–800ms p95 and ~30MB transient heap** per render for a 10k-trade user, repeated with no caching.
2. **apps/app/src/server/actions/archive.ts:71** — `getReports` does `WHERE user_id = ? ORDER BY created_at DESC` but `ReportsTable` (schema.ts:101) has **no index on `user_id`** (Trade/Strategy/Journal all do; Reports + Transactions were missed). Estimated **+200ms–1s** sequential scan + in-memory sort, scaling with total table size.
3. **apps/app/src/app/private/layout.tsx:15** — Render path runs **~4 serial DB round-trips** (`auth` → trades → a redundant `UserTable` existence check inside `getAllStrategies` → strategies), plus `getAllStrategies` calls `auth()` a second time. Estimated **+20–60ms p50** that could roughly halve with `Promise.all` + dropping the redundant read.

## Total estimated impact

- API/page latency p95 on `/private/*`: **+300ms to ~1s** for heavy users (dominated by the unbounded trades fetch + serial round-trips).
- Reports-history latency: **+200ms–1s** until the missing index is added.
- Memory: **~30MB transient/request** on the layout hot path for power users (3× materialization of the full trade set); RAG ingest holds the whole embedding set (~80MB at 10k chunks) before upsert.
- Paid LLM endpoints: unbounded request body → event-loop block + upstream cost amplification (qualitative; cap missing).

## N+1 / blocking-I/O / memory requirement

Satisfied by HIGH #1 (unbounded memory/result set), HIGH #3 + LOW (N+1-style redundant per-call DB round-trips in the layout and strategies/MCP paths), and the RAG-ingest memory/serial-I/O findings. No synchronous `fs.readFileSync`/sync-HTTP blocking I/O was found in request handlers (the feature-flags route correctly uses `fs/promises`).

## Cross-specialist collaboration

- **Overlap with security-review.md (confirmed, not duplicated blindly):**
  - Non-atomic token decrement (claude / follow-up-claude) — security flags it as a token over-spend race; I additionally flag it as an avoidable serial round-trip and recommend a single atomic `UPDATE ... SET tokens = tokens - 1 WHERE tokens > 0 RETURNING`.
  - No body-size cap on the paid Claude endpoints — security flags cost-amplification DoS; I flag the same as unbounded `JSON.parse`/`stringify` event-loop blocking and recommend a record+byte cap.
  - Verbose raw-LLM-output logging — security flags info-leak; I flag the hot-path serialization/log-volume cost.
  - Feature-flags GET+PATCH double-read — relates to the security note on the file-based flag store; here it is a read-then-write **lost-update race** plus redundant I/O.
- No mailbox/inbox present in this run; finalised with own judgment. Recommend architecture-mate confirm whether the layout-level eager full-trade load belongs in a paginated data layer rather than the RSC layout.

## Status

- ✅ N+1 / redundant round-trip scan complete (layout, strategies, MCP)
- ✅ Blocking I/O scan complete (no sync `fs`/HTTP in request handlers — clean)
- ✅ Unbounded result set / memory scan complete (trades list, RAG ingest)
- ✅ Missing-index scan complete (ReportsTable + TransactionsTable gaps found)
- ✅ Caching opportunities identified (feature-flags file, per-user trades)
- ✅ Cross-referenced security-review.md overlaps (ReDoS — none found; unbounded input / non-atomic write — confirmed)
- ⏭️ No load tests / benchmarks run (read-only constraint) — all latency/memory numbers are static estimates, measure in production.
