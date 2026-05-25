# Technical Plan: Task 10 - M3 RAG and MCP Homework (TradeWitness)

## Background & Motivation

The M3 homework may use a custom project instead of `proshop_mern` only if
the project has a comparable documentation corpus and a real feature-flag-like
state surface. TradeWitness is the selected project, so this task transforms
the repository into an acceptable M3 submission instead of mocking the
ProShop data.

To meet the "Senior+" criteria and ensure a successful submission, we must address:
- **Corpus Volume:** The requirement for 30k+ words of documentation.
- **Production Integrity:** Ensuring the MCP layer works with Clerk Auth, avoids Next.js caching pitfalls, and doesn't trigger HMR reboot loops.

## Scope & Impact

This task is a parent task. Implementation is split into exactly three
executable tasks:

1. [Task 10.1 - Feature Flags MCP](./task10-1-feature-flags-mcp.md)
2. [Task 11 - Qdrant RAG and Search-Docs MCP](./task11-qdrant-rag-search-mcp.md)
3. [Task 12 - Report, Rules, and All Commits](./task12-report-rules-commits.md)

## Acceptance Baseline

| Area | Required artifact | Why it matters |
| --- | --- | --- |
| Custom project eligibility | `docs/m3-corpus/` with 20+ docs and **30k+ words** | Proves TradeWitness is a valid replacement for `proshop_mern` |
| Feature flag state | `data/feature-flags/features.json` with 25 real TradeWitness flags | Gives Part 1 meaningful runtime state. **Stored outside `src` to avoid HMR loops.** |
| Feature flag spec | `docs/m3-corpus/feature-flags-spec.md` | Documents validation rules and tool contracts |
| Shared flag store | `packages/feature-flags-core` | Shared Zod schemas and validation logic |
| Runtime API | `GET/PATCH /api/feature-flags` | Uses `fs.promises.readFile` + `force-dynamic` to bypass Next.js caching. |
| Admin dashboard | Private admin page listing all flags and statuses | Required for M4 continuity. Uses Clerk auth + admin-only guard. |
| Feature MCP | 4 tools: `list_features`, `get_feature_info`, `set_feature_state`, `adjust_traffic_rollout` | Communicates with API via `x-api-key` (whitelisted in Middleware) |
| RAG chunks | `mcps/rag/chunks.jsonl` with rich metadata | Teacher can inspect chunks without reaching the local vector DB |
| Vector query CLI | 3 mandatory query logs with `score` and `source_file` | Proves retrieval works before MCP wrapping. Uses **Qdrant**. |
| Search MCP | `search_project_docs(query, top_k)` | Required Part 3 behavior |
| Agent E2E log | one dialogue where both MCP servers are used | Final proof of the executable layer |
| Rules update | `CLAUDE.md` and `GEMINI.md` MCP usage rules | Prevents agents from bypassing MCP with direct file edits |
| Report | `report.md` section `## M3` | Single submission artifact for stack, logs, and reflection |

## Technical Strategies for Success

### 1. Reaching 30k+ Words ("The Meat")
We will expand `docs/m3-corpus/` by detailing the full scope of TradeWitness:
- **Module Deep-dives:** Redux Toolkit integration, Drizzle/Supabase relational schema, Cloudflare R2 signature logic.
- **Feature Specs:** Detailed docs for AI OCR, Statistics (MAE/MFE), Equity Curve math, and Mentor views.
- **Incident History:** 10+ simulated post-mortems (e.g., "R2 Rate Limiting", "Clerk Sync Delay").
- **ADRs:** 10+ records for architecture choices (e.g., "Why turborepo", "Why Tailwind v3/v4 split").

### 2. Clerk & API Security
- **Middleware:** Whitelist `/api/feature-flags` in `apps/app/src/middleware.ts`.
- **Validation:** Route handler will enforce `x-api-key` from headers.

### 3. Avoiding State Desync
- **Caching:** The API will use `no-store` and direct `fs` reads to ensure MCP and Dashboard always see the same state.
- **HMR:** `features.json` will be located in the workspace root `data/` folder, which is ignored by Next.js dev server watch patterns.

### 4. Qdrant Reliability
- **Idempotency:** `ingest.ts` may delete and recreate only the dedicated M3 collection, for example `tradewitness_m3_docs` or `tradewitness_bge_m3`. It must not delete arbitrary Qdrant collections. Vector size must match the configured provider (1536 for OpenAI, 1024 for BGE-M3).

## TradeWitness Test Scenarios

### Part 1 - Feature Flags MCP

Prompt:
```text
Check the current state of mentor_public_profile_v1 in TradeWitness feature flags.
If it is Disabled, move it to Testing.
Set traffic rollout to 25%.
Confirm the final state.
```

Expected chain:
`get_feature_info` -> `set_feature_state` -> `adjust_traffic_rollout` -> `get_feature_info`

### Part 2 - RAG CLI Queries

Run these through the direct query script before MCP:
1. `What database does TradeWitness use and why was it chosen?`
2. `Which TradeWitness features depend on stripe_billing_v1?`
3. `What happened in the latest incident involving screenshot upload?`

### Part 3 - End-to-End MCP Flow

Prompt:
```text
Find in the TradeWitness documentation what stripe_billing_v1 does and which
features depend on it. Then check its current feature flag state. If it is
Disabled and all dependencies are not Disabled, move it to Testing and set
traffic to 25%. Quote the documentation that explains why this feature exists.
```

## Non-Negotiable Requirements

- Do not use mocked ProShop data. All docs and feature flags must describe TradeWitness.
- Canonical runtime file: `data/feature-flags/features.json`.
- Do not rely on Clerk session cookies for MCP; use `x-api-key`.
- Do not let Next.js cache feature flag responses.
- Do not skip `chunks.jsonl`.
- The agent must use `search_project_docs` first in E2E.
- Do not edit `features.json` by hand during tests.

## Recommended Execution Order

1. Finish Task 10.1 so runtime feature flags and Feature Flags MCP work.
2. Finish Task 11 so the Qdrant RAG pipeline and Search-Docs MCP work.
3. Finish Task 12 so `report.md`, rules, verification, and all commits are submission-ready.

## Verification
- `pnpm lint` passes.
- Admin dashboard reflects MCP changes live.
- `chunks.jsonl` contains rich metadata (breadcrumbs, keywords, summary).
- `report.md` contains `## M3` with all required sections.
