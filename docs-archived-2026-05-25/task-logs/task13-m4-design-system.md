# Task 13: UI Design System & Dashboard (M4)

## Goal
Implement the TradeWitness Design System based on `DESIGN.md` and rebuild the Feature Dashboard.

## Steps

### 1. Apply DESIGN.md
- Ensure `CLAUDE.md` and `GEMINI.md` have the required links.
- Ensure `AGENTS.md` exists for Codex CLI and contains `## Design rules: see ./DESIGN.md`.
- Update `apps/app/src/app/globals.css` to use the CSS variables defined in `DESIGN.md` (using HSL space-separated values for Tailwind v3 compatibility).
- Ensure `apps/app/tailwind.config.ts` is configured to consume these CSS variables using `hsl(var(--variable))`. Note that `apps/app` uses Tailwind v3, so do NOT use v4 syntax like `@theme`.
- Wire the actual app font to the design system. Install the `geist` package in `apps/app` (`pnpm --filter @tradewitness/app add geist`) and configure `GeistSans` and `GeistMono` in `apps/app/src/app/layout.tsx`. Remove the old `main.woff2` local font.
- Remove or override legacy gradients/shadows only inside M4-touched app surfaces. Do not globally break the public landing page unless it is explicitly redesigned.

### 2. Feature Dashboard Refactoring (`apps/app/src/app/private/admin/features/page.tsx`)
The current page is a simple read-only Server Component. We must make it a fully interactive admin dashboard.

**Requirements:**
- **Route mapping:** The original M4 homework route is `/admin/featuredashboard`. In TradeWitness, the equivalent admin route remains `/private/admin/features` because all authenticated app routes live under `/private`. This mapping must be documented in `homework/M4/README.md`.
- **Admin link:** Add an admin-only link to `/private/admin/features` in the private Header/User admin area. It must not appear in the common navigation for non-admin users.
- **Page authorization:** Keep the page protected by Clerk and `ADMIN_EMAILS` (or a real admin role if one is added).
- **Server Action:** Create `src/app/private/admin/features/actions.ts` containing a Server Action `updateFeatureFlag(name, updates)`. This action will securely call our `PATCH /api/feature-flags` endpoint using the hidden `process.env.FEATURE_FLAGS_API_KEY`.
- **Server Action authorization:** The action itself must repeat the admin check with `currentUser()` + `ADMIN_EMAILS` before calling the internal API. Page-level protection is not enough.
- **Client Component:** Convert `page.tsx` into a hybrid: A Server Component fetches the initial flags securely (as it does now), then passes them to a new interactive Client Component (`FeatureDashboardClient.tsx`).
- **Fetch behavior:** Keep `export const dynamic = 'force-dynamic'` and `cache: 'no-store'` on server-side data reads so the dashboard never shows stale feature flags.
- **Functionality:**
  - Table or Grid layout showing all flags.
  - Status Badges (Enabled: Green, Testing: Blue/Yellow, Disabled: Gray).
  - **Toggle:** Switch to toggle status. Disabled -> Testing; Testing/Enabled -> Disabled. Optimistic UI is allowed, but it must rollback and show an error if the API rejects a dependency rule. Disabling must reset traffic to 0 after the server response.
  - **Slider:** 0-100% slider for `traffic_percentage`. Disable the slider when status is Disabled except for showing 0. Debounce or commit on release to avoid writing the JSON file on every pointer move.
  - **Search:** Input to filter flags by name.
  - **Filter:** Select dropdown to filter by Status (All, Enabled, Testing, Disabled).
- **States:**
  - Loading skeleton via `apps/app/src/app/private/admin/features/loading.tsx` or a Suspense boundary that actually renders while the Server Component fetches.
  - Empty state (if search yields no results).
  - Error state if the initial data load fails; do not silently render an empty table when the API is unavailable.
  - Error state for mutation failures (toast or inline message), with optimistic rollback.
- **A11y:** Keyboard navigable, ARIA labels.
- **Controls dependency choice:** `@radix-ui/react-select` already exists. If using Radix Switch/Slider, add `@radix-ui/react-switch` and `@radix-ui/react-slider` to `apps/app/package.json`; otherwise implement accessible native controls (`button role="switch"` and `input type="range"`).
- **Build guard:** Run the app build after implementation and fix TypeScript errors from Server Actions, client/server boundaries, or missing packages.

### 3. Review against Anti-Slop Guards
- Verify spacing is multiples of 8px.
- No gradients.
- Flat cards with 1px borders.
