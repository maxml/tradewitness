# Codex Rules

## General
- Always use TypeScript with strict mode.
- Avoid TailwindCSS in apps/landing (v4), but it is okay in apps/app (v3).
- Drizzle ORM requires running `drizzle-kit generate` after schema changes.

## M3 MCP Usage
- For queries about TradeWitness features, architecture, incidents, or ADRs, use the `search_project_docs` tool first when it is available.
- To check or modify feature flags, use the feature-flags MCP tools (`get_feature_info`, `set_feature_state`, etc.) when they are available. Do not edit `data/feature-flags/features.json` directly unless the MCP route is unavailable and the task explicitly requires a local repair.

## Design rules: see ./DESIGN.md
