# Code Review Synthesis — TradeWitness (homework M6 Stage 1)

**Date:** 2026-05-25
**Reviewer:** 3-agent team (security-mate + performance-mate + architecture-mate, all Opus 4.7)
**Scope:** M3–M5 modules — server actions, API routes, feature-flags MCP, search-docs MCP, RAG, feature-flags-core (~19 files, ~1,300 LOC)
**Inputs:** `security-review.md` (18 findings: 8H/7M/3L, +1 clean), `performance-review.md` (12: 3H/5M/4L, +2 clean), `architecture-review.md` (14: 5×C1/6×C2/3×C3, +1 clean)

> Severity normalization: security HIGH/MED/LOW and architecture C1/C2/C3 are mapped onto a single HIGH/MEDIUM/LOW axis. Cross-mate duplicates are merged into one entry with all sources listed.

---

## HIGH severity (8 findings)

### Authorization / access-control (the load-bearing failures — RLS is OFF per ADR-0001)

1. **`apps/app/src/server/actions/archive.ts:104` (`getReportById`) + `:41` (`saveReport`)** — Report IDOR
   - Sources: **security-mate (HIGH, A01)** + **architecture-mate (C1, ADR-0001 violation)** ⟵ cross-mate
   - Reads/writes `ReportsTable` by `reportId` only — no `auth()`, no `eq(userId)`. With RLS disabled, the missing app-layer predicate is the *entire* access control → any user's AI reports leak / can be overwritten.
   - Fix: add `auth()` + `and(eq(reportId), eq(userId))` on both the read and the write.

2. **`apps/app/src/server/actions/stripe.ts:58` (`createTransaction`) + `apps/app/src/server/actions/user.ts:101` (`updateCredits`)** — Credit/token minting
   - Sources: **security-mate (HIGH, A01)** + **architecture-mate (C1, ADR-0001 violation)** ⟵ cross-mate
   - Exported `"use server"` actions mint credits for an arbitrary caller-supplied `userId`/`buyerId` with no auth or ownership check. No DB backstop (RLS off). Callable directly from a browser → credit fraud.
   - Fix: derive `userId` from the session (`auth()`), never from an argument; restrict the webhook-driven path to a verified server-only caller.

### Payment / webhook integrity

3. **`apps/app/src/app/api/webhooks/stripe/route.ts:18`** — Stripe webhook fails *open*
   - Sources: **security-mate (HIGH, A07)** + **architecture-mate (C2, missing integration contract)** ⟵ cross-mate
   - Returns HTTP 200 on signature-verification failure and still proceeds to `createTransaction` with attacker-controllable `metadata.buyerId`/`credits`. No idempotency.
   - Fix: fail closed (return 400/401) on verify failure; only act on a verified event; validate metadata shape; add idempotency key.

4. **`apps/app/src/app/api/webhooks/clerk/route.ts:38`** — Signature-verification bypass switch
   - Source: **security-mate (HIGH, A07)**
   - `CLERK_WEBHOOK_SKIP_VERIFY` env flag lets the handler skip svix signature verification entirely → forged user-lifecycle events.
   - Fix: remove the bypass (or hard-gate it to `NODE_ENV !== 'production'` and never document it).

### Secrets / config

5. **`apps/app/src/app/api/feature-flags/route.ts:8` + `mcps/feature-flags/src/http.ts:8`** — Hardcoded shared secret `local-m3-change-me` (HTTP wrapper also binds `0.0.0.0` by default)
   - Sources: **security-mate (HIGH, secrets)** + **architecture-mate (C2, magic string duplicated ×4)** ⟵ cross-mate
   - Fix: require the secret from env with no insecure fallback; bind `127.0.0.1` unless explicitly opted out; centralize the token in one module.

### Performance hot paths

6. **`apps/app/src/server/actions/trades.ts:36` (`getAllTradeRecords`)** — Unbounded result set on the `/private` layout hot path
   - Source: **performance-mate (HIGH)**
   - Fetches the user's entire `TradeTable` (no LIMIT/pagination), then `.map()` + `[...].reverse()` (3× full-array materialization), runs on every navigation, no caching. Est. **+300–800ms p95, ~30MB transient heap/request** for a 10k-trade user.
   - Fix: paginate / push `LIMIT` + ordering into the query; drop the redundant array copies.

7. **`apps/app/src/server/actions/archive.ts:71` (`getReports`)** — Missing DB index → full scan + in-memory sort
   - Source: **performance-mate (HIGH)**
   - `WHERE user_id = ? ORDER BY created_at DESC` but `ReportsTable` (schema.ts:101) has **no `user_id` index** (Trade/Strategy/Journal do; Reports + Transactions were missed). Est. **+200ms–1s**, scales with table size.
   - Fix: add index on `(user_id, created_at)`; run `drizzle-kit generate` (per CLAUDE.md).

8. **`apps/app/src/app/private/layout.tsx:15`** — ~4 serial DB round-trips per render
   - Source: **performance-mate (HIGH)**
   - `auth → trades → redundant UserTable existence check inside getAllStrategies → strategies`, plus a duplicate `auth()`. Est. **+20–60ms p50**, ~halvable with `Promise.all` + dropping the redundant read.

---

## MEDIUM severity (11 findings)

### Token-spend correctness (security + perf overlap)
9. **`apps/app/src/app/api/claude/route.ts:42` + `follow-up-claude`** — Non-atomic token decrement (read-then-write race)
   - Sources: **security-mate (MED)** + **performance-mate (MED)** ⟵ cross-mate. Fix: single atomic `UPDATE ... SET tokens = tokens - 1 WHERE tokens > 0 RETURNING`.
10. **`apps/app/src/app/api/claude/route.ts` / `follow-up-claude`** — No rate-limit / body-size cap on paid LLM endpoints
    - Sources: **security-mate (MED, cost-amplification DoS)** + **performance-mate (MED, unbounded JSON.parse/stringify event-loop block)** ⟵ cross-mate. Fix: rate-limit + record/byte cap.
11. **Token-spend business logic inlined in route handlers** — Source: **architecture-mate (C2)**. Already drifted (cost 1 vs 2, different gates). Fix: extract a `spendTokens()` db-layer fn.
12. **Divergent `PLAN_TOKEN_MAP` (`stripe.ts:13` vs `user.ts:96`)** — same plan→credits decision encoded 3× with contradictions.
    - Sources: **security-mate (MED, integrity)** + **architecture-mate (C2)** ⟵ cross-mate. Fix: single source of truth.

### Secrets / info-leak
13. **Non-constant-time API-key comparison (`===`)** in feature-flags route + MCP bearer check — Source: **security-mate (MED)**. Fix: `crypto.timingSafeEqual`.
14. **`apps/app/src/app/api/webhooks/clerk/route.ts`** — logs all headers (incl. svix-signature) + user PII — Source: **security-mate (MED)**. Fix: redact.
15. **Verbose `error.message` to clients + raw LLM output logged** (claude / follow-up-claude) — Sources: **security-mate (MED)** + **performance-mate (LOW, log-volume cost)** ⟵ cross-mate.
16. **`apps/app/src/lib/r2.ts`** — caller-supplied `key`/`contentType` unvalidated — Source: **security-mate (MED)**. Fix: validate/allowlist if ever fed user input.

### Architecture / contracts
17. **`apps/app/src/app/private/admin/features/actions.ts:35`** — admin action calls the app's *own* `/api/feature-flags` over HTTP (app-calls-itself across transport) — Source: **architecture-mate (C1)**. Fix: call shared domain logic in `feature-flags-core`.
18. **`packages/api-types` is an orphan** — declared wire-format source of truth, imported by zero `.ts` files; app uses its own zod schema, field names drifted — Source: **architecture-mate (C2)**.
19. **Duplicated dependency-graph validation** — `mcps/feature-flags/src/index.ts` hand-rolls `validateStateChange` while `http.ts`/route use canonical `DependencyGraph` from core — Source: **architecture-mate (C2)**.

### Performance
- **`SELECT *` pulling JSONB blobs** (trades) — Source: performance-mate (MED). Fix: select needed columns.
- **No flags cache + double-read** (feature-flags GET+PATCH lost-update race) — Sources: performance-mate (MED) + security-mate note ⟵ cross-mate.

---

## LOW severity (selected)

- **`mcps/feature-flags` double-read race** on the JSON store (performance-mate).
- **RAG ingest: per-chunk `appendFile` + whole embedding set in memory** (~80MB at 10k chunks) before upsert (performance-mate).
- **Redundant `UserTable` profile-exists read** inside `getAllStrategies` (performance-mate).
- **Embedding/Qdrant bootstrap copy-pasted** across `mcps/rag/ingest.ts`, `query.ts`, `search-docs/index.ts` — vector-size drift risk **1024 vs 1536** (architecture-mate C3).
- **`NEXT_PUBLIC_APP_URL` (client-exposed) used as a server-to-server target** (architecture-mate C3).
- **Hand-maintained DB→DTO mapping** (`trades.ts:40`, 15 inline coercions) + inline Claude prompts contradicting `architecture-decisions.md` §5 (architecture-mate C3).
- **Dependency CVE audit skipped** — offline environment, not run (security-mate LOW/A06, informational).

---

## Recommended fix order (top 5)

| # | Finding | Why first | Effort |
|---|---|---|---|
| 1 | Report IDOR — `archive.ts` (#1) | Active data leak, trivial contained fix, both mates flagged | 30m |
| 2 | Credit minting — `stripe.ts`/`user.ts` (#2) | Direct financial fraud, no DB backstop | 1h |
| 3 | Stripe webhook fail-open — `webhooks/stripe/route.ts` (#3) | Payment integrity, attacker-controlled credit grant | 30m |
| 4 | Hardcoded secret + `0.0.0.0` bind (#5) | Network-exposed dev secret, easy env fix | 30m |
| 5 | Clerk webhook bypass switch (#4) | Removes a forged-event foothold | 20m |

---

## ⭐ Top-3 for Stage 2

Chosen for strongest cross-mate consensus (each flagged by **both** security AND architecture), high impact, and a contained fix that won't change public API — ideal for characterization-test-driven safe refactor.

| # | File:line | Issue | Recommended fix | Sources | Effort |
|---|---|---|---|---|---|
| 1 | `apps/app/src/server/actions/archive.ts:104` (`getReportById`) + `:41` (`saveReport`) | Report IDOR — no `auth()` / `eq(userId)`; with RLS off this is the only access control | Add `auth()` + `and(eq(reportId), eq(userId))` on read and write; return null/forbidden on mismatch | security HIGH A01 + arch C1 (ADR-0001) | 30m |
| 2 | `apps/app/src/server/actions/stripe.ts:58` (`createTransaction`) + `apps/app/src/server/actions/user.ts:101` (`updateCredits`) | Credits minted for any caller-supplied `userId`/`buyerId`, no auth | Derive `userId` from session for client-reachable paths; reject caller-supplied id; keep webhook path server-only & verified | security HIGH A01 + arch C1 (ADR-0001) | 1h |
| 3 | `apps/app/src/app/api/webhooks/stripe/route.ts:18` | Webhook returns 200 on signature-verify failure and proceeds to grant credits | Fail closed (return 400) on verify failure; only act on verified event; validate metadata; add idempotency | security HIGH A07 + arch C2 | 30m |

---

## Cross-mate observations

Three findings were independently flagged by **two or more** mates — these are the report-set's center of gravity and all three land in Top-3:

- **Report IDOR** (`archive.ts`) — security A01 + architecture ADR-0001 violation.
- **Credit minting** (`stripe.ts`/`user.ts`) — security A01 + architecture ADR-0001 violation.
- **Stripe webhook fail-open** — security A07 + architecture missing-contract.

Additional multi-mate overlaps (MEDIUM): non-atomic token decrement, missing rate-limit/body cap, divergent `PLAN_TOKEN_MAP`, verbose LLM logging, feature-flags read-then-write race. The recurring root cause across HIGH items is **ADR-0001's "app-layer authz is the only boundary"** being an undocumented, untested invariant — which architecture-mate proposes promoting to a first-class **ADR-0004** (plus **ADR-0005** for feature-flag storage/topology).

---

## Cost awareness — token usage estimate

| Agent | total_tokens | tool_uses | duration |
|---|---|---|---|
| security-mate | ~70.3k | 33 | ~168s |
| performance-mate | ~71.0k | 35 | ~168s |
| architecture-mate | ~86.5k | 39 | ~208s |
| synthesis (this file) | ~10k | — | — |
| **Total** | **~238k tokens** | 107 | ~9 min wall |
