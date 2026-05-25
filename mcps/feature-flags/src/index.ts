#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FeatureFlag, FeatureFlagState } from "@tradewitness/feature-flags-core";

const API_URL = process.env.APP_INTERNAL_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3001";
const DEV_API_KEY = "local-m3-change-me";
const VALID_STATES = new Set<FeatureFlagState>(["Disabled", "Testing", "Enabled"]);

const server = new Server({
  name: "feature-flags-mcp",
  version: "0.1.0",
}, {
  capabilities: {
    tools: {}
  }
});

function getApiKey() {
  const apiKey = process.env.FEATURE_FLAGS_API_KEY ?? (process.env.NODE_ENV !== "production" ? DEV_API_KEY : "");
  if (!apiKey) throw new Error("FEATURE_FLAGS_API_KEY is required to call the feature flags API.");
  return apiKey;
}

function getFeature(flags: FeatureFlag[], featureName: string) {
  const flag = flags.find(f => f.name === featureName);
  if (!flag) throw new Error(`Flag not found: ${featureName}`);
  return flag;
}

function getStringArg(args: unknown, key: string) {
  if (!args || typeof args !== "object" || typeof (args as Record<string, unknown>)[key] !== "string") {
    throw new Error(`Missing or invalid string argument: ${key}`);
  }
  return (args as Record<string, string>)[key];
}

function getPercentageArg(args: unknown) {
  if (!args || typeof args !== "object") throw new Error("Missing arguments");
  const value = (args as Record<string, unknown>).percentage;
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 100) {
    throw new Error("percentage must be an integer from 0 to 100.");
  }
  return value as number;
}

function validateStateChange(flags: FeatureFlag[], featureName: string, state: FeatureFlagState) {
  const flag = getFeature(flags, featureName);

  if (state === "Testing" || state === "Enabled") {
    for (const depName of flag.depends_on) {
      const dep = getFeature(flags, depName);
      if (dep.status === "Disabled") {
        throw new Error(`Cannot set ${featureName} to ${state} because dependency ${depName} is Disabled.`);
      }
    }
  }

  if (state === "Disabled") {
    const activeChild = flags.find(child => child.depends_on.includes(featureName) && child.status !== "Disabled");
    if (activeChild) {
      throw new Error(`Cannot disable ${featureName} because child ${activeChild.name} is currently ${activeChild.status}.`);
    }
  }
}

async function fetchFlags(): Promise<FeatureFlag[]> {
  const res = await fetch(`${API_URL}/api/feature-flags`, {
    headers: { "x-api-key": getApiKey() },
  });
  if (!res.ok) throw new Error(`API Error: ${await res.text()}`);
  return res.json();
}

async function patchFlag(name: string, update: { status?: FeatureFlagState, traffic_percentage?: number }) {
  const res = await fetch(`${API_URL}/api/feature-flags`, {
    method: "PATCH",
    headers: { 
      "x-api-key": getApiKey(),
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
        description: [
          "Returns all feature flags as JSON, including name, status, traffic_percentage, depends_on, and last_modified.",
          "When to call: use this first when you need to discover available flags or compare several rollout states.",
          "When NOT to call: do not use it if you already know the exact flag name and only need one flag; use get_feature_info instead.",
          "Inputs: no arguments.",
          "Output: JSON array of FeatureFlag objects.",
          "Example: call list_features before deciding which TradeWitness flag controls mentor public profiles.",
          "You MUST use exact feature names from this output when calling mutation tools."
        ].join(" "),
        inputSchema: {
          type: "object",
          properties: {},
        }
      },
      {
        name: "get_feature_info",
        description: [
          "Returns one feature flag as JSON, including status, traffic_percentage, dependencies, and last_modified.",
          "When to call: use this before changing a known flag or when answering a question about a specific flag.",
          "When NOT to call: do not use it for broad discovery; use list_features instead.",
          "Inputs: { feature_name: string }, where feature_name is an exact flag name such as search_v2.",
          "Output: one FeatureFlag JSON object.",
          "Example: get_feature_info({ feature_name: 'mentor_public_profile_v1' }).",
          "You MUST reject unknown feature names and surface an error instead of guessing."
        ].join(" "),
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
        description: [
          "Changes a feature flag status and returns the updated FeatureFlag JSON object.",
          "When to call: use this to move a known flag between Disabled, Testing, and Enabled.",
          "When NOT to call: do not use this to change rollout percentage; use adjust_traffic_rollout.",
          "Inputs: { feature_name: string, state: 'Disabled' | 'Testing' | 'Enabled' }.",
          "Output: the updated FeatureFlag JSON object or an error.",
          "Example: set_feature_state({ feature_name: 'mentor_public_profile_v1', state: 'Testing' }).",
          "You MUST reject invalid states, unknown feature names, enabling/testing when dependencies are Disabled, and disabling a parent while active children depend on it."
        ].join(" "),
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
        description: [
          "Sets a feature flag traffic rollout percentage and returns the updated FeatureFlag JSON object.",
          "When to call: use this after a flag is in Testing or Enabled and you need to change rollout exposure.",
          "When NOT to call: do not use this to enable a Disabled flag; use set_feature_state first.",
          "Inputs: { feature_name: string, percentage: integer }, where percentage is 0 through 100.",
          "Output: the updated FeatureFlag JSON object or an error.",
          "Example: adjust_traffic_rollout({ feature_name: 'mentor_public_profile_v1', percentage: 25 }).",
          "You MUST reject unknown feature names, non-integer percentages, values outside 0..100, and percentage > 0 for Disabled flags."
        ].join(" "),
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
      const feature_name = getStringArg(request.params.arguments, "feature_name");
      const flags = await fetchFlags();
      const flag = getFeature(flags, feature_name);
      return {
        content: [{ type: "text", text: JSON.stringify(flag, null, 2) }]
      };
    }

    if (request.params.name === "set_feature_state") {
      const feature_name = getStringArg(request.params.arguments, "feature_name");
      const state = getStringArg(request.params.arguments, "state");
      if (!VALID_STATES.has(state as FeatureFlagState)) {
        throw new Error("state must be one of Disabled, Testing, or Enabled.");
      }

      const flags = await fetchFlags();
      validateStateChange(flags, feature_name, state as FeatureFlagState);
      const updatedFlag = await patchFlag(feature_name, { status: state as FeatureFlagState });
      return {
        content: [{ type: "text", text: JSON.stringify(updatedFlag, null, 2) }]
      };
    }

    if (request.params.name === "adjust_traffic_rollout") {
      const feature_name = getStringArg(request.params.arguments, "feature_name");
      const percentage = getPercentageArg(request.params.arguments);
      const flags = await fetchFlags();
      const flag = getFeature(flags, feature_name);
      if (flag.status === "Disabled" && percentage > 0) {
        throw new Error(`Cannot set traffic to ${percentage} because ${feature_name} is Disabled.`);
      }

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
