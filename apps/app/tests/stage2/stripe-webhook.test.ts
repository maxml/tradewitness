/**
 * M6 Stage 2 — Finding #3 (Stripe webhook fail-open) — CHARACTERIZATION tests.
 *
 * Target: apps/app/src/app/api/webhooks/stripe/route.ts  (POST)
 * Pins the INVARIANT happy/ignored-event behavior that must survive the fix.
 * MUST pass on the CURRENT (pre-fix) code.
 *
 * Fix-verification ("invalid signature => 400 + no credit") is in the
 * `describe('fix verification')` block, added with the fix — expected to FAIL
 * pre-fix (current code returns an implicit 200 on signature failure) and PASS post-fix.
 *
 * `createTransaction` is mocked. (Pre-fix the route imports it from
 * "@/server/actions/stripe"; after Finding #2's fix it imports from "@/server/billing",
 * at which point this mock target is repointed in that fix commit.)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const constructEvent = vi.fn();
vi.mock("stripe", () => ({ default: { webhooks: { constructEvent: (...a: unknown[]) => constructEvent(...a) } } }));

const createTransaction = vi.fn();
vi.mock("@/server/actions/stripe", () => ({
    createTransaction: (...a: unknown[]) => createTransaction(...a),
}));

import { POST } from "@/app/api/webhooks/stripe/route";

function fakeRequest(body: string): Request {
    return {
        text: async () => body,
        url: "https://app.tradewitness.test/api/webhooks/stripe",
        headers: { get: () => "t=1,v1=deadbeefsignature" },
    } as unknown as Request;
}

beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_123";
    createTransaction.mockResolvedValue({ id: "txn_ok" });
});

describe("characterization (invariant) — POST /api/webhooks/stripe", () => {
    it("credits a verified checkout.session.completed event and returns OK", async () => {
        constructEvent.mockReturnValue({
            type: "checkout.session.completed",
            data: {
                object: {
                    id: "cs_test_a1b2c3",
                    amount_total: 500,
                    metadata: { plan: "5", credits: "20", buyerId: "user_buyer_77c1" },
                },
            },
        });

        const res = await POST(fakeRequest("rawbody"));
        const json = await res.json();

        expect(createTransaction).toHaveBeenCalledTimes(1);
        expect(createTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                stripeId: "cs_test_a1b2c3",
                amount: 5,
                plan: "5",
                credits: 20,
                buyerId: "user_buyer_77c1",
            })
        );
        expect(json.message).toBe("OK");
    });

    it("ignores a non-checkout event and does not credit", async () => {
        constructEvent.mockReturnValue({
            type: "payment_intent.created",
            data: { object: {} },
        });

        const res = await POST(fakeRequest("rawbody"));

        expect(createTransaction).not.toHaveBeenCalled();
        expect(res.status).toBe(200);
    });
});
