// M7 — chat_logs persistence: conversation resolution, history assembly, and
// the reserved-row lifecycle (log even on failure). See §2.2, §4.2, §4.5.
import "server-only";

import { randomUUID } from "crypto";
import { db } from "@/drizzle/db";
import { ChatLogsTable, type DetectedPiiSpan } from "@/drizzle/schema";
import { and, asc, eq } from "drizzle-orm";
import { ASSISTANT_MAX_HISTORY_TURNS } from "./config";
import type { ChatTurn } from "./agent";

export class ConversationError extends Error {
    constructor(
        message: string,
        readonly httpStatus: number
    ) {
        super(message);
    }
}

/**
 * Resolve a conversation id. A brand-new conversation gets a server-generated
 * id. An existing id MUST belong to the current user, otherwise we reject
 * (never silently create with a client-supplied UUID). See §4.2.
 */
export async function resolveConversation(
    userId: string,
    conversationId: string | undefined
): Promise<{ conversationId: string; isNew: boolean }> {
    if (!conversationId) {
        return { conversationId: randomUUID(), isNew: true };
    }

    const existing = await db.query.ChatLogsTable.findFirst({
        where: eq(ChatLogsTable.conversationId, conversationId),
        columns: { userId: true },
    });

    if (!existing) {
        throw new ConversationError("unknown conversation", 404);
    }
    if (existing.userId !== userId) {
        throw new ConversationError("forbidden", 403);
    }
    return { conversationId, isNew: false };
}

/**
 * Build the prior history. For the cloud leg pass publicOnly=true: only
 * `public` turns and their REDACTED text ever reach the cloud context. The
 * local leg gets the full raw history.
 */
export async function loadHistory(
    userId: string,
    conversationId: string,
    { publicOnly }: { publicOnly: boolean }
): Promise<ChatTurn[]> {
    const rows = await db.query.ChatLogsTable.findMany({
        where: and(
            eq(ChatLogsTable.conversationId, conversationId),
            eq(ChatLogsTable.userId, userId),
            eq(ChatLogsTable.status, "ok")
        ),
        orderBy: [asc(ChatLogsTable.createdAt), asc(ChatLogsTable.turnIndex)],
    });

    const turns: ChatTurn[] = [];
    for (const r of rows) {
        if (publicOnly && r.sensitivity !== "public") continue;
        const userText = publicOnly ? r.redactedUserMessage : r.userMessage;
        const asstText = publicOnly
            ? r.redactedAssistantResponse
            : r.assistantResponse;
        if (userText) turns.push({ role: "user", content: userText });
        if (asstText) turns.push({ role: "assistant", content: asstText });
    }

    // Keep only the most recent N turns.
    const maxMsgs = ASSISTANT_MAX_HISTORY_TURNS * 2;
    return turns.slice(-maxMsgs);
}

/** Insert the pending reserved row. Retries once on a turn-index race. */
export async function reserveTurn(args: {
    conversationId: string;
    userId: string;
    userMessage: string;
}): Promise<{ id: string; turnIndex: number }> {
    for (let attempt = 0; attempt < 2; attempt++) {
        const rows = await db.query.ChatLogsTable.findMany({
            where: eq(ChatLogsTable.conversationId, args.conversationId),
            columns: { turnIndex: true },
        });
        const nextTurnIndex =
            rows.reduce((m, r) => Math.max(m, r.turnIndex), -1) + 1;
        try {
            const [inserted] = await db
                .insert(ChatLogsTable)
                .values({
                    conversationId: args.conversationId,
                    turnIndex: nextTurnIndex,
                    userId: args.userId,
                    userMessage: args.userMessage,
                    status: "pending",
                    sensitivity: "private", // safe default until decided
                })
                .returning({ id: ChatLogsTable.id });
            return { id: inserted.id, turnIndex: nextTurnIndex };
        } catch (err) {
            // UNIQUE(conversation_id, turn_index) violation → another send won
            // the slot; recompute and retry once.
            if (attempt === 1) throw err;
        }
    }
    throw new ConversationError("turn conflict", 409);
}

export type FinalizeTurnInput = {
    id: string;
    sensitivity: "private" | "public";
    redactedUserMessage: string | null;
    assistantResponse: string | null;
    redactedAssistantResponse: string | null;
    detectedPii: DetectedPiiSpan[];
    userRedactionStatus: string | null;
    assistantRedactionStatus: string | null;
    status: "ok" | "failed" | "timeout" | "tool_error";
    errorCode: string | null;
    errorMessageRedacted: string | null;
    route: "local" | "cloud" | null;
    mode: string | null;
    model: string | null;
    latencyMs: number;
    costUsd: number | null;
    costReason: string | null;
};

export async function finalizeTurn(input: FinalizeTurnInput): Promise<void> {
    const { id, ...rest } = input;
    await db.update(ChatLogsTable).set(rest).where(eq(ChatLogsTable.id, id));
}
