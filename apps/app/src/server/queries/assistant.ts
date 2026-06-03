// M7 — shared, session-scoped query layer for the assistant tools.
// CRITICAL: none of these take a userId argument. The id is always derived
// from the Clerk session here, in trusted code, so a jailbroken LLM has no
// handle to widen the scope. See homework/M7/PLAN.md §4.3.
import "server-only";

import { db } from "@/drizzle/db";
import {
    JournalTable,
    StrategyTable,
    TradeTable,
    UserTable,
} from "@/drizzle/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";

async function requireUserId(): Promise<string> {
    const { userId } = await auth();
    if (!userId) throw new Error("unauthenticated");
    return userId;
}

export type MyProfile = {
    name: string;
    email: string;
    capital: string | null;
    tokens: number | null;
};

export async function getMyProfile(): Promise<MyProfile> {
    const userId = await requireUserId();

    const row = await db.query.UserTable.findFirst({
        where: eq(UserTable.id, userId),
    });

    // UserTable.name is not guaranteed (addCapitalOrUpdate inserts only
    // capital/id/tokens). Fall back to the Clerk profile. See §4.3.
    let name = row?.name?.trim() ?? "";
    let email = row?.email?.trim() ?? "";
    if (!name || !email) {
        const clerkUser = await currentUser();
        if (!name) {
            name =
                [clerkUser?.firstName, clerkUser?.lastName]
                    .filter(Boolean)
                    .join(" ")
                    .trim() ||
                clerkUser?.username ||
                "";
        }
        if (!email) {
            email =
                clerkUser?.emailAddresses.find(
                    (e) => e.id === clerkUser.primaryEmailAddressId
                )?.emailAddress ?? "";
        }
    }

    return {
        name,
        email,
        capital: row?.capital ?? null,
        tokens: row?.tokens ?? null,
    };
}

export type MyTrade = {
    id: string;
    symbolName: string;
    positionType: string;
    openDate: string;
    closeDate: string | null;
    result: string | null;
    notes: string | null;
};

export async function getMyTrades({
    limit = 20,
}: { limit?: number } = {}): Promise<MyTrade[]> {
    const userId = await requireUserId();
    const safeLimit = Math.min(Math.max(1, limit), 100);

    const rows = await db.query.TradeTable.findMany({
        where: eq(TradeTable.userId, userId),
        orderBy: [desc(TradeTable.openDate)],
        limit: safeLimit,
        columns: {
            id: true,
            symbolName: true,
            positionType: true,
            openDate: true,
            closeDate: true,
            result: true,
            notes: true,
        },
    });

    return rows;
}

export type MyStrategy = {
    id: string;
    strategyName: string;
    description: string | null;
};

export async function getMyStrategies(): Promise<MyStrategy[]> {
    const userId = await requireUserId();

    return db.query.StrategyTable.findMany({
        where: eq(StrategyTable.userId, userId),
        columns: { id: true, strategyName: true, description: true },
        orderBy: [desc(StrategyTable.createdAt)],
    });
}

export async function getMyJournal({
    date,
}: { date?: string } = {}): Promise<
    | { date: string; content: unknown }
    | { recentDates: string[] }
> {
    const userId = await requireUserId();

    if (date) {
        const entry = await db.query.JournalTable.findFirst({
            where: and(
                eq(JournalTable.userId, userId),
                eq(JournalTable.date, date)
            ),
        });
        return { date, content: entry?.content ?? null };
    }

    const entries = await db.query.JournalTable.findMany({
        where: eq(JournalTable.userId, userId),
        columns: { date: true },
        orderBy: [desc(JournalTable.date)],
        limit: 10,
    });
    return { recentDates: entries.map((e) => e.date) };
}
