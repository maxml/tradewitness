# Stage 3 — Legacy Audit + Living Documentation — Plan

**Role:** legacy-auditor (Opus 4.7), main session
**Date:** 2026-05-25
**Repo:** TradeWitness (TS monorepo — NOT proshop_mern; no Python)
**Output dir:** `homework/M6/stage3-living-docs/`

> ⚠️ Active constraint this session: **no code changes, artifacts only in `homework/M6/`.**
> Therefore all deliverables are produced **inside M6**. The "live install" steps that touch the
> real repo (root `project-index.json`, `.claude/scripts/`, editing `CLAUDE.md`, the `docs/` swap,
> the PostToolUse hook) are **drafted in M6 and marked DEFERRED** until the constraint is lifted.

---

## Phase 1 — DISCOVERY ✅

- [x] Walk repo tree (pnpm + Turborepo monorepo)
- [x] Detect stack from manifests: `package.json`, `pnpm-workspace.yaml`, `turbo.json` → Next.js + Drizzle + Clerk + Stripe + R2; Node/TS only
- [x] Identify subprojects: `apps/app`, `apps/landing`, `mcps/feature-flags`, `mcps/search-docs`, `mcps/rag`, `packages/feature-flags-core`, `packages/api-types`
- [x] Locate existing docs: `docs/` (adr/, architecture, m3-corpus fixture, task logs)

## Phase 1.5 — EXISTING DOCS AUDIT ⭐ ✅

- [x] Classify every `docs/` item → `docs-audit.md` (✅/🔄/📦/❌)
- [x] Key call-out: `docs/m3-corpus/` is **RAG input data**, not prose — do NOT archive
- [x] Real ADRs = `docs/adr/0001-0003`; m3-corpus/adrs are Lorem-ipsum placeholders

## Phase 2 — PLAN ✅ (this file)

- [x] Write TODO list referencing docs-audit verdicts
- [x] (In a normal run this is where the auditor stops for approval. Here the user pre-approved "Stage 3+4 artifacts in M6".)

## Phase 3 — DISPATCH + REVERSE ENGINEERING ✅ (M6 scope)

- [x] Specialist reports already produced in **Stage 1** (security/performance/architecture mates via Agent tool) → `homework/M6/stage1-code-review/`. Reused here instead of re-spawning.
- [x] 4-step reverse engineering on module #1 → `specs/feature-flags-mcp-spec.md` (Overview / 16-row Decision Table / mermaid / 17 edge cases / Open Qs / 18 suggested tests)
- [x] 4-step reverse engineering on module #2 → `specs/rag-spec.md` (Overview / 15-row Decision Table / 3 mermaid / 17 edge cases / Open Qs / 14 suggested tests)

## Phase 4 — AGGREGATE ✅ (M6) / 🔶 DEFERRED (live repo)

- [x] `project-index.json` built from the walked tree → `homework/M6/stage3-living-docs/project-index.json` (validated; 7 subprojects, 10 hard_rules, 6 ai_routing, depth-4 tree)
- [x] `stage3-synthesis.md` — aggregates audit + specs + index (does NOT overwrite Stage 1 `synthesis.md`)
- [x] ✅ LIVE: copied `project-index.json` to repo root (refreshed via the script — 85 tree nodes incl. `docs/specs`, `.claude/agents`)
- [x] ✅ LIVE: archived 📦 task logs → `docs-archived-2026-05-25/task-logs/` (17 files); added `docs/specs/` (2 specs) + `docs/README.md`; kept `docs/adr/` + `docs/m3-corpus/` in place

## Phase 5 — AUTOMATE ✅ (M6 + LIVE)

- [x] `update_project_index.py` authored with TradeWitness `WATCH_PATHS` → also installed at `.claude/scripts/update_project_index.py` (executable)
- [x] `CLAUDE.md` copy with the two new sections → `homework/M6/stage3-living-docs/CLAUDE.md`
- [x] ✅ LIVE: installed 5 mate agents + templates → `.claude/agents/`
- [x] ✅ LIVE: prepended the two sections to the real root `CLAUDE.md` AND `AGENTS.md`
- [x] ✅ LIVE: PostToolUse + SessionStart hooks in `.claude/settings.local.json` (fired: see `hook-evidence.txt`)

---

## Deliverables present in `homework/M6/stage3-living-docs/`

| File | Status |
|---|---|
| `00-plan.md` | ✅ this file |
| `docs-audit.md` | ✅ |
| `project-index.json` | ✅ valid |
| `update_project_index.py` | ✅ executable |
| `specs/feature-flags-mcp-spec.md` | ✅ |
| `specs/rag-spec.md` | ✅ |
| `stage3-synthesis.md` | ✅ |
| `CLAUDE.md` (copy w/ 2 new sections) | ✅ |
| `docs-new/`, `docs-archived/` | ✅ snapshots of the live new structure + archive |
| `hook-evidence.txt` | ✅ hook fired (`[update-index hook] … ✅ updated`) |

## Live-repo install — DONE

All of Stage 3 is now applied to the live repo (committed on `m6-agents`):

```
.claude/agents/{security,performance,architecture,legacy-auditor,test-writer}-mate.md + templates/
.claude/scripts/update_project_index.py            (executable)
.claude/settings.local.json                        (PostToolUse + SessionStart hooks)
project-index.json                                 (root, refreshed)
CLAUDE.md, AGENTS.md                               (two ⭐ sections prepended)
docs/specs/{feature-flags-mcp,rag}-spec.md         (new)
docs/README.md                                     (index)
docs/{architecture,architecture-decisions,ROADMAP}.md  (TODO(audit-2026-05-25) markers)
docs-archived-2026-05-25/task-logs/                (17 historical task logs; m3-corpus + adr kept in place)
```

