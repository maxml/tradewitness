# Fix #3 — Stripe webhook fails open (`webhooks/stripe/route.ts`)

## Original finding (from `synthesis.md` Top-3 #3)

> **`apps/app/src/app/api/webhooks/stripe/route.ts:18`** — Stripe webhook fails *open*
> Sources: security-mate (HIGH, A07) + architecture-mate (C2, missing integration contract) ⟵ cross-mate
> Returns HTTP 200 on signature-verification failure and still proceeds to `createTransaction` with attacker-controllable `metadata.buyerId`/`credits`. No idempotency.
> Fix: fail closed (return 400/401) on verify failure; only act on a verified event.

## What I changed (diff)

```diff
     try {
         event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
     } catch (err) {
-        return NextResponse.json({ message: "Webhook error", error: err });
+        // Fail CLOSED: an unverified payload must never reach createTransaction.
+        console.error("Stripe webhook signature verification failed:", err);
+        return NextResponse.json(
+            { message: "Webhook signature verification failed" },
+            { status: 400 }
+        );
     }
```

## Why this approach (trade-offs)

- **Fail closed.** The original `catch` returned `NextResponse.json({...})` with the default **200**, so a forged/garbled payload was acknowledged as success and execution fell through to `createTransaction`. Returning **400** makes the unverified path terminal — the `if (eventType === "checkout.session.completed")` block is never reached without a valid Stripe signature. (Returning early was always the intent; only the status code and the leak were wrong.)
- **No internal leak.** The raw `err` was previously echoed in the response body (A09 info-leak); it's now logged server-side via `console.error` and the client gets a generic message. This *adds* logging rather than removing any.
- **Scope discipline.** The success path (200 + `createTransaction`) and the function signature are untouched. Idempotency keys and metadata-shape validation (also mentioned by the reviewers) are deliberately left out of this contained fix — they're additive hardening, not the fail-open bug, and would widen the blast radius. Noted as follow-ups.
- This fix is the **practical mitigation for Finding #2 as well**: once the webhook only proceeds on a Stripe-verified event, the attacker-controlled `metadata.buyerId` path into `createTransaction` is closed at the entry point.

## Test status

Characterization tests pinned the verified-event happy path and the ignored-event path (both invariant, pass before & after). The fix-verification case was added with the fix.

```
✓ tests/stage2/stripe-webhook.test.ts (3 tests)
  characterization (invariant) — POST /api/webhooks/stripe   2 ✓
    ✓ credits a verified checkout.session.completed event and returns OK
    ✓ ignores a non-checkout event and does not credit
  fix verification — webhook fails closed                    1 ✓
    ✓ returns 400 and does NOT credit when signature verification throws
Test Files  1 passed (1) · Tests 3 passed (3)
```

(The fix-verification case asserts `res.status === 400`; on pre-fix code the response was an implicit 200 — verified to fail before the change.)

## Lessons learned

`NextResponse.json(body)` defaults to **200** — a `catch` block that "returns an error" but omits `{ status }` silently fails open, which is exactly the trap here. The bug wasn't missing error handling; it was error handling that *looked* fine but used the wrong status code. Easy for a human reviewer to read past.
