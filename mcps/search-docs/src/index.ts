#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') }); // Fallback

const QDRANT_URL = process.env.QDRANT_URL || 'http://127.0.0.1:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'tradewitness_m3_docs';
const EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER || 'bge-m3';

const client = new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY });

async function getEmbedding(text: string): Promise<number[]> {
  if (EMBEDDING_PROVIDER === 'openai') {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } else {
    // bge-m3 via xenova
    const { pipeline } = await import('@xenova/transformers');
    const embedder = await pipeline('feature-extraction', 'Xenova/bge-m3');
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }
}

const server = new Server({
  name: "search-docs-mcp",
  version: "0.1.0",
}, {
  capabilities: {
    tools: {}
  }
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_project_docs",
        description: "Searches the TradeWitness documentation corpus using semantic RAG. You MUST call this tool whenever you need to learn about product features, architecture, feature flags, or incident histories. Do NOT call this tool to read literal code or state files. Output includes matching document excerpts along with their file sources and parent headings. Use this before modifying any feature flags to understand their purpose and dependencies.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "The search query (e.g. 'stripe_billing_v1 dependencies')" },
            top_k: { type: "number", description: "Number of top results to return (default is 5).", default: 5 }
          },
          required: ["query"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === "search_project_docs") {
      const { query, top_k = 5 } = request.params.arguments as any;
      const vector = await getEmbedding(query);
      
      const results = await client.search(COLLECTION_NAME, {
        vector,
        limit: top_k,
        with_payload: true
      });

      const formattedResults = results.map((res: any, i) => {
        const p = res.payload;
        return `Result ${i + 1} (Score: ${res.score.toFixed(4)})\nSource: ${p.source_file}\nType: ${p.type}\nHeadings: ${p.parent_headings?.join(' > ')}\nContent snippet: ${p.summary}`;
      });

      return {
        content: [{ type: "text", text: formattedResults.join('\n\n') }]
      };
    }

    throw new McpError(ErrorCode.MethodNotFound, "Unknown tool");
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Search-Docs MCP server running on stdio");
}

main().catch(console.error);
