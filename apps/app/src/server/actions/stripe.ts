"use server";

import { CheckoutTransactionParams } from "@/types/stripe.types";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";

const PLAN_TOKEN_MAP = {
    "10": 20,
    "5": 60,
} as const;

export async function checkoutCredits(transaction: CheckoutTransactionParams) {
    // Derive the buyer from the authenticated session — never trust the
    // caller-supplied buyerId (prevents purchasing/crediting on someone else's behalf).
    const { userId } = await auth();
    if (!userId) {
        return {
            success: false,
            message: "You must be signed in to purchase credits.",
        };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_API_KEY!);

    const checkPlan =
        PLAN_TOKEN_MAP[transaction.plan as keyof typeof PLAN_TOKEN_MAP];
    if (!checkPlan) {
        return {
            success: false,
            message: "An unexpected error occurred. Please try again later.",
        };
    }

    const amount = Number(transaction.plan) * 100;

    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    unit_amount: amount,
                    product_data: {
                        name: transaction.plan,
                    },
                },
                quantity: 1,
            },
        ],
        metadata: {
            plan: transaction.plan,
            credits:
                PLAN_TOKEN_MAP[transaction.plan as keyof typeof PLAN_TOKEN_MAP],
            buyerId: userId,
        },
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/private/tokens`,
        cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/private/tokens`,
    });
    redirect(session.url!);
}
