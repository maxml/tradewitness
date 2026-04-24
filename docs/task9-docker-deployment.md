# Technical Plan: Task 9 - Docker & VPS Deployment

## Background & Motivation
The application is currently designed to run locally using `pnpm dev`. To deploy TradeWitness to a production VPS (Virtual Private Server) affordably, we need to containerize the applications using Docker. This avoids vendor lock-in with Vercel and allows us to host both the Landing Page and the Web App on a single $5-$10/month server.

## Scope & Impact
- Create a multi-stage `Dockerfile` capable of building and running a specific Next.js app within a Turborepo workspace.
- Create a `docker-compose.yml` to orchestrate both the `landing` and `app` containers.
- Configure environment variables for production.
- Provide instructions for setting up a reverse proxy (like Nginx or Caddy) to handle SSL/TLS and route `tradewitness.com` to the landing container and `app.tradewitness.com` to the web app container.

## Implementation Steps
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