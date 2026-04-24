# Technical Plan: Task 1 - Initialize Turborepo & Combine Projects

## Background & Motivation
The TradeWitness architecture relies on two distinct Next.js applications:
1. **Landing/Blog:** Based on `pranata-dev/personal-website` (Next.js 16, Tailwind v4, Supabase).
2. **Web App (SaaS):** Based on `Bilovodskyi/ai-trading-journal` (Next.js 15, Tailwind v3, Clerk, Neon/Drizzle).

To avoid dependency conflicts (specifically Tailwind v3 vs v4 and Next.js versions) while allowing future code sharing (e.g., shared TypeScript types for the Desktop collector), we must isolate these applications within a **Monorepo** using **Turborepo** and **pnpm** workspaces. 

## Out of Scope (For Task 1)
To ensure focus, the following items are explicitly **Out of Scope** for this initial setup and will be handled in subsequent tasks:
- **Task 2:** Docker/VPS Deployment
- **Task 3:** Integrating the `journedge` donor code (MAE/MFE, Equity Curve, etc.)
- **Task 4:** Deep content rebranding (custom routes, complex pages)
- **Task 5:** CI/CD pipeline setup
- **Task 6:** Desktop Collector (Electron/Tauri) implementation
- **Task 7:** Public Profile & Mentor Views logic

## Implementation Steps

### Phase 0: Node Version & Package Manager Lock
1. Add a `.nvmrc` and `.node-version` file at the root (e.g., Node 20.x or 22.x) to ensure environment consistency.
2. Pin the package manager via the `packageManager` field in the root `package.json` (e.g., `"packageManager": "pnpm@9.x"`). Add `engines` constraint.
3. Create an `.npmrc` file at the root containing `public-hoist-pattern[]=*next*`. This is required to fix common Next.js + pnpm hoisting issues in a monorepo.

### Phase 1: Workspace & Git Strategy
1. The working directory for this monorepo is `/home/dell/tradwitness/git/tradewitness/`.
2. Create the root directory structure (`apps/`, `packages/`).
3. Configure `pnpm-workspace.yaml` to include `apps/*` and `packages/*`.
4. Create an `UPSTREAM.md` file at the root to record the original commit hashes of the cloned repositories. We will clone with `--depth 1` and remove the `.git` folders. Note: We will **not** keep these in sync with upstream; this is a hard fork.

### Phase 2: Import Landing Page (`pranata-dev`)
1. `git clone --depth 1 https://github.com/pranata-dev/personal-website apps/landing` and `rm -rf apps/landing/.git`.
2. **License Posture:** Explicitly preserve the original `LICENSE` and `NOTICE` files within the `apps/landing` directory.
3. Rename its `package.json` name to `@tradewitness/landing`. Ensure its dev script runs on a specific port (e.g., `PORT=3000`).

### Phase 2.5: Landing Surface Rebranding
1. Perform surface-level rebranding in `apps/landing`: update Meta tags, OG images, Footer details, and basic branding copy. Deep route content remains for Task 4.

### Phase 3: Import Web App (`Bilovodskyi`)
1. `git clone --depth 1 https://github.com/Bilovodskyi/ai-trading-journal apps/app` and `rm -rf apps/app/.git`.
2. **License Posture:** Explicitly preserve the original `LICENSE` (Apache-2.0) and `NOTICE` files within the `apps/app` directory.
3. Rename its `package.json` name to `@tradewitness/app`. Ensure its dev script runs on `PORT=3001`.

### Phase 3.5: App Surface Rebranding & Feature Flags
1. Update basic branding and the Clerk application name configuration.
2. Add a feature flag `STRIPE_ENABLED=false` to gracefully disable payments/billing UI code without deleting it permanently, keeping it ready for future activation.

### Phase 4: Provisioning & Env Vars (Cost Estimate: $0–5/mo)
We will rely on free tiers for the MVP dev-scale:
1. **Neon Postgres:** Provision a database for `apps/app`. (Cost: $0/mo).
2. **Supabase:** Provision a project for `apps/landing` blog content. (Cost: $0/mo).
3. **Clerk:** Provision auth for `apps/app`. (Cost: $0/mo).
4. Map all necessary variables into `.env.local` files inside their respective app directories.

### Phase 5: Cross-Linking Projects
1. Introduce explicit environment variables: `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_LANDING_URL`.
2. Modify the navigation bar in `apps/landing` to include a "Login / Go to App" button pointing to `NEXT_PUBLIC_APP_URL`.
3. Modify the app layout in `apps/app` to include a "Back to Home" link pointing to `NEXT_PUBLIC_LANDING_URL`.

### Phase 6: DB Schema Init & Connectivity
1. Initialize the schema for `apps/app` by running Drizzle migrations/push against the Neon DB.
2. Run the Supabase schema initialization script (e.g., `supabase-schema.sql`) for `apps/landing`.
3. Perform a connectivity smoke-test to ensure both apps can read/write to their databases.

### Phase 7: Shared Types (TS Project References)
1. Create `packages/api-types/package.json` named `@tradewitness/api-types`.
2. Configure `tsconfig.json` with `composite: true` and `declaration: true` to enable TypeScript project references.
3. Link this package in the apps using `workspace:*` dependencies.

### Phase 8: ESLint Isolation
Maintain separate `.eslintrc.js` (or flat configs) inside each app (`apps/landing` and `apps/app`). Do **not** hoist a global root ESLint config yet, as the two projects have vastly different linting rules and plugins. This avoids massive conflict resolution at this stage.

### Phase 9: Turborepo Orchestration
1. Setup `turbo.json` with tasks for `build`, `dev`, and `lint`.
2. Explicitly whitelist environment variables (e.g., `NEXT_PUBLIC_*`) in `turbo.json` under `globalEnv` or specific task `env` arrays. This ensures Turbo caching isn't spuriously invalidated by secret changes while properly tracking public config changes.

## License Posture
The monorepo contains subdirectories with varying permissive licenses (MIT for `pranata-dev`, Apache-2.0 for `Bilovodskyi`). We strictly preserve original LICENSE files in their respective app directories to comply with attribution requirements. The overall codebase remains proprietary/commercial, leveraging the permissiveness of these licenses (which are generally AGPL-compatible provided no viral linking issues occur).

## Known Risks & Mitigations
1. **Database Connection Pooling (Neon):** Using unpooled `DATABASE_URL` for serverless environments causes connection limits to be reached quickly. **Mitigation:** Use pooled URLs for Prisma/Drizzle connections in production, and unpooled strictly for migrations.
2. **Turborepo Env Caching:** Missing `env` keys in `turbo.json` can cause incorrect builds to be cached. **Mitigation:** Strictly define `globalEnv` and task-specific `env` arrays.
3. **Tailwind v3/v4 Clashes:** **Mitigation:** Strict package isolation via pnpm workspaces; no shared UI package using Tailwind yet.
4. **Next.js + pnpm Hoisting:** **Mitigation:** The `.npmrc` file with `public-hoist-pattern[]=*next*`.
5. **Stripe Code Execution Errors:** The app might crash if Stripe keys are missing. **Mitigation:** The `STRIPE_ENABLED=false` feature flag bypasses Stripe initialization.
6. **Next.js Version Mismatch:** Next.js 15 vs 16. **Mitigation:** Handled by keeping dependencies isolated to their workspace package.json.
7. **Clerk Auth Redirects:** Misconfigured URLs can trap users in redirect loops. **Mitigation:** Explicit cross-linking env vars mapped to Clerk settings.
8. **Drizzle vs Supabase Client:** Two different data access patterns. **Mitigation:** Accepted technical debt; isolation keeps them from colliding.

## Phase 10: Verification & Smoke Tests
| Step | Action | Expected Result | Red Flag (Failure) |
|---|---|---|---|
| 1 | Run `pnpm install` | Success, `pnpm-lock.yaml` generated cleanly | ERESOLVE errors, peer dependency crashes |
| 2 | Run `pnpm dev` at root | Both servers (`landing` and `app`) start | Port conflicts, `next` binary not found |
| 3 | Access Landing page | Renders correctly with Tailwind v4 styling | Broken CSS, hydration errors |
| 4 | Access App (Journal) | Renders correctly, redirects to Clerk Auth | White screen, Stripe initialization crash |
| 5 | Cross-link: Landing -> App | Clicking login goes to `localhost:3001` / Auth | 404, broken link |
| 6 | Cross-link: App -> Landing | Clicking "Home" goes to `localhost:3000` | 404, broken link |
| 7 | Auth Login | Successful login via Clerk | Redirect loop, invalid API key error |
| 8 | DB Read (App) | Dashboard loads without DB errors | Neon connection timeout |
| 9 | DB Read (Landing) | Blog/Projects load data | Supabase RLS error, missing tables |
| 10 | Shared Types Import | `import { ... } from '@tradewitness/api-types'` works | TS compiler error `Cannot find module` |
| 11 | Run `pnpm build` | Both `.next` directories compile successfully | Turbo cache misses on env vars, build crash |