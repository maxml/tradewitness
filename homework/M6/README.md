# M6 «Агент-Контролёр» — submission (TradeWitness)

**Fork:** TradeWitness — TS monorepo (pnpm + Turborepo), Next.js + Drizzle/Supabase + Clerk + Stripe + R2, with M3–M5 additions (feature-flags MCP, search-docs MCP, RAG, n8n).
**Branch:** `m6-agents` · **Date:** 2026-05-25
**Note on stack:** the homework examples use Python/Mongo/`proshop_mern`; this fork is TS/Postgres. Mappings are in `PLAN.md` (Шаг 0). Tests use **Vitest** (not pytest).

> **Status:** All 4 stages complete (artifacts + live changes), committed on `m6-agents` (not pushed).
> Stage 2 fixes applied with characterization tests; Stage 3 living-docs installed into the live repo; Stage 4 suites run green (27 tests). Only the optional `coverage-report.png` / `hook-screenshot.png` screenshots remain (text equivalents are in the folders).

## Status by stage

| Stage | State | Deliverables |
|---|---|---|
| **1 — Multi-Agent Code Review** | ✅ complete | `stage1-code-review/`: security/performance/architecture `.md` + `.jsonl`, `synthesis.md` (Top-3, cross-mate, token estimate). 3 sub-agents via Agent tool. |
| **2 — Fix Top-3** | ✅ complete | `stage2-fix-top3/`: 3 `fix-N.md` + `tests/` (19 Vitest tests). Characterization-tests-first then fixes; 4 commits (tests → fix#1 → fix#3 → fix#2). `tsc` clean. Committed locally on `m6-agents` (not pushed). |
| **3 — Legacy Audit + Living Docs** | ✅ complete (artifacts + live install) | `stage3-living-docs/` artifacts + LIVE: root `project-index.json`, `.claude/agents/` (5 mates) + `.claude/scripts/`, 2 sections in `CLAUDE.md`/`AGENTS.md`, `docs/specs/` + `docs/README.md`, 17 task logs → `docs-archived-2026-05-25/`, PostToolUse hook (fired). |
| **4 — Tests Agent** | ✅ complete | `stage4-tests-agent/`: `test-writer-mate.md`, `service-1-tests/`, `service-2-tests/`, `coverage-report.txt`. Runnable copies in `packages/feature-flags-core` + `mcps/rag`; **27 tests green** (12 + 15). |

## Stage 1 — Top-3 for Stage 2 (cross-mate consensus)

1. **Report IDOR** — `apps/app/src/server/actions/archive.ts:104` (`getReportById`) + `:41` (`saveReport`) — no `auth()`/`eq(userId)`; with RLS off this is the only access control.
2. **Credit minting** — `apps/app/src/server/actions/stripe.ts:58` + `user.ts:101` — credits minted for any caller-supplied `userId`.
3. **Stripe webhook fail-open** — `apps/app/src/app/api/webhooks/stripe/route.ts:18` — HTTP 200 on signature-verify failure.

Plus proposed **ADR-0004** (app-layer authz is the only boundary) and **ADR-0005** (feature-flag storage/topology) from `architecture-review.md`.

## Folder map

```
homework/M6/
├── PLAN.md                      # full plan + Шаг 0 mapping
├── README.md                    # this file
├── stage1-code-review/          # ✅ 3 reviews + jsonl + synthesis
├── stage2-fix-top3/             # ✅ 3 fix-N.md + tests/ (19 tests)
├── stage3-living-docs/          # ✅ audit, plan, index, specs, script, docs-new/docs-archived, hook-evidence
└── stage4-tests-agent/          # ✅ agent + 2 service test suites + coverage-report.txt
```

## Live-repo changes (Stage 2 + Stage 3), all on `m6-agents`

- **Stage 2 fixes:** `apps/app/src/server/actions/archive.ts`, `…/stripe.ts`, `…/user.ts`, new `…/server/billing.ts`, `…/api/webhooks/stripe/route.ts` + `apps/app/tests/stage2/`.
- **Stage 3 living docs:** root `project-index.json`, `.claude/agents/` (5 mates + templates), `.claude/scripts/update_project_index.py`, `.claude/settings.local.json` (hooks), `CLAUDE.md` + `AGENTS.md` (2 sections), `docs/specs/`, `docs/README.md`, `docs/*` TODO markers, `docs-archived-2026-05-25/`.
- **Stage 4 tests:** `packages/feature-flags-core` (+vitest) and `mcps/rag` (+vitest) test suites.

## Remaining (optional)

- `coverage-report.png` / `hook-screenshot.png` — screenshots; text equivalents already in the folders (`coverage-report.txt`, `hook-evidence.txt`).
- `git push origin m6-agents` — when you're ready (say the word).
