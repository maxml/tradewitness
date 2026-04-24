# Architecture Decisions Record

## 1. Context

TradeWitness was initially envisioned as a single application, but the codebase was pieced together from two separate open-source donor repositories: a Marketing/Blog template (`pranata-dev`) built with Tailwind v4 and React 19, and a core SaaS journal (`Bilovodskyi`) built with Tailwind v3 and React 18. We needed a way to co-locate them in one git repository without destroying their dependency trees.

## 2. Decision

We decided to structure the project as a **Turborepo Monorepo** utilizing **pnpm workspaces**.

## 3. Alternatives Considered

- **Single Next.js App (Merge):** Moving the marketing pages into the SaaS application. Rejected because resolving the Tailwind v3/v4 conflicts and React hook deprecations would take weeks of manual CSS rewriting.
- **Separate Git Repositories:** Managing `tradewitness-landing` and `tradewitness-app` as distinct repos. Rejected because they need to share core Typescript interfaces (e.g., Zod schemas for User and Trade entities) which would require publishing private NPM packages.

## 4. Consequences

- **Positive:** Complete isolation of dependencies (`apps/landing` gets its own `package.json` separate from `apps/app`). We can easily share types via `packages/api-types`. Turborepo provides excellent caching for `pnpm build`, making CI pipelines exceptionally fast.
- **Negative:** Increased initial complexity. Issues with Next.js hoisting required patching the root `.npmrc` with `public-hoist-pattern[]=*next*`. The environment variable strategy requires whitelisting keys in `turbo.json`'s `globalEnv` array, otherwise changes to `.env` won't invalidate the build cache.