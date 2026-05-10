#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { FeatureFlag } from "@tradewitness/feature-flags-core";

const API_URL = process.env.APP_INTERNAL_URL || "http://127.0.0.1:3001";
const API_KEY = process.env.FEATURE_FLAGS_API_KEY || "";

const server = new Server({
  name: "feature-flags-mcp",
  version: "0.1.0",
}, {
  capabilities: {
    tools: {}
  }
});

async function fetchFlags(): Promise<FeatureFlag[]> {
  const res = await fetch(`${API_URL}/api/feature-flags`, {
    headers: { "x-api-key": API_KEY },
  });
  if (!res.ok) throw new Error(`API Error: ${await res.text()}`);
  return res.json();
}

async function patchFlag(name: string, update: { status?: string, traffic_percentage?: number }) {
  const res = await fetch(`${API_URL}/api/feature-flags`, {
    method: "PATCH",
    headers: { 
      "x-api-key": API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, ...update })
  });
  if (!res.ok) throw new Error(`API Error: ${await res.text()}`);
  return res.json();
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_features",
        description: "Returns a list of all available feature flags and their current statuses. You MUST call this to discover available flags before attempting to modify them. Do NOT call this if you only need info about a specific flag you already know the name of.",
        inputSchema: {
          type: "object",
          properties: {},
        }
      },
      {
        name: "get_feature_info",
        description: "Returns full details for a specific feature flag including its status, traffic percentage, dependencies, and last modified date. You MUST call this before changing a flag's state to check its dependencies. Do NOT call this if you already have the full flag object.",
        inputSchema: {
          type: "object",
          properties: {
            feature_name: { type: "string", description: "The exact name of the feature flag (e.g., 'search_v2')." }
          },
          required: ["feature_name"]
        }
      },
      {
        name: "set_feature_state",
        description: "Changes the status of a feature flag. Valid statuses are 'Disabled', 'Testing', and 'Enabled'. You MUST ensure that if moving to 'Testing' or 'Enabled', all dependencies are NOT 'Disabled'. The tool will return an error if dependencies are not met.",
        inputSchema: {
          type: "object",
          properties: {
            feature_name: { type: "string" },
            state: { type: "string", enum: ["Disabled", "Testing", "Enabled"] }
          },
          required: ["feature_name", "state"]
        }
      },
      {
        name: "adjust_traffic_rollout",
        description: "Sets the traffic percentage (0-100) for a feature flag. You MUST ensure the feature is NOT 'Disabled' if setting traffic > 0. Do NOT use this tool if the feature is currently 'Disabled'.",
        inputSchema: {
          type: "object",
          properties: {
            feature_name: { type: "string" },
            percentage: { type: "number", minimum: 0, maximum: 100 }
          },
          required: ["feature_name", "percentage"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === "list_features") {
      const flags = await fetchFlags();
      return {
        content: [{ type: "text", text: JSON.stringify(flags, null, 2) }]
      };
    }

    if (request.params.name === "get_feature_info") {
      const { feature_name } = request.params.arguments as any;
      const flags = await fetchFlags();
      const flag = flags.find(f => f.name === feature_name);
      if (!flag) throw new Error(`Flag not found: ${feature_name}`);
      return {
        content: [{ type: "text", text: JSON.stringify(flag, null, 2) }]
      };
    }

    if (request.params.name === "set_feature_state") {
      const { feature_name, state } = request.params.arguments as any;
      const updatedFlag = await patchFlag(feature_name, { status: state });
      return {
        content: [{ type: "text", text: JSON.stringify(updatedFlag, null, 2) }]
      };
    }

    if (request.params.name === "adjust_traffic_rollout") {
      const { feature_name, percentage } = request.params.arguments as any;
      const updatedFlag = await patchFlag(feature_name, { traffic_percentage: percentage });
      return {
        content: [{ type: "text", text: JSON.stringify(updatedFlag, null, 2) }]
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
  console.error("Feature Flags MCP server running on stdio");
}

main().catch(console.error);
