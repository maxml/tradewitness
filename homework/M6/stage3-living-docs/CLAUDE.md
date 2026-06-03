<!--
  M6 Stage 3 submission copy of the root CLAUDE.md, with the two new living-docs sections
  PREPENDED (⭐ START HERE + ⭐ Keeping project-index.json current). The rest is the existing
  root CLAUDE.md verbatim. In the live repo these two sections get prepended to ./CLAUDE.md
  (and mirrored into AGENTS.md). DEFERRED while the no-code constraint is active.
-->

## ⭐ START HERE — repo navigation

**ALWAYS read `project-index.json` FIRST** at the start of every session.

It contains:
- `subprojects` — annotated map (apps/app, apps/landing, feature-flags MCP, search-docs MCP, RAG, feature-flags-core, api-types)
- `system_folders` — `.claude/`, `docs/`, `data/feature-flags/`, etc. with purpose
- `hard_rules` — project-wide rules (incl. "app-layer authz is the only boundary — RLS off")
- `ai_routing` — which MCP tool answers which kind of question
- `filesystem_tree` — full directory tree (auto-updated, depth 4)

This file is faster than `find` / `tree` / `ls`, accurate, and machine-readable.
For module behavior, see `docs/specs/*-spec.md` (reverse-engineered feature-flags MCP + RAG).

## ⭐ Keeping project-index.json current — MANDATORY

**ALWAYS** update `project-index.json` when:
- Creating a new file or folder
- Deleting / renaming files or folders
- Changing a subproject's purpose / description

How: `python3 .claude/scripts/update_project_index.py`
Or: auto-fires via the PostToolUse hook (see `.claude/settings.local.json`).

For 4-step legacy analysis of new modules, follow the pattern used in `docs/specs/` (Overview → Decision Table → Sequence Diagram → Edge Cases → Open Questions → Suggested Tests).

---

# Claude Rules

## General
- Always use TypeScript with strict mode.
- Avoid TailwindCSS in apps/landing (v4), but it's okay in apps/app (v3).
- Drizzle ORM requires running `drizzle-kit generate` after schema changes.

## M3 MCP Usage
- For queries about TradeWitness features, architecture, incidents, or ADRs, ALWAYS use the `search_project_docs` tool first. Do not attempt to grep the `docs/` folder directly unless the search tool fails.
- To check or modify feature flags, ALWAYS use the `feature-flags` MCP tools (`get_feature_info`, `set_feature_state`, etc.). Do NOT edit `data/feature-flags/features.json` directly under any circumstances.

## Design rules: see ./DESIGN.md
