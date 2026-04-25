# Technical Plan: Task 9 - Docker & VPS Deployment

## Background & Motivation
The application is currently designed to run locally using `pnpm dev`. To deploy TradeWitness to a production VPS (Virtual Private Server) affordably, we need to containerize the applications using Docker. This avoids vendor lock-in with Vercel and allows us to host both the Landing Page and the Web App on a single $5-$10/month server.

## Scope & Impact
- Create a multi-stage `Dockerfile` capable of building and running a specific Next.js app within a Turborepo workspace.
- Create a `docker-compose.yml` to orchestrate both the `landing` and `app` containers.
- Configure environment variables for production.
- Provide instructions for setting up a reverse proxy (like Nginx or Caddy) to handle SSL/TLS and route `tradewitness.com` to the landing container and `app.tradewitness.com` to the web app container.

## Implementation Steps

### Phase 0: Pre-Deploy CI Gates (catch broken code BEFORE the Docker build)

**Why this phase exists.** During Task 2 we hit a syntax error in `apps/app/src/server/actions/trades.ts` (orphan `e.log(err);` block, mismatched braces, stray `}`) that survived several commits because nothing automatically checked the code. A Docker build on a VPS is a slow, expensive way to discover that kind of issue — a 20-second CI job would have caught it in seconds. We set this up here, before deploying anything, so prod never receives code that doesn't compile.

These three gates are layered fastest-first; each catches a different class of error.

1. **Syntax + type check (~5–15 s)** — fastest, catches the worst stuff:
   ```bash
   pnpm --filter @tradewitness/app exec tsc --noEmit
   pnpm --filter @tradewitness/landing exec tsc --noEmit
   ```
   The orphan-block bug in `trades.ts` would have failed here immediately (`Cannot find name 'e'`, unreachable code).

2. **ESLint (~10–20 s)** — catches what `tsc` doesn't:
   ```bash
   pnpm lint
   ```
   `no-unreachable`, `no-undef`, `no-unused-vars` flag the same orphan-block patterns from a different angle. Also enforces our code style on PRs.

3. **Full build (~30–60 s)** — final safety net:
   ```bash
   pnpm build
   ```
   Catches Next.js-specific failures the type checker misses (server/client component boundaries, `"use server"` constraints, dynamic route signatures).

**Wiring as a GitHub Action (`.github/workflows/ci.yml`):**
```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
permissions: { contents: read }

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter "@tradewitness/*" exec tsc --noEmit
      - run: pnpm lint
      - run: pnpm build
        env:
          # Build needs envs in turbo.json globalEnv. CI uses placeholders;
          # real values are injected at runtime in Docker, not at build time.
          DATABASE_URL: "postgresql://placeholder"
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_placeholder"
          CLERK_SECRET_KEY: "sk_test_placeholder"
          NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co"
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder"
```

**Required setup in repo:**
- Add a `type-check` script to `apps/app/package.json` and `apps/landing/package.json`: `"type-check": "tsc --noEmit"`. Then root `pnpm type-check` works through Turbo (the `type-check` task already exists in `turbo.json`).
- Branch protection on `main`: require the `CI / validate` check to pass before merge.

**Local dev hooks (optional, recommended):**
- Husky pre-commit running `pnpm --filter @tradewitness/app exec tsc --noEmit` only on changed packages — sub-second feedback before the commit lands.
- VS Code: enable `"typescript.tsserver.experimental.enableProjectDiagnostics": true` so `tsc`-level errors show up in the Problems panel without leaving the editor.

### Phase 1: Container build foundation
1. **Standalone Output:** Ensure `next.config.ts` in both apps has `output: 'standalone'` configured. This dramatically reduces the Docker image size by tracing only necessary dependencies.
2. **Dockerfile:** Write a `Dockerfile` in the root directory. It will use `turbo prune` to isolate the target app's dependencies, run `pnpm install`, build the Next.js app, and copy the `.next/standalone` output into a minimal Node.js runner image (like `node:20-alpine`).
3. **Docker Compose:** Create `docker-compose.yml`:
   - Service `landing`: Builds `apps/landing`, exposes port 3000.
   - Service `app`: Builds `apps/app`, exposes port 3001.
4. **Proxy Setup:** Write a sample `Caddyfile` or `nginx.conf` that automatically provisions Let's Encrypt certificates and routes incoming requests to the respective Docker ports.

## Verification
- Running `docker-compose build` succeeds without missing package errors.
- Running `docker-compose up -d` starts both containers.
- Both applications are accessible via `curl http://localhost:3000` and `curl http://localhost:3001` inside the VPS.