# Module 4 Homework Report: UI Design System & Redesign

## Overview
This directory contains the artifacts and reporting for the M4 Homework.

Status note: this file starts as an implementation checklist and must be updated after the UI changes are completed. Do not mark a page as done until the route, states, accessibility, and anti-slop checks are verified in the running app.

Route mapping: the original homework asks for `/admin/featuredashboard` in `proshop_mern`. TradeWitness uses a Next.js private route namespace, so the equivalent admin dashboard route is `/private/admin/features`. Access is protected with Clerk plus `ADMIN_EMAILS`, and the dashboard link must appear only for admins.

## Redesigned Pages Checklist

| # | Page | Route | Visible | Status |
|---|---|---|---|---|
| 16 | **Admin: Feature Dashboard** | `/private/admin/features` | admin | [ ] Pending |
| 1 | Trade Journal | `/private/journal` | auth | [ ] Pending |
| 2 | Statistics | `/private/statistics` | auth | [ ] Pending |

## Feature Dashboard Acceptance Checklist
- [ ] Admin-only route is reachable at `/private/admin/features`.
- [ ] README route mapping explains why this is the TradeWitness equivalent of `/admin/featuredashboard`.
- [ ] Admin-only link is present in the private Header/User admin area and hidden from non-admin users.
- [ ] Page checks Clerk auth and `ADMIN_EMAILS`.
- [ ] Server Action repeats the admin check before calling `PATCH /api/feature-flags`.
- [ ] Initial data is fetched server-side with `x-api-key`, `dynamic = 'force-dynamic'`, and `cache: 'no-store'`.
- [ ] `loading.tsx` or an actual Suspense boundary renders a skeleton.
- [ ] Initial fetch failures render an error state, not an empty table.
- [ ] Empty search/filter results render an empty state.
- [ ] Search by feature name works.
- [ ] Status filter works for All, Enabled, Testing, Disabled.
- [ ] Status badges use three clear colors: Enabled green, Testing blue/yellow, Disabled gray.
- [ ] Toggle behavior is deterministic: Disabled -> Testing; Testing/Enabled -> Disabled.
- [ ] Toggle rolls back optimistic state and shows an error when dependency validation rejects a change.
- [ ] Slider updates `traffic_percentage`, is disabled for Disabled flags, and does not write on every pointer move.
- [ ] Keyboard navigation works with Tab, Enter, and Space.
- [ ] ARIA labels exist for toggle, slider, search, and status filter.

## Tools Used
- Gemini CLI (Architecture, Code orchestration)
- Claude Code (Secondary deep-dives, UI generation)
- Tailwind CSS v3 (Apps/App)
- Radix UI Primitives

## Component Decisions
- **Custom vs Library:** We opted for customized Radix UI components integrated directly with Tailwind, bypassing the default shadcn/ui theme to achieve a strictly flat, tech/finance aesthetic defined in `DESIGN.md`.
- **Server Actions:** To fulfill the "dashboard reads through API" requirement securely, we utilized Next.js Server Actions to proxy the PATCH requests to the internal API, keeping the `FEATURE_FLAGS_API_KEY` entirely on the server while allowing a rich Client Component dashboard.
- **Switch/Slider:** If Radix Switch/Slider are used, `@radix-ui/react-switch` and `@radix-ui/react-slider` must be added to `apps/app/package.json`. Otherwise, use accessible native controls.
- **M3 artifacts:** Keep the existing M3 `report.md` and MCP artifacts intact. M4 reporting lives in `homework/M4/README.md`.

## Anti-AI-Slop Audit
- [ ] No gradients used.
- [ ] No 2-column comparison blocks.
- [ ] No heavy borders (strictly 1px).
- [ ] Hover/Focus states applied.
- [ ] Skeletons used for loading.
- [ ] Strict 8px spacing scale enforced.
- [ ] No negative letter-spacing in M4 UI.
- [ ] No visible legacy `shadow-*`, `box-shadow`, `bg-gradient-*`, `linear-gradient`, `rounded-2xl`, or `rounded-3xl` on redesigned pages unless explicitly justified.
- [ ] `DESIGN.md` is linked from `CLAUDE.md`, `GEMINI.md`, and `AGENTS.md`.
