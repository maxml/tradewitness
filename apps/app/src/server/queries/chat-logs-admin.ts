// M7 — admin-only chat_logs reader. Selects ONLY redacted/metadata columns:
// the raw user_message / assistant_response never enter the client payload.
// The AdminChatLogRow type omits them so TS rejects accidental over-fetch.
// See homework/M7/PLAN.md §4.5, §8.
import "server-only";

import { db } from "@/drizzle/db";
import { ChatLogsTable, type DetectedPiiSpan } from "@/drizzle/schema";
import { currentUser } from "@clerk/nextjs/server";
import { desc } from "drizzle-orm";

export type AdminChatLogRow = {
    id: string;
    conversationId: string;
    turnIndex: number;
    userId: string;
    sensitivity: string;
    redactedUserMessage: string | null;
    redactedAssistantResponse: string | null;
    detectedPiiTypes: string[];
    userRedactionStatus: string | null;
    assistantRedactionStatus: string | null;
    status: string;
    errorCode: string | null;
    route: string | null;
    mode: string | null;
    model: string | null;
    latencyMs: number | null;
    costUsd: number | null;
    costReason: string | null;
    createdAt: Date;
};

export async function isCurrentUserAdmin(): Promise<boolean> {
    const user = await currentUser();
    const primaryEmail = user?.emailAddresses.find(
        (e) => e.id === user.primaryEmailAddressId
    )?.emailAddress;
    const adminEmails =
        process.env.ADMIN_EMAILS?.split(",")
            .map((e) => e.trim())
            .filter(Boolean) ?? [];
    return !!primaryEmail && adminEmails.includes(primaryEmail);
}

/** Admin-only. Returns redacted rows; raw text columns are never selected. */
export async function getChatLogsForAdmin(
    limit = 200
): Promise<AdminChatLogRow[]> {
    if (!(await isCurrentUserAdmin())) {
        throw new Error("forbidden");
    }

    const rows = await db
        .select({
            id: ChatLogsTable.id,
            conversationId: ChatLogsTable.conversationId,
            turnIndex: ChatLogsTable.turnIndex,
            userId: ChatLogsTable.userId,
            sensitivity: ChatLogsTable.sensitivity,
            redactedUserMessage: ChatLogsTable.redactedUserMessage,
            redactedAssistantResponse: ChatLogsTable.redactedAssistantResponse,
            detectedPii: ChatLogsTable.detectedPii,
            userRedactionStatus: ChatLogsTable.userRedactionStatus,
            assistantRedactionStatus: ChatLogsTable.assistantRedactionStatus,
            status: ChatLogsTable.status,
            errorCode: ChatLogsTable.errorCode,
            route: ChatLogsTable.route,
            mode: ChatLogsTable.mode,
            model: ChatLogsTable.model,
            latencyMs: ChatLogsTable.latencyMs,
            costUsd: ChatLogsTable.costUsd,
            costReason: ChatLogsTable.costReason,
            createdAt: ChatLogsTable.createdAt,
        })
        .from(ChatLogsTable)
        .orderBy(desc(ChatLogsTable.createdAt))
        .limit(limit);

    return rows.map(({ detectedPii, ...r }) => ({
        ...r,
        // Fail-closed: if Presidio didn't fully run for a field (status !== "ok"),
        // we can't trust the regex-only redaction to have removed names, so the
        // text is NOT sent to the client at all. The UI renders
        // <REDACTION_UNAVAILABLE> for null. See PLAN §4.5.
        redactedUserMessage:
            r.userRedactionStatus === "ok" ? r.redactedUserMessage : null,
        redactedAssistantResponse:
            r.assistantRedactionStatus === "ok"
                ? r.redactedAssistantResponse
                : null,
        detectedPiiTypes: [
            ...new Set(
                ((detectedPii as DetectedPiiSpan[] | null) ?? []).map(
                    (s) => s.type
                )
            ),
        ],
    }));
}
