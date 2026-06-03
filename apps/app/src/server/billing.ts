/**
 * Server-internal billing helpers.
 *
 * IMPORTANT: this module deliberately has NO "use server" directive. createTransaction
 * and updateCredits grant tokens, so they must NOT be exposed as client-callable server
 * actions (that was the credit-minting vector — synthesis Top-3 #2). They are invoked only
 * server-side: createTransaction by the signature-verified Stripe webhook, and updateCredits
 * by createTransaction. The amount of credit is derived server-side from PLAN_TOKEN_MAP,
 * never from caller-supplied values.
 */
import { db } from "@/drizzle/db";
import { TransactionsTable, UserTable } from "@/drizzle/schema";
import { CreateTransactionParams } from "@/types/stripe.types";
import { eq } from "drizzle-orm";

const PLAN_TOKEN_MAP = {
    "5": 20,
    "10": 60,
} as const;

export async function updateCredits({
    plan,
    userId,
}: {
    plan: string;
    userId: string;
}): Promise<
    { success: true; message: string } | { success: false; message: string }
> {
    try {
        const user = await db.query.UserTable.findFirst({
            where: eq(UserTable.id, userId),
        });

        if (!user) {
            return { success: false, message: "User not found!" };
        }

        const updateTokensValue =
            PLAN_TOKEN_MAP[plan as keyof typeof PLAN_TOKEN_MAP];
        if (updateTokensValue === undefined) {
            return { success: false, message: "Invalid plan selected" };
        }

        await db
            .update(UserTable)
            .set({ tokens: Number(user.tokens) + updateTokensValue })
            .where(eq(UserTable.id, userId));

        return {
            success: true,
            message:
                "Thank you for your purchase! Tokens will be deposited into your account shortly.",
        };
    } catch (error) {
        console.error("Error checking tokens:", error);
        return {
            success: false,
            message: "An unexpected error occurred. Please try again later.",
        };
    }
}

export async function createTransaction(transaction: CreateTransactionParams) {
    try {
        const newTransaction = await db
            .insert(TransactionsTable)
            .values({ plan: transaction.plan, userId: transaction.buyerId });

        const response = await updateCredits({
            plan: transaction.plan,
            userId: transaction.buyerId,
        });

        console.log(response.message);

        return JSON.parse(JSON.stringify(newTransaction));
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "An unexpected error occurred. Please try again later.",
        };
    }
}
