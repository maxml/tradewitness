# Fix #2 — Credit minting (`stripe.ts` / `user.ts` → `billing.ts`)

## Original finding (from `synthesis.md` Top-3 #2)

> **`apps/app/src/server/actions/stripe.ts:58` (`createTransaction`) + `apps/app/src/server/actions/user.ts:101` (`updateCredits`)** — Credit/token minting
> Sources: security-mate (HIGH, A01) + architecture-mate (C1, ADR-0001 violation) ⟵ cross-mate
> Exported `"use server"` actions mint credits for an arbitrary caller-supplied `userId`/`buyerId` with no auth or ownership check. No DB backstop (RLS off). Callable directly from a browser → credit fraud.
> Fix: derive `userId` from the session for client-reachable paths; reject caller-supplied id; keep webhook path server-only & verified.

## Root cause

Every async export of a `"use server"` file becomes a **client-callable RPC endpoint**. `createTransaction` and `updateCredits` grant tokens, yet their only legitimate callers are server-side (the Stripe webhook → `createTransaction` → `updateCredits`). Because the Stripe webhook has **no Clerk session**, an `auth()` guard inside them is impossible — so the real fix is to stop exposing them as actions at all.

## What I changed

**1. De-exposed the granting functions.** Moved `createTransaction` + `updateCredits` into a new **non-`"use server"`** module `apps/app/src/server/billing.ts`. They are now plain server functions — no longer reachable as client RPC endpoints. The credit amount is still derived server-side from `PLAN_TOKEN_MAP` (never from caller input).

```ts
// apps/app/src/server/billing.ts  (NO "use server")
export async function updateCredits({ plan, userId }: { plan: string; userId: string }) { /* moved verbatim */ }
export async function createTransaction(transaction: CreateTransactionParams) { /* moved verbatim */ }
```

**2. Webhook imports from the internal module** (server-to-server only):
```diff
-import { createTransaction } from "@/server/actions/stripe";
+import { createTransaction } from "@/server/billing";
```

**3. Hardened the one client-reachable path** (`checkoutCredits`, stays a server action) to derive the buyer from the session instead of trusting the caller:
```diff
 export async function checkoutCredits(transaction: CheckoutTransactionParams) {
+    const { userId } = await auth();
+    if (!userId) {
+        return { success: false, message: "You must be signed in to purchase credits." };
+    }
     ...
     metadata: {
         plan: transaction.plan,
         credits: PLAN_TOKEN_MAP[...],
-        buyerId: transaction.buyerId,
+        buyerId: userId,
     },
```

**4. `user.ts`** — removed `updateCredits` (and its divergent `PLAN_TOKEN_MAP`), leaving a relocation note.

Net source change: `stripe.ts` −28, `user.ts` −47, `route.ts` 1 line, `billing.ts` +new. No new dependencies. Public signatures of `checkoutCredits`, `createTransaction`, `updateCredits` unchanged (only their module home / exposure changed).

## Why this approach (trade-offs)

- **De-export > in-function guard.** A logged-in attacker calling `updateCredits({userId: self})` directly would pass any `auth()`-equality check (they *are* that user) and still mint free tokens. The only correct fix is to make the function unreachable from the client — hence the module move, which is the idiomatic Next.js way to keep server logic non-action.
- **Defense in depth with Fix #3.** Together with the webhook now failing closed (Fix #3), the full chain is: signed Stripe event → `createTransaction` (server-only) → `updateCredits` (server-only), with `buyerId` originating from an auth-gated checkout. There is no client-reachable token-granting entry point left.
- **Left the divergent `PLAN_TOKEN_MAP`** (`stripe.ts` `{"10":20,"5":60}` vs the moved one `{"5":20,"10":60}`) **as-is** — it's a separate MEDIUM finding, out of this fix's scope; touching it would change `checkoutCredits` credit display behavior.
- **Import-path churn:** the two test files that mocked `createTransaction`/`updateCredits` at their old locations were repointed to `@/server/billing` in this same commit (the move *is* the refactor). Behavior assertions are unchanged.

## Test status

Characterization tests pinned the invariant token math + transaction behavior **before** the move (token math `+20`/`+60`, user-not-found, invalid-plan, transaction insert) and pass unchanged **after**. Fix-verification cases added with the fix:

```
✓ tests/stage2/credit-minting.test.ts (7 tests)
  characterization (invariant) — updateCredits token math        3 ✓
  characterization (invariant) — createTransaction               1 ✓
  fix verification — credit minting closed                       3 ✓
    ✓ checkoutCredits puts the SESSION user in metadata.buyerId, not the caller's id
    ✓ checkoutCredits refuses an unauthenticated caller
    ✓ createTransaction and updateCredits are NOT exported as client-callable server actions
Test Files (whole stage2) 3 passed · Tests 19 passed (19) · tsc --noEmit: 0 errors
```

## Lessons learned

The headline vuln wasn't "missing an `auth()` call" — adding one wouldn't have helped, because a user authenticating *as themselves* can still self-mint. The fix is architectural: token-granting code must not live in a `"use server"` file at all. The AI review framed it as A01 + an ADR-0001 boundary failure, but the actual remedy was a module boundary, not a guard — a good reminder that "add an auth check" is not a universal security fix.
