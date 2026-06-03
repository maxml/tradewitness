# TradeWitness — Documentation Index

Machine-readable map of the whole repo: **`../project-index.json`** (read it first).
This folder is the human-facing Layer-5 documentation. Audited 2026-05-25 (M6) — see
`../homework/M6/stage3-living-docs/docs-audit.md` for the per-file verdict.

## Structure

| Path | What | Status |
|---|---|---|
| [`adr/`](adr/) | Architecture Decision Records 0001–0003 (Supabase+Drizzle/RLS-off, R2/aws4fetch, Turborepo) | ✅ current |
| [`specs/`](specs/) | Reverse-engineered module specs (M6): `feature-flags-mcp-spec.md`, `rag-spec.md` | ✅ new |
| [`architecture.md`](architecture.md) | C4-style system overview | 🔄 predates M5 (n8n/MCP) — `TODO(audit-2026-05-25)` |
| [`architecture-decisions.md`](architecture-decisions.md) | WIP decision log | 🔄 §5 contradicts live AI routes — `TODO(audit-2026-05-25)` |
| [`ROADMAP.md`](ROADMAP.md) | Forward-looking roadmap | 🔄 some M3–M5 items shipped |
| [`m3-corpus/`](m3-corpus/) | **RAG fixture corpus** ingested by the search-docs MCP / RAG (`../mcps/rag`, `../mcps/search-docs`). Input DATA, not authoritative prose — do NOT move | 📦 keep in place |

## Proposed (from M6 review)

- **ADR-0004** — App-layer authorization is the only access-control boundary (RLS disabled). Draft in `../homework/M6/stage1-code-review/architecture-review.md`. (Enforced by the M6 Stage 2 IDOR + billing fixes.)
- **ADR-0005** — Feature-flag storage, persistence layer, and access topology.

## Archived

Historical M1–M4 task logs (📦) were moved to `../docs-archived-2026-05-25/task-logs/` (never deleted). They are dev-history, not living docs.

## Conventions

- New modules get a `specs/<module>-spec.md` via the 4-step pattern (Overview → Decision Table → Sequence Diagram → Edge Cases → Open Questions → Suggested Tests).
- Docs questions: use the `search_project_docs` MCP tool (it indexes `m3-corpus/`), not raw grep — see root `CLAUDE.md`.
