/**
 * M6 Stage 2 — Finding #2 (Credit minting) — CHARACTERIZATION tests.
 *
 * Target (pre-fix): updateCredits @ apps/app/src/server/actions/user.ts
 *                   createTransaction @ apps/app/src/server/actions/stripe.ts
 * These pin the INVARIANT token math + transaction behavior that must survive the fix.
 * MUST pass on the CURRENT (pre-fix) code.
 *
 * NOTE: the fix moves updateCredits + createTransaction into a non-action module
 * (@/server/billing) to de-expose them as client-callable server actions. When that
 * happens the two imports below are repointed to "@/server/billing" in the fix commit;
 * the assertions (behavior) stay identical and keep passing.
 *
 * Fix-verification cases (checkoutCredits derives buyerId from session; granting fns
 * no longer exported as actions) are in the `describe('fix verification')` block,
 * added with the fix — expected to FAIL pre-fix, PASS post-fix.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const userFindFirst = vi.fn<(...a: any[]) => any>();
const updWhere = vi.fn(() => Promise.resolve());
const updSet = vi.fn(() => ({ where: updWhere }));
const update = vi.fn<(...a: any[]) => { set: typeof updSet }>(() => ({ set: updSet }));
const insertValues = vi.fn(() => Promise.resolve([{ id: "txn_inserted" }]));
const insert = vi.fn<(...a: any[]) => { values: typeof insertValues }>(() => ({ values: insertValues }));

vi.mock("@/drizzle/db", () => ({
    db: {
        query: { UserTable: { findFirst: (...a: unknown[]) => userFindFirst(...a) } },
        update: (...a: unknown[]) => update(...a),
        insert: (...a: unknown[]) => insert(...a),
    },
}));

const authMock = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }));

// for the checkoutCredits fix-verification case (and loading stripe.ts):
const sessionsCreate = vi.fn<(...a: any[]) => Promise<{ url: string }>>(async () => ({
    url: "https://checkout.stripe.test/c/cs_test",
}));
vi.mock("stripe", () => ({
    default: class StripeMock {
        checkout = {
            sessions: { create: (...a: unknown[]) => sessionsCreate(...a) },
        };
    },
}));
const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({ redirect: (...a: unknown[]) => redirectMock(...a) }));

// Post-fix locations: the granting functions now live in the non-action module.
import { updateCredits, createTransaction } from "@/server/billing";
import { checkoutCredits } from "@/server/actions/stripe";
import * as stripeActions from "@/server/actions/stripe";
import * as userActions from "@/server/actions/user";

beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ userId: "user_buyer_77c1" });
});

describe("characterization (invariant) — updateCredits token math", () => {
    it("adds plan '5' => +20 tokens to the existing balance", async () => {
        userFindFirst.mockResolvedValue({ id: "user_buyer_77c1", tokens: 10 });

        const res = await updateCredits({ plan: "5", userId: "user_buyer_77c1" });

        expect(res.success).toBe(true);
        // 10 existing + 20 for plan "5" = 30
        expect(updSet).toHaveBeenCalledWith({ tokens: 30 });
    });

    it("returns {success:false,'User not found!'} for an unknown user", async () => {
        userFindFirst.mockResolvedValue(undefined);

        const res = await updateCredits({ plan: "5", userId: "ghost" });

        expect(res.success).toBe(false);
        expect(res.message).toBe("User not found!");
        expect(updSet).not.toHaveBeenCalled();
    });

    it("returns {success:false,'Invalid plan selected'} for an unknown plan", async () => {
        userFindFirst.mockResolvedValue({ id: "user_buyer_77c1", tokens: 10 });

        const res = await updateCredits({ plan: "999", userId: "user_buyer_77c1" });

        expect(res.success).toBe(false);
        expect(res.message).toBe("Invalid plan selected");
        expect(updSet).not.toHaveBeenCalled();
    });
});

describe("characterization (invariant) — createTransaction", () => {
    it("inserts a transaction row for the buyer and credits the account", async () => {
        userFindFirst.mockResolvedValue({ id: "user_buyer_77c1", tokens: 0 });

        const res = await createTransaction({
            plan: "5",
            buyerId: "user_buyer_77c1",
            amount: 5,
            credits: 20,
            stripeId: "cs_test_a1b2",
            createdAt: new Date(),
        } as unknown as Parameters<typeof createTransaction>[0]);

        // inserted a transaction (not the error object)
        expect(insert).toHaveBeenCalledTimes(1);
        expect(insertValues).toHaveBeenCalledWith(
            expect.objectContaining({ plan: "5", userId: "user_buyer_77c1" })
        );
        expect((res as { success?: boolean }).success).not.toBe(false);
    });
});

// Expected to FAIL pre-fix, PASS post-fix.
describe("fix verification — credit minting closed", () => {
    it("checkoutCredits puts the SESSION user in metadata.buyerId, not the caller's id", async () => {
        authMock.mockResolvedValue({ userId: "user_session_real" });
        process.env.STRIPE_SECRET_API_KEY = "sk_test_x";
        process.env.NEXT_PUBLIC_SERVER_URL = "https://app.tradewitness.test";

        await checkoutCredits({
            plan: "5",
            buyerId: "user_VICTIM_injected",
        } as unknown as Parameters<typeof checkoutCredits>[0]);

        expect(sessionsCreate).toHaveBeenCalledTimes(1);
        const arg = sessionsCreate.mock.calls[0][0] as {
            metadata: { buyerId: string };
        };
        expect(arg.metadata.buyerId).toBe("user_session_real");
    });

    it("checkoutCredits refuses an unauthenticated caller", async () => {
        authMock.mockResolvedValue({ userId: null });

        const res = await checkoutCredits({
            plan: "5",
            buyerId: "whoever",
        } as unknown as Parameters<typeof checkoutCredits>[0]);

        expect((res as { success: boolean }).success).toBe(false);
        expect(sessionsCreate).not.toHaveBeenCalled();
    });

    it("createTransaction and updateCredits are NOT exported as client-callable server actions", () => {
        expect((stripeActions as Record<string, unknown>).createTransaction).toBeUndefined();
        expect((userActions as Record<string, unknown>).updateCredits).toBeUndefined();
    });
});
