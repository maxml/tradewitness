# Task 14: UI Redesign of Existing Pages (M4)

## Goal
Apply the new `DESIGN.md` aesthetics to at least two key existing pages in the `apps/app` application.

## Pages Selected for Redesign

1. **Trade Journal Page (`/private/journal`)**
   - Redesign the layout of trade entries.
   - Update typography to Geist.
   - Fix card elevations (flat, 1px border).
   - Ensure clear empty states if no trades exist.
   - Update action buttons (Add Trade, Export) to match the new button component specs.
   - Files to inspect/update as needed:
     - `apps/app/src/app/private/journal/page.tsx`
     - `apps/app/src/app/private/journal/[...slug]/page.tsx`
     - `apps/app/src/components/journal/JournalEditor.tsx`
     - `apps/app/src/components/journal/JournalSidebar.tsx`

2. **Statistics Page (`/private/statistics`)**
   - Refactor the layout of key metrics (Win Rate, Total PnL, Profit Factor).
   - Ensure the charts fit the dark/tech aesthetic.
   - Use Mono font (`Geist Mono`) for financial data numbers.
   - Apply generous spacing (48px between stat sections).
   - Replace the current div-only chart switch with an accessible button/switch that supports Tab, Enter, and Space.
   - Remove inline `style.boxShadow` logic and legacy `.switch-button` shadows.
   - Files to inspect/update as needed:
     - `apps/app/src/app/private/statistics/page.tsx`
     - `apps/app/src/components/StatsGridPageOne.tsx`
     - `apps/app/src/components/StatsGridPageTwo.tsx`
     - `apps/app/src/components/statistics/AddCapitalDialog.tsx`

3. **Shared private shell visible on redesigned pages**
   - The private layout is visible around `/private/journal`, `/private/statistics`, and `/private/admin/features`, so its obvious M4 violations must be fixed or scoped away.
   - Add the Feature Dashboard link in an admin-only area.
   - Remove visible gradients/shadows/oversized radii from the private shell if they are visible on M4 screenshots/diff review.
   - Files to inspect/update as needed:
     - `apps/app/src/components/private-layout/PrivateLayoutClient.tsx`
     - `apps/app/src/app/private/layout.tsx`

## Steps
- For each page, read the current code.
- Provide an ASCII wireframe in the reasoning step before modifying the code.
- Apply the changes ensuring zero loss of existing functionality.
- Verify interactive states (Hover, Focus) on all newly styled elements.
- Verify no redesigned page still renders `shadow-*`, `box-shadow`, `bg-gradient-*`, `linear-gradient`, `rounded-2xl`, or `rounded-3xl` unless there is an explicit documented exception.
- Keep the existing data flows intact: Redux trade records, `getCapital()`, chart data helpers, journal date routing, and editor behavior must continue to work.
- Update `homework/M4/README.md` only for pages that were actually redesigned.
