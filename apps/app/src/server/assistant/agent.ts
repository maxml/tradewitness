// M7 — agent loop for both legs. Hard limits so a weak 3B local model can't
// hang in a tool loop or hallucinate a result. See homework/M7/PLAN.md §4.3.
import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import {
    ASSISTANT_MAX_TOOL_CALLS,
    ASSISTANT_TOOL_TIMEOUT_MS,
    ASSISTANT_TURN_TIMEOUT_MS,
    CLAUDE_MODEL,
    OLLAMA_BASE_URL,
    OLLAMA_MODEL,
    assertLocalOllamaUrl,
} from "./config";
import {
    findTool,
    normalizeAnthropicToolUse,
    normalizeOpenAIToolCall,
    toAnthropicTools,
    toOpenAITools,
    type ToolDefinition,
} from "./tools";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type AgentStatus = "ok" | "failed" | "timeout" | "tool_error";

export type AgentResult = {
    text: string;
    usage: { input_tokens?: number; output_tokens?: number } | null;
    status: AgentStatus;
    toolCalls: number;
    errorCode: string | null;
};

export type AgentInput = {
    system: string;
    history: ChatTurn[];
    userMessage: string;
    tools: ToolDefinition[];
};

const FALLBACK_TEXT =
    "Sorry — I couldn't put together an answer for that. Could you rephrase or narrow the question?";

function withTimeout<T>(p: Promise<T>, ms: number, code: string): Promise<T> {
    return Promise.race([
        p,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(code)), ms)
        ),
    ]);
}

async function runTool(
    tools: ToolDefinition[],
    name: string,
    args: Record<string, unknown>
): Promise<{ ok: true; result: unknown } | { ok: false; error: string }> {
    const tool = findTool(tools, name);
    if (!tool) return { ok: false, error: `unknown_tool:${name}` };
    try {
        const result = await withTimeout(
            tool.handler(args),
            ASSISTANT_TOOL_TIMEOUT_MS,
            "tool_timeout"
        );
        return { ok: true, result };
    } catch (err) {
        return {
            ok: false,
            error: err instanceof Error ? err.message : "tool_failed",
        };
    }
}

// ── Cloud leg (Anthropic) ────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

async function runCloud(input: AgentInput): Promise<AgentResult> {
    const messages: Anthropic.MessageParam[] = [
        ...input.history.map((t) => ({ role: t.role, content: t.content })),
        { role: "user" as const, content: input.userMessage },
    ];
    const tools = toAnthropicTools(input.tools);

    let toolCalls = 0;
    let lastText = "";
    let usage: AgentResult["usage"] = null;

    for (let step = 0; step <= ASSISTANT_MAX_TOOL_CALLS; step++) {
        const res = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 1500,
            system: input.system,
            messages,
            ...(tools.length > 0 ? { tools } : {}),
        });
        usage = { input_tokens: res.usage.input_tokens, output_tokens: res.usage.output_tokens };

        const textBlock = res.content.find((b) => b.type === "text");
        if (textBlock && textBlock.type === "text") lastText = textBlock.text;

        if (res.stop_reason !== "tool_use") {
            return { text: lastText, usage, status: "ok", toolCalls, errorCode: null };
        }

        // Run every requested tool, append results, loop.
        messages.push({ role: "assistant", content: res.content });
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const block of res.content) {
            if (block.type !== "tool_use") continue;
            if (toolCalls >= ASSISTANT_MAX_TOOL_CALLS) {
                return {
                    text: lastText || FALLBACK_TEXT,
                    usage,
                    status: "tool_error",
                    toolCalls,
                    errorCode: "max_tool_calls",
                };
            }
            toolCalls++;
            const call = normalizeAnthropicToolUse(block);
            const r = await runTool(input.tools, call.name, call.args);
            toolResults.push({
                type: "tool_result",
                tool_use_id: call.id,
                content: r.ok ? JSON.stringify(r.result) : `ERROR: ${r.error}`,
                is_error: !r.ok,
            });
        }
        messages.push({ role: "user", content: toolResults });
    }

    return {
        text: lastText || FALLBACK_TEXT,
        usage,
        status: "tool_error",
        toolCalls,
        errorCode: "max_tool_calls",
    };
}

// ── Local leg (Ollama, OpenAI-compatible) ────────────────────────────────────

type OpenAIMessage =
    | { role: "system" | "user" | "assistant"; content: string }
    | { role: "assistant"; content: string | null; tool_calls?: unknown[] }
    | { role: "tool"; tool_call_id: string; content: string };

async function ollamaChat(body: unknown): Promise<{
    choices: Array<{
        finish_reason: string;
        message: {
            content: string | null;
            tool_calls?: Array<{
                id?: string;
                function?: { name?: string; arguments?: string };
            }>;
        };
    }>;
}> {
    const res = await fetch(`${OLLAMA_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`ollama_${res.status}`);
    return res.json();
}

async function runLocal(input: AgentInput): Promise<AgentResult> {
    assertLocalOllamaUrl();

    const messages: OpenAIMessage[] = [
        { role: "system", content: input.system },
        ...input.history.map((t) => ({ role: t.role, content: t.content })),
        { role: "user", content: input.userMessage },
    ];
    const tools = toOpenAITools(input.tools);

    let toolCalls = 0;
    let lastText = "";

    for (let step = 0; step <= ASSISTANT_MAX_TOOL_CALLS; step++) {
        const data = await ollamaChat({
            model: OLLAMA_MODEL,
            messages,
            ...(tools.length > 0 ? { tools } : {}),
            stream: false,
        });
        const choice = data.choices?.[0];
        const msg = choice?.message;
        if (!msg) {
            return { text: FALLBACK_TEXT, usage: null, status: "failed", toolCalls, errorCode: "empty_response" };
        }
        if (msg.content) lastText = msg.content;

        const calls = msg.tool_calls ?? [];
        if (choice.finish_reason !== "tool_calls" || calls.length === 0) {
            return { text: lastText || FALLBACK_TEXT, usage: null, status: "ok", toolCalls, errorCode: null };
        }

        messages.push({ role: "assistant", content: msg.content ?? "", tool_calls: calls });
        for (const raw of calls) {
            if (toolCalls >= ASSISTANT_MAX_TOOL_CALLS) {
                return { text: lastText || FALLBACK_TEXT, usage: null, status: "tool_error", toolCalls, errorCode: "max_tool_calls" };
            }
            toolCalls++;
            let normalized;
            try {
                normalized = normalizeOpenAIToolCall(raw);
            } catch {
                messages.push({ role: "tool", tool_call_id: raw.id ?? "unknown", content: "ERROR: invalid_tool_json" });
                continue;
            }
            const r = await runTool(input.tools, normalized.name, normalized.args);
            messages.push({
                role: "tool",
                tool_call_id: normalized.id,
                content: r.ok ? JSON.stringify(r.result) : `ERROR: ${r.error}`,
            });
        }
    }

    return { text: lastText || FALLBACK_TEXT, usage: null, status: "tool_error", toolCalls, errorCode: "max_tool_calls" };
}

export async function runAgent(
    target: "local" | "cloud",
    input: AgentInput
): Promise<AgentResult> {
    const run = target === "cloud" ? runCloud(input) : runLocal(input);
    try {
        return await withTimeout(run, ASSISTANT_TURN_TIMEOUT_MS, "turn_timeout");
    } catch (err) {
        const code = err instanceof Error ? err.message : "agent_failed";
        const status: AgentStatus =
            code === "turn_timeout" ? "timeout" : "failed";
        return { text: FALLBACK_TEXT, usage: null, status, toolCalls: 0, errorCode: code };
    }
}
