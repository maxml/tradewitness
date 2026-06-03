# Existing docs audit — TradeWitness

> Phase 1.5 output (legacy-auditor role). Goal: do NOT throw away valid documentation.
> Each existing `docs/<folder>` and top-level doc-file gets a verdict.

**Auditor:** legacy-auditor role (Opus 4.7), main session
**Audit date:** 2026-05-25
**Repo:** TradeWitness — trading-journal SaaS monorepo (Next.js + Drizzle + MCP/RAG additions)
**Existing docs scanned:** 50 files across `docs/` (3 real ADRs, 2 arch docs, 1 roadmap, 17 task logs, 27-file m3-corpus fixture)

---

## Verdict legend

| Symbol | Verdict | Action in Phase 4 |
|---|---|---|
| ✅ | **ACCURATE** — matches code, maintained | Keep as-is in new docs structure |
| 🔄 | **PARTIALLY ACCURATE** — mostly right, stale sections | Copy + add `TODO(audit-2026-05-25): <what>` markers |
| 📦 | **HISTORICAL** — old but worth preserving | Move to `docs-archived-2026-05-25/`, never `rm`; link from new arch overview |
| ❌ | **STALE / REDUNDANT** — outdated/superseded | Archive first (never delete), then ignore |

---

## Inventory

| Path | Type | Verdict | Reasoning | Action |
|---|---|---|---|---|
| `docs/adr/` (0001-0003) | folder (3 files) | ✅ ACCURATE | ADR-0001 (Supabase+Drizzle, RLS off), 0002 (R2/aws4fetch), 0003 (Turborepo) all reflect current architecture; numbering coherent | Keep → `docs-new/adr/`; preserve numbering; add proposed 0004-0005 |
| `docs/architecture.md` | file | 🔄 PARTIALLY | C4-style overview; predates M5 (no n8n auto-pilot layer, MCP/RAG not in the diagram) | Copy + TODO markers for MCP/RAG/n8n |
| `docs/architecture-decisions.md` | file | 🔄 PARTIALLY | WIP decision log; §5 ("cut paid Anthropic API for MVP") contradicts the live `/api/claude` + `/api/follow-up-claude` routes | Copy + TODO marker on §5; reconcile with code |
| `docs/ROADMAP.md` | file | 🔄 PARTIALLY | Forward-looking; several M3-M5 items now shipped | Copy + tick shipped items |
| `docs/m3-corpus/` (architecture, features, incidents, runbooks) | folder (~22 files) | 📦 FIXTURE/HISTORICAL | This is the **synthetic corpus the search-docs MCP / RAG ingests** — it is input DATA, not authoritative project prose. Must stay where the RAG pipeline expects it | **DO NOT archive** — keep in place as RAG input; note as fixture in project-index |
| `docs/m3-corpus/adrs/` (adr-001…010) | folder (11 files) | ❌ STALE | Confirmed Lorem-ipsum placeholders (corpus padding), not real decisions | Keep only as corpus padding; never cite as decisions; real ADRs are `docs/adr/` |
| `docs/feature-flags-spec.md` (in m3-corpus) | file | 📦 HISTORICAL | M3 spec; superseded by the M6 reverse-engineered `docs/specs/feature-flags-mcp-spec.md` | Archive; link from new spec |
| `docs/task1-monorepo-setup.md` … `task15-*.md` | 17 files | 📦 HISTORICAL | Per-task dev logs for M1-M4 (monorepo, rebranding, docker, design system, UI). Irreplaceable dev-history but not living docs | Archive → `docs-archived-2026-05-25/task-logs/`; link from arch overview |

---

## Summary

- ✅ Keep as-is: **1** item (`docs/adr/`)
- 🔄 Update + keep: **3** items (architecture.md, architecture-decisions.md, ROADMAP.md) — TODO markers added
- 📦 Archive (historical): **18** items (17 task logs + feature-flags-spec); **+ m3-corpus kept in place as RAG fixture**
- ❌ Stale: **1** group (m3-corpus/adrs placeholders — kept only as corpus padding)

**Total:** 50 files reviewed.

---

## Cross-references to preserve

Must not get lost in the swap:

- `docs/m3-corpus/` → **stays in place**: the search-docs MCP and RAG ingest expect it there. Archiving it would break the M3 feature.
- Real ADRs (`docs/adr/0001-0003`) → preserve numbering in `docs-new/adr/`; do NOT restart from 1. Add proposed **ADR-0004** (app-layer authz) and **ADR-0005** (feature-flag storage) from `homework/M6/stage1-code-review/architecture-review.md`.
- `docs/specs/feature-flags-mcp-spec.md` + `rag-spec.md` (M6 reverse-engineering) → primary source for the corresponding sections in the new structure.
- Task logs → linked (not deleted) from `docs-new/architecture/README.md` as dev-history.

---

## Notes for Phase 2 planning

- **m3-corpus is live input, not docs** — the single most important "don't archive blindly" item. Treat it as a fixture directory.
- `architecture-decisions.md` §5 vs the live AI routes is a real drift — flag it, but reconciling is a code decision (out of scope for M6 no-code constraint).
- `packages/api-types` is an orphan (architecture-review C2) — any new architecture doc should state whether it is the wire-format source of truth or should be removed.
