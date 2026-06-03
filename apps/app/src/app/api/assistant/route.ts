// M7 — assistant entrypoint. The whole sensitivity router lives here in code.
// See homework/M7/PLAN.md §2, §4.2.
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { runAgent } from "@/server/assistant/agent";
import { CLAUDE_MODEL, ASSISTANT_MAX_MESSAGE_CHARS, OLLAMA_MODEL } from "@/server/assistant/config";
import { LOCAL_COST, computeCloudCost } from "@/server/assistant/cost";
import {
    ConversationError,
    finalizeTurn,
    loadHistory,
    reserveTurn,
    resolveConversation,
    type FinalizeTurnInput,
} from "@/server/assistant/persistence";
import { analyzeAndRedact } from "@/server/assistant/presidio";
import { buildSystemPrompt } from "@/server/assistant/prompts";
import { checkRateLimit } from "@/server/assistant/rate-limit";
import { route } from "@/server/assistant/router";
import { CLOUD_TOOLS, LOCAL_TOOLS } from "@/server/assistant/tools";

// Drizzle/postgres, Clerk and Anthropic/Ollama fetch are not Edge-compatible.
export const runtime = "nodejs";

const bodySchema = z.object({
    conversationId: z.string().uuid().optional(),
    message: z.string().trim().min(1).max(ASSISTANT_MAX_MESSAGE_CHARS),
});

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) return json({ error: "unauthenticated" }, 401);

    if (!checkRateLimit(userId)) return json({ error: "rate_limited" }, 429);

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return json({ error: "invalid_request" }, 400);
    const { message } = parsed.data;

    let conversationId: string;
    try {
        ({ conversationId } = await resolveConversation(
            userId,
            parsed.data.conversationId
        ));
    } catch (err) {
        if (err instanceof ConversationError)
            return json({ error: err.message }, err.httpStatus);
        return json({ error: "conversation_error" }, 500);
    }

    const reserved = await reserveTurn({ conversationId, userId, userMessage: message });

    const startedAt = Date.now();
    const patch: FinalizeTurnInput = {
        id: reserved.id,
        sensitivity: "private",
        redactedUserMessage: null,
        assistantResponse: null,
        redactedAssistantResponse: null,
        detectedPii: [],
        userRedactionStatus: null,
        assistantRedactionStatus: null,
        status: "failed",
        errorCode: null,
        errorMessageRedacted: null,
        route: null,
        mode: null,
        model: null,
        latencyMs: 0,
        costUsd: null,
        costReason: null,
    };

    let responseBody: unknown = { error: "assistant_failed" };
    let responseStatus = 500;

    try {
        // 1. Analyze the *message text* for PII.
        const msgRedaction = await analyzeAndRedact(message);
        patch.redactedUserMessage = msgRedaction.redacted;
        patch.userRedactionStatus = msgRedaction.status;

        // 2. Decide the route (PII + data-sensitivity, ordered rules).
        const decision = route(message, msgRedaction);
        patch.route = decision.target;
        patch.mode = decision.mode;

        const isCloud = decision.target === "cloud";
        const model = isCloud ? CLAUDE_MODEL : OLLAMA_MODEL;
        patch.model = model;

        // 3. History — cloud gets public/redacted only.
        const history = await loadHistory(userId, conversationId, {
            publicOnly: isCloud,
        });

        // 4. Run the agent (no cloud fallback for private — runAgent never
        //    switches legs; a private failure stays a local error).
        const result = await runAgent(decision.target, {
            system: buildSystemPrompt(decision.target),
            history,
            userMessage: message,
            tools: isCloud ? CLOUD_TOOLS : LOCAL_TOOLS,
        });
        patch.status = result.status;
        patch.errorCode = result.errorCode;
        patch.assistantResponse = result.text;

        // 5. Redact the response INDEPENDENTLY (it may carry DB PII not in the
        //    message).
        const respRedaction = await analyzeAndRedact(result.text);
        patch.redactedAssistantResponse = respRedaction.redacted;
        patch.assistantRedactionStatus = respRedaction.status;
        patch.detectedPii = [...msgRedaction.spans, ...respRedaction.spans];

        // 6. Sensitivity = max(request, response). Escalate to private if the
        //    response has PII or its redaction couldn't run (fail-closed).
        let sensitivity: "private" | "public" = isCloud ? "public" : "private";
        if (respRedaction.status !== "ok" || respRedaction.hasPii)
            sensitivity = "private";
        patch.sensitivity = sensitivity;

        // 7. Cost.
        const cost = isCloud ? computeCloudCost(model, result.usage) : LOCAL_COST;
        patch.costUsd = cost.costUsd;
        patch.costReason = cost.costReason;

        responseBody = {
            conversationId,
            message: result.text,
            route: decision.target,
            reason: decision.reason,
        };
        responseStatus = 200;
    } catch (err) {
        patch.status = "failed";
        patch.errorCode = err instanceof Error ? err.message : "error";
    } finally {
        // Log every turn, even failures (§4.2).
        patch.latencyMs = Date.now() - startedAt;
        try {
            await finalizeTurn(patch);
        } catch (logErr) {
            console.error("chat_logs finalize failed:", logErr);
        }
    }

    return json(responseBody, responseStatus);
}
