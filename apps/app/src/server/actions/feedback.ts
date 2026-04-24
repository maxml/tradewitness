"use server";

import { db } from "@/drizzle/db";
import { FeedbackTable } from "@/drizzle/schema";
import { auth } from "@clerk/nextjs/server";

export async function createFeedback({
    message,
}: {
    message: string;
}): Promise<{ success: true } | { success: false; message: string }> {
    try {
        const { userId } = await auth();
        if (!userId) {
            return { success: false, message: "Not authenticated" };
        }

        if (!message || message.trim().length === 0) {
            return { success: false, message: "Message is required" };
        }

        await db.insert(FeedbackTable).values({
            userId,
            message: message.trim(),
        });

        return { success: true };
    } catch (error) {
        console.error("Error creating feedback:", error);
        return { success: false, message: "Unexpected error" };
    }
}

