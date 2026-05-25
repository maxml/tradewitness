# M6 «Агент-Контролёр» — submission (TradeWitness)

**Fork:** TradeWitness — TS monorepo (pnpm + Turborepo), Next.js + Drizzle/Supabase + Clerk + Stripe + R2, with M3–M5 additions (feature-flags MCP, search-docs MCP, RAG, n8n).
**Branch:** `m6-agents` · **Date:** 2026-05-25
**Note on stack:** the homework examples use Python/Mongo/`proshop_mern`; this fork is TS/Postgres. Mappings are in `PLAN.md` (Шаг 0). Tests use **Vitest** (not pytest).

> **Status:** Stages 1–4 artifacts are complete. **Stage 2 code fixes are now applied** (4 commits on `m6-agents`, not pushed).
> The remaining DEFERRED items are the live-repo "install" steps of Stage 3 (root `project-index.json`, `.claude/` install, `docs/` swap) and the Stage 4 test run/coverage screenshot — see the table and the bottom section.

## Status by stage

| Stage | State | Deliverables |
|---|---|---|
| **1 — Multi-Agent Code Review** | ✅ complete | `stage1-code-review/`: security/performance/architecture `.md` + `.jsonl`, `synthesis.md` (Top-3, cross-mate, token estimate). 3 sub-agents via Agent tool. |
| **2 — Fix Top-3** | ✅ complete | `stage2-fix-top3/`: 3 `fix-N.md` + `tests/` (19 Vitest tests). Characterization-tests-first then fixes; 4 commits (tests → fix#1 → fix#3 → fix#2). `tsc` clean. Committed locally on `m6-agents` (not pushed). |
| **3 — Legacy Audit + Living Docs** | ✅ artifacts complete (live install deferred) | `stage3-living-docs/`: `docs-audit.md`, `00-plan.md`, `project-index.json` (valid), `update_project_index.py`, `specs/` (2 modules), `stage3-synthesis.md`, `CLAUDE.md` copy w/ 2 sections. |
| **4 — Tests Agent** | ✅ artifacts complete (run deferred) | `stage4-tests-agent/`: `test-writer-mate.md`, `service-1-tests/`, `service-2-tests/`, `README.md`. Coverage screenshot deferred (Vitest not installed). |

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
├── stage2-fix-top3/             # 🔶 deferred (tests/ empty placeholder)
├── stage3-living-docs/          # ✅ audit, plan, index, specs, script, CLAUDE copy
└── stage4-tests-agent/          # ✅ agent + 2 service test suites + README
```

## To finish the deferred parts (when no-code constraint is lifted)

- **Stage 2:** ✅ done — fixes applied with characterization tests (4 commits on `m6-agents`). Remaining: `git push` when ready.
- **Stage 3 live install:** `cp project-index.json` to root; `cp update_project_index.py` to `.claude/scripts/`; prepend the 2 sections to real `CLAUDE.md`/`AGENTS.md`; build `docs-new/` + archive 📦/❌ task logs (keep `docs/m3-corpus` in place — it's RAG input). See `stage3-living-docs/00-plan.md`.
- **Stage 4 run:** `pnpm add -D vitest` → `npx vitest run` → capture `coverage-report.png`. See `stage4-tests-agent/README.md`.
