# Module 4 Homework Report: UI Design System & Redesign

## Overview
This directory contains the artifacts and reporting for the M4 Homework. We have applied a cohesive design system to the TradeWitness application, rebuilt the Feature Dashboard for full interactivity, and redesigned key pages.

## Redesigned Pages Checklist

| # | Page | Route | Visible | Status |
|---|---|---|---|---|
| 16 | **Admin: Feature Dashboard** | `/private/admin/features` | admin | [x] Done |
| 1 | Trade Journal | `/private/journal` | auth | [x] Done |
| 2 | Statistics | `/private/statistics` | auth | [x] Done |

## Feature Dashboard Acceptance Checklist
- [x] Admin-only route is reachable at `/private/admin/features`.
- [x] README route mapping explains why this is the TradeWitness equivalent of `/admin/featuredashboard`.
- [x] Admin-only link is present in the private Header/User admin area and hidden from non-admin users.
- [x] Page checks Clerk auth and `ADMIN_EMAILS`.
- [x] Server Action repeats the admin check before calling `PATCH /api/feature-flags`.
- [x] Initial data is fetched server-side with `x-api-key`, `dynamic = 'force-dynamic'`, and `cache: 'no-store'`.
- [x] `loading.tsx` or an actual Suspense boundary renders a skeleton.
- [x] Initial fetch failures render an error state, not an empty table.
- [x] Empty search/filter results render an empty state.
- [x] Search by feature name works.
- [x] Status filter works for All, Enabled, Testing, Disabled.
- [x] Status badges use three clear colors: Enabled green, Testing blue/yellow, Disabled gray.
- [x] Toggle behavior is deterministic: Disabled -> Testing; Testing/Enabled -> Disabled.
- [x] Toggle rolls back optimistic state and shows an error when dependency validation rejects a change.
- [x] Slider updates `traffic_percentage`, is disabled for Disabled flags, and does not write on every pointer move.
- [x] Keyboard navigation works with Tab, Enter, and Space.
- [x] ARIA labels exist for toggle, slider, search, and status filter.

## Tools Used
- Gemini CLI (Architecture, Code orchestration)
- Claude Code (Secondary deep-dives, UI generation)
- Tailwind CSS v3 (Apps/App)
- Radix UI Primitives

## Component Decisions
- **Custom vs Library:** We opted for customized Radix UI components integrated directly with Tailwind, bypassing the default shadcn/ui theme to achieve a strictly flat, tech/finance aesthetic defined in `DESIGN.md`.
- **Server Actions:** To fulfill the "dashboard reads through API" requirement securely, we utilized Next.js Server Actions to proxy the PATCH requests to the internal API, keeping the `FEATURE_FLAGS_API_KEY` entirely on the server while allowing a rich Client Component dashboard.
- **Switch/Slider:** Used `@radix-ui/react-switch` and `@radix-ui/react-slider` for accessible interactive controls.
- **M3 artifacts:** All M3 artifacts remain intact and functional.

## Anti-AI-Slop Audit
- [x] No gradients used.
- [x] No 2-column comparison blocks.
- [x] No heavy borders (strictly 1px).
- [x] Hover/Focus states applied.
- [x] Skeletons used for loading.
- [x] Strict 8px spacing scale enforced.
- [x] No negative letter-spacing in M4 UI.
- [x] No visible legacy `shadow-*`, `box-shadow`, `bg-gradient-*`, `linear-gradient`, `rounded-2xl`, or `rounded-3xl` on redesigned pages.
- [x] `DESIGN.md` is linked from `CLAUDE.md`, `GEMINI.md`, and `AGENTS.md`.
