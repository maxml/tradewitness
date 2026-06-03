# Task 12: Report, Rules, and All Commits

## Goal
Prepare the final submission artifact by documenting findings, updating agent rules, and verifying the end-to-end flow.

## Steps

### 1. Update Agent Rules
- **`CLAUDE.md` / `GEMINI.md`**:
  - Add a directive: "For queries about TradeWitness features or architecture, ALWAYS use `search_project_docs` first."
  - Add a directive: "To check or modify feature flags, ALWAYS use `feature-flags` MCP tools. Do NOT edit `data/feature-flags/features.json` directly."

### 2. Final Verification (End-to-End)
- Connect both MCP servers to the agent.
- Execute the E2E Scenario:
  > "Find in the TradeWitness documentation what stripe_billing_v1 does and which features depend on it. Then check its current feature flag state. If it is Disabled and all dependencies are not Disabled, move it to Testing and set traffic to 25%. Quote the documentation that explains why this feature exists."
- Capture the transcript of tool calls.

### 3. Reporting (`report.md`)
- Add a new section `## M3`.
- **Stack Justification:** Why TypeScript, Qdrant, and fs-based JSON storage.
- **Corpus Stats:** Number of files and approximate word count in `docs/m3-corpus/`.
- **RAG Logs:** CLI output for the 3 mandatory queries (with scores and sources).
- **MCP Logs:** Transcript of the E2E agent session showing both servers working in tandem.
- **Reflection:** 5-10 sentences on challenges (e.g., Clerk bypass, HMR protection, vector dimensions).

### 4. Commits & Cleanup
- Ensure all new packages and mcps are tracked.
- **Package Check:** `packages/feature-flags-core`.
- **MCP Check:** `mcps/feature-flags`, `mcps/search-docs`.
- **Data Check:** `data/feature-flags/features.json`, `docs/m3-corpus/**`.
- Verify `pnpm lint` and `pnpm build` pass across the monorepo.

### 5. Commit Series
- Do not submit one mega-commit. Split the M3 work into reviewable commits:
  1. `docs: plan m3 rag and mcp submission`
     - Task documents and roadmap updates only.
  2. `docs(m3): add tradewitness documentation corpus`
     - `docs/m3-corpus/**`, including `feature-flags-spec.md`.
  3. `feat(flags): add runtime feature flag seed and shared store`
     - `data/feature-flags/**`, `packages/feature-flags-core/**`, package wiring.
  4. `feat(app): add secure feature flag api and admin dashboard`
     - middleware, API route, admin page, env updates.
  5. `feat(mcp): add feature flags mcp server`
     - `mcps/feature-flags/**` and MCP config.
  6. `feat(rag): add qdrant chunking ingest and query pipeline`
     - `mcps/rag/**`, `chunks.jsonl`, Qdrant scripts.
  7. `feat(mcp): add search docs mcp server`
     - `mcps/search-docs/**`.
  8. `docs(report): add m3 logs reflection and rules`
     - `report.md`, `CLAUDE.md`, `GEMINI.md`.
  9. `chore: final m3 verification fixes`
     - Only small fixes found during final verification.
- Each commit should build on the previous one and avoid unrelated product refactors.

---
**Status:** Planned
**Assigned to:** Gemini CLI
