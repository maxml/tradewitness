# Task 11: Qdrant RAG and Search-Docs MCP (Detailed)

## Goal
Construct a massive 30k+ word corpus for TradeWitness and implement a high-performance RAG pipeline with Qdrant.

## Steps

### 1. Corpus Generation (30k+ Words)
- Create `docs/m3-corpus/` directory.
- Generate high-quality markdown files:
  - `architecture/*.md`: (State, Auth, R2, DB, Turborepo).
  - `features/*.md`: (Journal, Stats, Mentor, AI, Billing).
  - `feature-flags-spec.md`: MUST explicitly describe the dependency graph in natural language (e.g., "tokens_purchase_v1 depends on stripe_billing_v1") so the RAG agent can answer E2E queries. Additionally, copy all relevant "M3 Feature Flag Hooks" from the root `task*.md` files into this spec to ensure they are available for retrieval.
  - `incidents/*.md`: 10+ simulated post-mortems.
  - `adrs/*.md`: 10+ Architecture Decision Records.
  - `runbooks/*.md`: Operations and Troubleshooting.
- **Requirement:** Ensure rich frontmatter (`type`, `tags`, `last_modified`).

### 2. Ingestion Pipeline (`mcps/rag/ingest.ts`)
- Setup Qdrant collection. **Vector size must match provider (1536 for OpenAI, 1024 for BGE-M3).**
- Target: Ingest **only** `docs/m3-corpus/**/*.md` to avoid retrieval noise from older roadmap or planning documents.
- Use `RecursiveCharacterTextSplitter` with Markdown awareness.
- **Metadata Extraction:** Extract headings as breadcrumbs, keywords, and summaries for each chunk.
- **Artifact:** Generate `mcps/rag/chunks.jsonl` containing all chunks for submission.

### 3. Query & CLI (`mcps/rag/query.ts`)
- Implement semantic search using the configured provider.
- Use `ts-node` or `tsx` to run queries.
- Output top-K results with scores and source file paths.
- Record logs for mandatory homework questions.

### 4. Search-Docs MCP Server (`mcps/search-docs`)
- Wrap query logic into an MCP tool `search_project_docs`.
- **Tool Description Requirements:** You MUST provide a rich description matching the MCP Design Principles. It must explicitly include "when to call", "when NOT to call", expected input/output formats, examples, and imperative "You MUST" rules regarding its scope.
- Contextual guidance: Instruct the agent to use this tool for all product knowledge queries.

### 5. E2E Validation
- Connect both Feature Flag and Search MCPs.
- Execute complex prompt: "Analyze stripe_billing_v1 dependencies in docs and enable if safe."
