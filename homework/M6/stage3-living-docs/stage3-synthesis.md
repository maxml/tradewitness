# Stage 3 — Living Documentation Synthesis (TradeWitness)

**Date:** 2026-05-25
**Role:** legacy-auditor (Opus 4.7)
**Inputs:** Phase 1.5 `docs-audit.md`, reverse-eng specs (`specs/`), Stage 1 specialist reports, walked repo tree.

> NOTE: this is the Stage 3 aggregate. It does **not** overwrite the Stage 1 deliverable
> `homework/M6/stage1-code-review/synthesis.md`.

---

## 1. What the audit found

- **3 real ADRs** (`docs/adr/0001-0003`) are accurate and kept. Two undocumented decisions surfaced in Stage 1 are proposed as **ADR-0004** (app-layer authz is the only access-control boundary — RLS off) and **ADR-0005** (feature-flag storage/topology).
- **`docs/m3-corpus/` is RAG fixture data**, not prose — the single most important "do not archive blindly" item. It is the corpus the `search-docs` MCP ingests; archiving it would break the M3 feature. Its `adrs/` subfolder is Lorem-ipsum padding (not decisions).
- **17 `task*.md` dev logs + the m3 feature-flags-spec** are historical (📦) → archive, link from the new architecture overview.
- **3 docs are partially stale (🔄)**: `architecture.md` (predates M5 n8n/MCP), `architecture-decisions.md` (§5 contradicts the live AI routes), `ROADMAP.md` (shipped items not ticked).

## 2. Machine-readable map

`project-index.json` (validated): 7 subprojects, 10 hard_rules (incl. "ALWAYS read project-index.json FIRST" and the RLS/authz invariant), 6 ai_routing entries, depth-4 filesystem tree. It explicitly records the **stack correction** (TS/Next.js/Postgres, not the Python/Mongo of the homework examples) so future agents don't trust the template.

## 3. Module specs (4-step reverse engineering)

| Spec | Highlights |
|---|---|
| `specs/feature-flags-mcp-spec.md` | 16-row decision table, mermaid (happy + dependency-violation), **17 edge cases**, 18 suggested characterization tests. Surfaced: validation logic duplicated/divergent across `index.ts` (hand-rolled) vs `http.ts`/route (`DependencyGraph`); arg-name mismatch (`feature_name` vs `feature_id`); no file locking / atomic write / cycle detection on `features.json`. |
| `specs/rag-spec.md` | 15-row decision table, 3 mermaid (ingest / query / error), **17 edge cases**, 14 suggested tests. Surfaced: 1024-vs-1536 vector-size divergence and `localhost`-vs-`127.0.0.1` drift vs `search-docs`; whole embedding set held in memory before upsert; non-deterministic embedding risk. |

## 4. Maintenance automation

`update_project_index.py` authored with TradeWitness `WATCH_PATHS` (`apps/app/src/`, `apps/landing/src/`, `mcps/feature-flags/`, `mcps/rag/`, `mcps/search-docs/`, `packages/`, `data/feature-flags/`). Standalone + PostToolUse-hook modes. The two living-docs sections are drafted into the `CLAUDE.md` copy.

## 5. Convergence with Stage 1

The reverse-engineering independently re-confirmed Stage 1's top architectural finding: the feature-flag system has the `CLAUDE.md`-forbidden direct file write plus a duplicated validator — exactly the basis for proposed ADR-0005. The specs' edge-case lists feed directly into Stage 4 (test-writer) and Stage 2 (characterization tests).

## 6. Live-repo install — DONE

All of Stage 3 is applied to the live repo (committed on `m6-agents`): root `project-index.json`
(refreshed, 85 tree nodes), `.claude/agents/` (5 mates + templates), `.claude/scripts/update_project_index.py`,
the two ⭐ sections in both `CLAUDE.md` and `AGENTS.md`, `docs/specs/` + `docs/README.md`, the
`TODO(audit-2026-05-25)` markers on the 🔄 docs, the `docs-archived-2026-05-25/task-logs/` archive
(17 historical task logs; `m3-corpus/` + `adr/` kept in place), and the PostToolUse + SessionStart
hooks in `.claude/settings.local.json` (fired — see `hook-evidence.txt`). Inventory in `00-plan.md`.
