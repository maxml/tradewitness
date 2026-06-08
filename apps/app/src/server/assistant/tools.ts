// M7 — one internal ToolDefinition + provider adapters. Anthropic tools and
// Ollama (OpenAI-compatible) tools have different shapes; defining the tools
// once and adapting keeps the local/cloud legs from diverging. See §4.3, §6.
import "server-only";

import {
    getMyJournal,
    getMyProfile,
    getMyStrategies,
    getMyTrades,
} from "@/server/queries/assistant";

type JsonSchema = {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
};

export type ToolDefinition = {
    name: string;
    description: string;
    parameters: JsonSchema;
    // NOTE: handlers take ONLY the LLM-provided args — never a userId. The id
    // is derived from the session inside the shared query layer.
    handler: (args: Record<string, unknown>) => Promise<unknown>;
};

export type NormalizedToolCall = {
    id: string;
    name: string;
    args: Record<string, unknown>;
};

const numberParam = (description: string) => ({
    type: "number",
    description,
});

/** Full, session-scoped tool set — used ONLY on the local (private) leg. */
export const LOCAL_TOOLS: ToolDefinition[] = [
    {
        name: "get_my_profile",
        description:
            "Get the current user's profile: display name, starting capital and remaining tokens. Use it to greet the user by name.",
        parameters: { type: "object", properties: {}, additionalProperties: false },
        handler: () => getMyProfile(),
    },
    {
        name: "get_my_trades",
        description:
            "List the current user's most recent trades (symbol, dates, result, notes).",
        parameters: {
            type: "object",
            properties: { limit: numberParam("How many trades to return (default 20, max 100).") },
            additionalProperties: false,
        },
        handler: (args) =>
            getMyTrades({
                limit: typeof args.limit === "number" ? args.limit : undefined,
            }),
    },
    {
        name: "get_my_strategies",
        description: "List the current user's saved trading strategies.",
        parameters: { type: "object", properties: {}, additionalProperties: false },
        handler: () => getMyStrategies(),
    },
    {
        name: "get_my_journal",
        description:
            "Get the user's journal: pass a date (YYYY-MM-DD) for that day's entry, or omit it to list recent journal dates.",
        parameters: {
            type: "object",
            properties: {
                date: { type: "string", description: "YYYY-MM-DD (optional)." },
            },
            additionalProperties: false,
        },
        handler: (args) =>
            getMyJournal({
                date: typeof args.date === "string" ? args.date : undefined,
            }),
    },
];

/**
 * Cloud leg gets NO user-owned tools in DZ1 (sanitized-aggregates is
 * documented-only). See homework/M7/PLAN.md §2.2.
 */
export const CLOUD_TOOLS: ToolDefinition[] = [];

export function findTool(
    defs: ToolDefinition[],
    name: string
): ToolDefinition | undefined {
    return defs.find((t) => t.name === name);
}

// ── Adapters ────────────────────────────────────────────────────────────────

export function toAnthropicTools(defs: ToolDefinition[]) {
    return defs.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
    }));
}

export function toOpenAITools(defs: ToolDefinition[]) {
    return defs.map((t) => ({
        type: "function" as const,
        function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
        },
    }));
}

function safeParseArgs(raw: unknown): Record<string, unknown> {
    if (raw == null) return {};
    if (typeof raw === "object") return raw as Record<string, unknown>;
    if (typeof raw === "string") {
        if (raw.trim() === "") return {};
        try {
            const parsed = JSON.parse(raw);
            return typeof parsed === "object" && parsed !== null
                ? (parsed as Record<string, unknown>)
                : {};
        } catch {
            throw new Error("invalid_tool_json");
        }
    }
    return {};
}

/** Normalize an Anthropic `tool_use` block. */
export function normalizeAnthropicToolUse(block: {
    id: string;
    name: string;
    input: unknown;
}): NormalizedToolCall {
    return { id: block.id, name: block.name, args: safeParseArgs(block.input) };
}

/** Normalize an OpenAI/Ollama `tool_calls[]` entry. */
export function normalizeOpenAIToolCall(call: {
    id?: string;
    function?: { name?: string; arguments?: string };
}): NormalizedToolCall {
    return {
        id: call.id ?? `call_${call.function?.name ?? "unknown"}`,
        name: call.function?.name ?? "",
        args: safeParseArgs(call.function?.arguments),
    };
}
