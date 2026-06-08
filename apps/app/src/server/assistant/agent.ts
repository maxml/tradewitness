// M7 — agent loop for both legs. Hard limits so a weak 3B local model can't
// hang in a tool loop or hallucinate a result. See homework/M7/PLAN.md §4.3.
//
// Both legs speak the SAME OpenAI-compatible chat/completions + tools protocol:
//   - local  → Ollama   (http://localhost:11435/v1, no auth)
//   - cloud  → OpenRouter (https://openrouter.ai/api/v1, Bearer key)
// One loop, two endpoints — keeps the legs from diverging (§4.3, §6).
import "server-only";

import {
    ASSISTANT_MAX_TOOL_CALLS,
    ASSISTANT_TOOL_TIMEOUT_MS,
    ASSISTANT_TURN_TIMEOUT_MS,
    CLOUD_MODEL,
    OLLAMA_BASE_URL,
    OLLAMA_MODEL,
    OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL,
    assertLocalOllamaUrl,
} from "./config";
import {
    findTool,
    normalizeOpenAIToolCall,
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

// ── Shared OpenAI-compatible transport + loop ────────────────────────────────

type OpenAIMessage =
    | { role: "system" | "user" | "assistant"; content: string }
    | { role: "assistant"; content: string | null; tool_calls?: unknown[] }
    | { role: "tool"; tool_call_id: string; content: string };

type OpenAIChatResponse = {
    choices?: Array<{
        finish_reason: string;
        message: {
            content: string | null;
            tool_calls?: Array<{
                id?: string;
                function?: { name?: string; arguments?: string };
            }>;
        };
    }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
};

async function openAIChat(
    baseUrl: string,
    apiKey: string | undefined,
    body: unknown
): Promise<OpenAIChatResponse> {
    const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`llm_${res.status}`);
    return res.json() as Promise<OpenAIChatResponse>;
}

async function runOpenAILoop(opts: {
    baseUrl: string;
    apiKey?: string;
    model: string;
    captureUsage: boolean;
    input: AgentInput;
}): Promise<AgentResult> {
    const { baseUrl, apiKey, model, captureUsage, input } = opts;

    const messages: OpenAIMessage[] = [
        { role: "system", content: input.system },
        ...input.history.map((t) => ({ role: t.role, content: t.content })),
        { role: "user", content: input.userMessage },
    ];
    const tools = toOpenAITools(input.tools);

    let toolCalls = 0;
    let lastText = "";
    let usage: AgentResult["usage"] = null;

    for (let step = 0; step <= ASSISTANT_MAX_TOOL_CALLS; step++) {
        const data = await openAIChat(baseUrl, apiKey, {
            model,
            messages,
            ...(tools.length > 0 ? { tools } : {}),
            stream: false,
        });
        if (captureUsage && data.usage) {
            usage = {
                input_tokens: data.usage.prompt_tokens,
                output_tokens: data.usage.completion_tokens,
            };
        }

        const choice = data.choices?.[0];
        const msg = choice?.message;
        if (!msg) {
            return { text: FALLBACK_TEXT, usage, status: "failed", toolCalls, errorCode: "empty_response" };
        }
        if (msg.content) lastText = msg.content;

        const calls = msg.tool_calls ?? [];
        if (choice.finish_reason !== "tool_calls" || calls.length === 0) {
            return { text: lastText || FALLBACK_TEXT, usage, status: "ok", toolCalls, errorCode: null };
        }

        messages.push({ role: "assistant", content: msg.content ?? "", tool_calls: calls });
        for (const raw of calls) {
            if (toolCalls >= ASSISTANT_MAX_TOOL_CALLS) {
                return { text: lastText || FALLBACK_TEXT, usage, status: "tool_error", toolCalls, errorCode: "max_tool_calls" };
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

    return { text: lastText || FALLBACK_TEXT, usage, status: "tool_error", toolCalls, errorCode: "max_tool_calls" };
}

// ── Cloud leg (OpenRouter) ───────────────────────────────────────────────────

async function runCloud(input: AgentInput): Promise<AgentResult> {
    if (!OPENROUTER_API_KEY) {
        return { text: FALLBACK_TEXT, usage: null, status: "failed", toolCalls: 0, errorCode: "no_openrouter_key" };
    }
    return runOpenAILoop({
        baseUrl: OPENROUTER_BASE_URL,
        apiKey: OPENROUTER_API_KEY,
        model: CLOUD_MODEL,
        captureUsage: true,
        input,
    });
}

// ── Local leg (Ollama) ───────────────────────────────────────────────────────

async function runLocal(input: AgentInput): Promise<AgentResult> {
    assertLocalOllamaUrl();
    return runOpenAILoop({
        baseUrl: OLLAMA_BASE_URL,
        model: OLLAMA_MODEL,
        captureUsage: false,
        input,
    });
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
