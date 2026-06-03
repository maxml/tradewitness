# Task 15: M4 UI Refinement and Acceptance Fixes

## Goal
Fix technical regressions, complete missing requirements from Task 14, and ensure the Design System is correctly wired and accessible.

## 1. Technical Verification & Remaining Fixes

### 1.1. Verify Tailwind HSL Opacity Support
- **Status:** Completed in commit `2806d21f`.
- **Action:** Confirm that `bg-primary/10` and `border-primary/20` (used in `JournalSidebar`) actually render with transparency. If not, refine `tailwind.config.ts`.

### 1.2. Font & Style Integrity
- **Status:** Completed in commit `2806d21f`.
- **Action:** Verify that `font-sans` and `font-mono` classes are correctly applying Geist across the app. Ensure legacy styles restoration doesn't re-introduce "AI-slop" (gradients/shadows) into M4-redesigned pages.

## 2. Completing Missing Task 14 Requirements

### 2.1. Journal Entry Wrapper Redesign
- **Files:** `apps/app/src/app/private/journal/[...slug]/page.tsx`
- **Status:** Completed in this task.
- **Issue:** This page was skipped. It still used an unframed wrapper around the editor route.
- **Action:** Redesign to match the dark-minimal aesthetic (use `bg-background`, `text-foreground`).

### 2.2. Statistics Spacing (48px)
- **Files:** `apps/app/src/components/StatsGridPageOne.tsx` and `StatsGridPageTwo.tsx`.
- **Status:** Completed in this task.
- **Issue:** Previous desktop spacing was 24px (`gap-6`). The requirement is 48px for major stat sections.
- **Action:** Increase gaps to `gap-12` (48px) between major stat sections.

### 2.3. ASCII Wireframes (Non-Negotiable)
- **Status:** Completed before implementation in the Codex work log for this task.
- **Issue:** Skipped in Task 14.
- **Action:** You MUST provide an ASCII wireframe in the reasoning step for ANY UI modification in this task.

## 3. UX & Accessibility Refinements

### 3.1. Editor Menu Accessibility
- **Files:** `apps/app/src/components/journal/JournalEditor.tsx`
- **Status:** Completed in this task.
- **Issue:** `MenuBar` buttons had no visible focus state for keyboard navigation.
- **Action:** Add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` to all buttons.

### 3.2. ESLint Investigation
- **Status:** Verified. `pnpm --filter @tradewitness/app lint` exits 0. The current output contains existing warnings, but the circular JSON error is not reproducible in the current app lint path.
- **Action:** Resolve the "circular structure to JSON" error in `apps/app` properly. Identify the offending plugin/config in `eslint.config.mjs` instead of just disabling hooks rules.

---
**Status:** Completed
**Assigned to:** Codex
