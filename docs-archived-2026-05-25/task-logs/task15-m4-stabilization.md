# Task 15: M4 Stabilization and Acceptance Fixes

## Goal
Repair the M4 implementation so the app builds cleanly and the submitted UI matches the M4 homework checklist.

## Scope
- Fix TypeScript/JSX syntax errors introduced in M4 UI files.
- Restore valid semantic Tailwind tokens for `bg-card`, `text-muted`, `border-border`, `bg-primary`, and related classes.
- Keep legacy variables available for untouched screens while making redesigned M4 pages use the new design system.
- Ensure the Feature Dashboard Server Action works in local development without leaking API keys to the browser.
- Remove visible anti-slop violations from M4-touched surfaces where practical.
- Verify with TypeScript and Next build.

## Acceptance Criteria
- `pnpm -C apps/app exec tsc --noEmit` passes.
- `pnpm --filter @tradewitness/app build` passes.
- `/private/admin/features` remains protected by Clerk plus `ADMIN_EMAILS`.
- `/private/admin/features` can list flags and PATCH flags locally with the same dev fallback as the API/page.
- `homework/M4/README.md` does not claim checks that are visibly false.
