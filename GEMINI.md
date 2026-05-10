# Gemini Rules

## General
- Always use TypeScript with strict mode.
- Avoid TailwindCSS in apps/landing (v4), but it's okay in apps/app (v3).
- Drizzle ORM requires running `drizzle-kit generate` after schema changes.

## M3 MCP Usage
- For queries about TradeWitness features, architecture, incidents, or ADRs, ALWAYS use the `search_project_docs` tool first. Do not attempt to grep the `docs/` folder directly unless the search tool fails.
- To check or modify feature flags, ALWAYS use the `feature-flags` MCP tools (`get_feature_info`, `set_feature_state`, etc.). Do NOT edit `data/feature-flags/features.json` directly under any circumstances.

## Design rules: see ./DESIGN.md
