# TradeWitness Agent Guidelines

## 1. Overview
TradeWitness is a Turborepo-based monorepo containing a Landing Page/Blog (`apps/landing`) and an AI-Powered Trading Journal Web Application (`apps/app`). The goal is to provide traders with a platform to upload screenshots (OCR parsed later), track their win rate, Equity Curve, MAE/MFE, and calculate a "Discipline Score" for mentors.

## 2. Tech Stack
- **Monorepo:** Turborepo, pnpm workspaces (`pnpm@9.x`)
- **Landing (`apps/landing`):** Next.js 16 (App Router), React 19, Tailwind CSS v4, Supabase Client (`@supabase/supabase-js`), Framer Motion.
- **Web App (`apps/app`):** Next.js 15 (App Router), React 19, Tailwind CSS v3, Clerk Auth, Drizzle ORM (`drizzle-orm`, `drizzle-kit`), Postgres standard driver (`postgres`), Cloudflare R2 (via `aws4fetch`), Anthropic AI SDK.
- **Shared (`packages/api-types`):** Pure TypeScript.
- **Database:** Supabase Postgres (Direct connection for migrations, Pooled for production serverless).

## 3. Architecture
```
tradewitness-mono/
├── apps/
│   ├── app/                 # Main SaaS application (Trading Journal)
│   └── landing/             # Marketing and Blog site
├── packages/
│   └── api-types/           # Shared TypeScript types for API and Desktop Collector
├── docs/                    # Architecture Decision Records and Task Plans
├── package.json             # Root workspace config
├── turbo.json               # Build orchestration and env caching
└── pnpm-workspace.yaml
```
- The Web App connects to Supabase via Drizzle.
- The Landing connects to Supabase via `@supabase/supabase-js` (REST/GraphQL).
- Images are stored in Cloudflare R2 using native `fetch` + `aws4fetch` signature.

## 4. Commands
- `pnpm install`: Install dependencies across the workspace.
- `pnpm dev`: Starts both apps (`landing` on :3000, `app` on :3001).
- `pnpm build`: Builds all apps and packages via Turborepo.
- `pnpm --filter @tradewitness/app db:migrate`: Applies Drizzle migrations to Supabase.
- `pnpm --filter @tradewitness/app db:studio`: Opens Drizzle Studio.

## 5. Conventions
- **TypeScript:** Strict mode is enabled. Explicitly type all API boundaries.
- **Database Connection:** In `apps/app`, the database connection MUST be cached in `globalThis` to prevent exhausting the Supabase connection limit during Next.js dev HMR.
- **Drizzle Migrations:** Always use `db:migrate` (never `db:push`) to prevent data drift from existing migration files.
- **Object Storage:** Use `aws4fetch` to sign requests to Cloudflare R2 instead of installing `@aws-sdk/client-s3`. Materialize streams/files to `ArrayBuffer` before hashing.

## 6. What NOT to do
- **DO NOT** hoist a global ESLint config. Keep linting isolated per app due to React 18/19 and Next 15/16 plugin differences.
- **DO NOT** use `@neondatabase/serverless`. We migrated to Supabase; stick to `postgres.js`.
- **DO NOT** enable Supabase Row Level Security (RLS) on `apps/app` tables. Clerk handles auth, so Supabase's `auth.uid()` will be empty. Access control must be handled in Drizzle queries (e.g., `where(eq(TradeTable.userId, ctx.userId))`).

## 7. Custom Project Rules (Unwritten Rules)
- **Rule 1:** When adding a new environment variable (e.g., a new API key), you MUST whitelist it in `turbo.json` under `globalEnv`, otherwise the Turborepo cache will serve stale builds.
- **Rule 2:** Avoid merging Tailwind configurations between `apps/landing` and `apps/app`. They use different major versions (v4 vs v3). Shared UI components should not rely on a global `tailwind.config.js`.
- **Rule 3:** All new Drizzle schema modifications in `apps/app/src/drizzle/schema.ts` must be accompanied by running `drizzle-kit generate` to create the SQL migration file before committing.