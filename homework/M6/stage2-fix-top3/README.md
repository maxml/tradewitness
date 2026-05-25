# Stage 2 — Fix Top-3 (TradeWitness)

Fixed the 3 cross-mate-consensus findings from `../stage1-code-review/synthesis.md` using the
safe-refactor recipe: **characterization tests first (pin current behavior) → contained fix →
all tests still green**.

## Commit history (tests committed BEFORE fixes)

```
afc3721c fix(billing): de-expose credit-granting functions as server actions   ← fix #2
f2a33448 fix(webhooks): make stripe webhook fail closed on bad signature        ← fix #3
16c5d1ee fix(archive): close report IDOR via session-derived ownership          ← fix #1
3d4f9354 test(app): add Stage 2 characterization tests + vitest harness         ← tests first
```

| # | Finding | File(s) | Doc |
|---|---|---|---|
| 1 | Report IDOR | `apps/app/src/server/actions/archive.ts` | `fix-1-report-idor.md` |
| 2 | Credit minting | `stripe.ts` + `user.ts` → new `server/billing.ts` + webhook | `fix-2-credit-minting.md` |
| 3 | Stripe webhook fail-open | `apps/app/src/app/api/webhooks/stripe/route.ts` | `fix-3-stripe-webhook.md` |

## Tests

Framework: **Vitest** (installed in `apps/app`; `apps/app/vitest.config.ts` resolves the `@/` alias).
Runnable copies live with the code at `apps/app/tests/stage2/`; this folder holds submission copies.

```
$ cd apps/app && npx vitest run tests/stage2/

 ✓ tests/stage2/archive.idor.test.ts       (9 tests)   5 characterization + 4 fix-verification
 ✓ tests/stage2/stripe-webhook.test.ts     (3 tests)   2 characterization + 1 fix-verification
 ✓ tests/stage2/credit-minting.test.ts     (7 tests)   4 characterization + 3 fix-verification

 Test Files  3 passed (3)
      Tests  19 passed (19)
```

`npx tsc --noEmit` is also clean (0 errors).

### How the safe-refactor discipline shows up

- **Characterization (invariant) tests** pin behavior that must NOT change (owner happy-path, guards, error paths, token math). They pass on the **pre-fix** code (verified at the `test(app):` commit) and still pass after each fix.
- **Fix-verification tests** demonstrate the hole is closed (unauthenticated rejected, spoofed id ignored, webhook → 400, granting fns no longer exported). These **fail on pre-fix code** and pass post-fix — added in each fix commit.
- Each fix: < 200 lines, no new dependencies, public signatures unchanged, separate conventional commit.

## Quality checklist

- [x] 3 `fix-N.md` with original finding + diff + why + test status + lessons
- [x] ≥3 tests per finding (happy + edge + error), value-checking assertions
- [x] Characterization tests pass on original AND fixed code
- [x] No public API broken, no new deps, each fix a separate `fix(scope):` commit
- [x] Committed (local). Not pushed — say the word to push `m6-agents`.
