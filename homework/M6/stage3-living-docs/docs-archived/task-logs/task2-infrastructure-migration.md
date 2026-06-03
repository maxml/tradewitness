# Technical Plan: Task 2 — Cloud Infrastructure Migration (Supabase + R2)

## Background & Motivation

After Task 1 we have a Turborepo monorepo with `apps/landing`, `apps/app`, and `packages/api-types`. Turborepo orchestrates multiple Next.js apps with different stacks (Tailwind v3 vs v4, React 18 vs 19) and stays as our build orchestrator.

Task 2 unifies persistence on a single backend so there is one account to manage and one place to back up. Decisions (from `architecture-decisions.md`):

1. **Database:** Supabase Postgres (replaces Neon in `apps/app`). Landing already uses Supabase.
2. **Object Storage:** Cloudflare R2 — generous free tier (10 GB, zero egress), S3-compatible.
3. **Auth:** Keep Clerk for MVP speed.
4. **AI:** Anthropic API calls will be removed in a later task (BYOAI "copy prompt" flow). Task 2 does **not** touch the AI code, but also does not block on it — endpoints `/private/tradeAI` and `/api/claude` remain broken without `CLAUDE_API_KEY` until that task ships.

We explicitly avoid:
- The heavy `@aws-sdk/client-s3` — we use `aws4fetch` (~5 kB) instead.
- The Neon serverless HTTP driver — we switch to a standard Postgres driver for Supabase.
- Vercel-specific lock-in — everything must run as a plain Node.js Docker container on our VPS.

## Scope & Impact

- Replace `@neondatabase/serverless` with `postgres` (postgres.js) in `apps/app`.
- Rewrite `apps/app/src/drizzle/db.ts` to use `drizzle-orm/postgres-js`.
- Apply 18 existing Drizzle migrations to a fresh Supabase database via `db:migrate` (not `db:push`).
- Make an explicit RLS policy decision for `apps/app` tables (documented below).
- Verify `apps/landing` Supabase client picks up credentials correctly.
- Install `aws4fetch` and create `apps/app/src/lib/r2.ts` for screenshot upload/delete.
- Configure R2 bucket for public read (dashboard steps included).
- Update `.env.example`, `turbo.json` globalEnv, root-level docs.
- Remove now-unused `@neondatabase/serverless` dependency.

## Out of Scope (later tasks)

- **Task 3:** Remove `@anthropic-ai/sdk`, implement BYOAI "copy prompt" UI per architecture-decisions Q5.
- **Task 4:** Desktop collector (Tauri/Electron) that POSTs screenshots to `/api/trades`.
- **Task 5:** Deep rebrand of route copy (`/about`, `/experience`, dashboards).
- **Task 6:** Docker images + VPS deploy + Caddy/HTTPS.
- Data migration from existing Neon dev data (if any) — we accept fresh state.
- Presigned-URL uploads directly from browser/desktop — initial flow routes through server.

## Implementation Steps

### Phase 1: Database Driver Swap (MANDATORY, not optional)

The current driver `drizzle-orm/neon-http` uses Neon's proprietary HTTP endpoint and **does not work with Supabase**. Full swap required:

1. Remove Neon driver and add `postgres`:
   ```bash
   pnpm --filter @tradewitness/app remove @neondatabase/serverless
   pnpm --filter @tradewitness/app add postgres
   ```
2. Rewrite `apps/app/src/drizzle/db.ts` with HMR-safe `globalThis` caching:
   ```ts
   import { drizzle } from "drizzle-orm/postgres-js";
   import postgres from "postgres";
   import * as schema from "./schema";

   // Why globalThis: Next.js dev server re-evaluates this module on every
   // file save (HMR). Without caching, each reload creates a fresh postgres
   // client with its own pool (max 10). After ~6 saves we exhaust Supabase's
   // ~60-slot direct-connection limit → `sorry, too many clients already`.
   // Neon-HTTP didn't hit this because it was stateless per query.
   const globalForDb = globalThis as unknown as {
     postgresClient: ReturnType<typeof postgres> | undefined;
   };

   // prepare: false is REQUIRED for Supabase transaction pooler (port 6543).
   // max: 1 in dev because Next.js dev server is single-process anyway —
   // minimizes pool footprint so any stray reconnects stay well under quota.
   const client =
     globalForDb.postgresClient ??
     postgres(process.env.DATABASE_URL!, {
       prepare: false,
       max: process.env.NODE_ENV === "production" ? 10 : 1,
     });

   if (process.env.NODE_ENV !== "production") {
     globalForDb.postgresClient = client;
   }

   export const db = drizzle(client, { schema });
   ```
3. **Fix `apps/app/drizzle.config.ts` to load `.env.local`** — this is REQUIRED.
   The current file uses `import "dotenv/config"` which reads `.env` only (dotenv's default path is `process.cwd()/.env`). We keep credentials in `.env.local` per Next.js convention → `drizzle-kit` commands fail with "url is required". Replace:
   ```ts
   // BEFORE
   import "dotenv/config";
   ```
   with:
   ```ts
   // AFTER
   import { config } from "dotenv";
   config({ path: ".env.local" });
   // Safe no-op in production: dotenv doesn't throw on missing files, and
   // DATABASE_URL is injected via shell/secrets at runtime there.
   ```
4. Quick sanity test before proceeding:
   ```bash
   pnpm --filter @tradewitness/app exec tsx -e \
     "import { db } from './src/drizzle/db'; \
      db.execute('select 1 as ok').then(console.log).catch(console.error)"
   ```
   Expect `[{ ok: 1 }]` or similar. If "connection refused" or "password authentication failed" — stop, fix `DATABASE_URL`, retry.

### Phase 2: Supabase Project Setup & Connection String

1. In Supabase dashboard, create (or reuse) the project for TradeWitness app data. It can be the **same project as landing** (one DB, different tables) or a **separate project**. Recommend **same project, different tables** — cheaper on free tier, cross-table queries possible later.
2. Connection strings from Supabase → Settings → Database:
   - **Direct** (`db.xxx.supabase.co:5432`) — for migrations only. Use as `DATABASE_URL` when running `db:migrate`.
   - **Transaction pooler** (`aws-xxx.pooler.supabase.com:6543`) — for runtime in production (Docker/VPS). Supports many concurrent connections but no prepared statements (hence `prepare: false`).
   - **Session pooler** (`aws-xxx.pooler.supabase.com:5432`) — middle ground.
   For dev: direct connection is fine. For production: use transaction pooler.
3. Paste direct-connection URL into `apps/app/.env.local` as `DATABASE_URL`.

### Phase 3: Apply Migrations (NOT `db:push`)

There are 18 existing Drizzle migration files in `apps/app/drizzle/` (0000–0017). Using `db:push` would bypass them and risk future drift.

**Prerequisite:** `drizzle.config.ts` must already be fixed per Phase 1 step 3 (load `.env.local` explicitly). Without that fix, this command fails immediately with "url is required".

1. With direct-connection `DATABASE_URL` set in `apps/app/.env.local`:
   ```bash
   pnpm --filter @tradewitness/app db:migrate
   ```
2. Verify in Supabase Table Editor: tables `user`, `trades`, `strategies`, etc. created.
3. If `db:migrate` is not wired (check `package.json` scripts) — add it:
   ```json
   "db:migrate": "drizzle-kit migrate"
   ```

### Phase 4: RLS Policy Decision (CRITICAL — silent failure mode)

Supabase enables Row Level Security by default in its UI when tables are created through the dashboard. **Clerk auth does not populate `auth.uid()`** in Postgres, so RLS policies that rely on it will silently return empty rows.

**Decision for `apps/app` tables (`user`, `trades`, `strategies`, etc.):**

- **DISABLE RLS** on these tables. Access control stays at the application layer via Drizzle queries: `where(eq(TradeTable.userId, ctx.clerkUserId))`.
- The backend connects with Supabase's **service role key** only if we later need to bypass RLS; for now, the Postgres connection string with DB password is sufficient and does not interact with Supabase Auth.

**Landing tables (`projects`, `blog_posts`, `contact_submissions`) — RLS stays enabled** (they use the anon key from browser, and the existing `supabase-schema.sql` already defines public-read policies).

**Implementation:**
1. Open Supabase SQL Editor.
2. For each app table that has RLS on:
   ```sql
   ALTER TABLE public."user" DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.trades DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.strategies DISABLE ROW LEVEL SECURITY;
   -- repeat for every table created by Drizzle migrations
   ```
3. Verify in Table Editor: "RLS disabled" badge per table.

If you forget this step: all Drizzle `SELECT` queries return `[]` with no error. You'll debug for hours.

### Phase 5: Landing Supabase Client (light verification)

1. `apps/landing/src/lib/supabase.ts` already exists and reads `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from env. It has a placeholder fallback for missing config — do NOT rely on that in production.
2. Add real values to `apps/landing/.env.local`.
3. If landing uses the same Supabase project as app: run `apps/landing/supabase-schema.sql` in SQL Editor to create `projects`, `blog_posts`, `contact_submissions` tables (if not yet done).

### Phase 6: Cloudflare R2 — Bucket Setup (Dashboard)

1. Cloudflare Dashboard → R2 → Create bucket `tradewitness-screenshots` (or similar).
2. **Enable public access** (one of):
   - Settings → Public Access → enable `r2.dev` subdomain. Gives URL like `https://pub-xxx.r2.dev/<key>`.
   - OR connect a custom domain (e.g. `cdn.tradewitness.com`) — recommended long-term for branding and avoiding Cloudflare's warning banner on `r2.dev` URLs.
3. **CORS policy** — if browser ever loads images directly from R2:
   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3001", "https://app.tradewitness.com"],
       "AllowedMethods": ["GET"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
4. Settings → API Tokens → create token with `Object Read & Write` scope, scoped to this bucket. Save:
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
5. Note the **Account ID** (top-right of R2 dashboard).
6. Construct `R2_PUBLIC_URL`:
   - If `r2.dev`: `https://pub-<hash>.r2.dev`
   - If custom domain: `https://cdn.tradewitness.com`

### Phase 7: R2 Utility Module (`apps/app/src/lib/r2.ts`)

1. Install the signer:
   ```bash
   pnpm --filter @tradewitness/app add aws4fetch
   ```
2. Create `apps/app/src/lib/r2.ts`:
   ```ts
   import { AwsClient } from "aws4fetch";

   const r2 = new AwsClient({
     accessKeyId: process.env.R2_ACCESS_KEY_ID!,
     secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
     region: "auto",
     service: "s3",
   });

   const endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
   const bucket = process.env.R2_BUCKET_NAME!;
   const publicBase = process.env.R2_PUBLIC_URL!;

   // Body type excludes Blob/File/Stream on purpose: aws4fetch computes
   // SHA-256 of the body via crypto.subtle.digest(), which only accepts
   // BufferSource (ArrayBuffer / TypedArray) or string. Streams/Blobs
   // cannot be hashed in-place — callers must materialize them first.
   export async function uploadScreenshot(
     body: ArrayBuffer | Uint8Array | string,
     key: string,
     contentType: string
   ): Promise<string> {
     const url = `${endpoint}/${bucket}/${key}`;
     const res = await r2.fetch(url, {
       method: "PUT",
       body,
       headers: { "Content-Type": contentType },
     });
     if (!res.ok) throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`);
     return `${publicBase}/${key}`;
   }

   export async function deleteScreenshot(key: string): Promise<void> {
     const url = `${endpoint}/${bucket}/${key}`;
     const res = await r2.fetch(url, { method: "DELETE" });
     if (!res.ok && res.status !== 404) {
       throw new Error(`R2 delete failed: ${res.status}`);
     }
   }
   ```
3. **Call-site example — File/FormData → ArrayBuffer conversion required.** In a Next.js Route Handler receiving multipart form-data you get a `File` object, which must be materialized before signing:
   ```ts
   // apps/app/src/app/api/trades/route.ts (sketch)
   export async function POST(req: Request) {
     const form = await req.formData();
     const file = form.get("screenshot") as File;

     // Materialize to ArrayBuffer — aws4fetch cannot hash a File/Blob/Stream.
     const buffer = await file.arrayBuffer();

     const key = `${crypto.randomUUID()}.${file.type.split("/")[1] ?? "bin"}`;
     const url = await uploadScreenshot(buffer, key, file.type);
     // …persist { url, ...tradeFields } via Drizzle
     return Response.json({ url });
   }
   ```
   Note: materializing the whole file in memory is fine for typical trade screenshots (100–300 KB). For multi-MB payloads consider presigned URLs instead (deferred, see step 4).
4. **Upload flow decision for MVP:** desktop collector POSTs `multipart/form-data` to `/api/trades`, server calls `uploadScreenshot`, stores returned URL on the trade row, replies with full trade JSON. Simple but bandwidth passes through VPS. Presigned URLs direct-from-desktop → deferred.

### Phase 8: Env, turbo.json, and package.json cleanup

1. **`apps/app/.env.example`** — update per the fix in this same PR (see separate file change). Must include all R2 vars, correct names for `CLAUDE_API_KEY`, `STRIPE_SECRET_API_KEY`, `NEXT_PUBLIC_PUBLISHABLE_STRIPE_API_KEY`, `NEXT_PUBLIC_SERVER_URL`.
2. **`turbo.json`** — add to `globalEnv`:
   ```
   R2_ACCOUNT_ID
   R2_ACCESS_KEY_ID
   R2_SECRET_ACCESS_KEY
   R2_BUCKET_NAME
   R2_PUBLIC_URL
   NEXT_PUBLIC_SERVER_URL
   CLAUDE_API_KEY
   ```
   Remove any that will never be read (we keep `ANTHROPIC_API_KEY` out because the actual env var in code is `CLAUDE_API_KEY`).
3. **`apps/app/package.json`** — confirm after migrations:
   ```bash
   pnpm --filter @tradewitness/app remove @neondatabase/serverless
   ```
   (Double-check nothing still imports from it: `grep -r "@neondatabase" apps/app/src`.)
4. **Root `NOTICE`** — no change (upstream attributions unchanged).

### Phase 9: Smoke Tests (concrete, no ambiguity)

| # | Check                                       | Command / Action                                                                                     | Expected                                                                 | Red flag                                  |
| - | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------- |
| 1 | Driver swap compiles                        | `pnpm --filter @tradewitness/app type-check`                                                         | 0 errors                                                                 | Type error on `drizzle` constructor       |
| 1a| `drizzle-kit` reads `.env.local`            | `pnpm --filter @tradewitness/app exec drizzle-kit check`                                             | No "url is required"                                                     | Still errors → Phase 1 step 3 not applied |
| 1b| HMR doesn't leak connections                | In dev, save `db.ts` 10× then run a query                                                            | Same query works                                                         | `sorry, too many clients already` → globalThis cache missing |
| 2 | DB ping from app                            | Inline `tsx` snippet from Phase 1.4                                                                  | `[{ ok: 1 }]`                                                            | Auth failure → check `DATABASE_URL`       |
| 3 | Migrations applied                          | Supabase dashboard → Table Editor                                                                    | See `user`, `trades`, `strategies`, etc.                                 | No tables → `db:migrate` didn't run       |
| 4 | RLS disabled on app tables                  | SQL: `select tablename, rowsecurity from pg_tables where schemaname='public';`                      | `rowsecurity=false` for `user`, `trades`                                 | `true` → SELECT silently returns []       |
| 5 | Landing renders                             | `curl -sI http://localhost:3000`                                                                     | 200                                                                      | 500 → missing Supabase keys               |
| 6 | App sign-in page renders                    | `curl -sI http://localhost:3001/sign-in`                                                             | 200                                                                      | 500 → missing Clerk keys                  |
| 7 | App protected route redirects               | `curl -sI http://localhost:3001/private/calendar`                                                    | 302 or 307 to `/sign-in`                                                 | 500 → Clerk middleware crash              |
| 8 | Write a row via Clerk webhook simulation    | Sign up via Clerk → check `user` table                                                               | Row exists with `id = clerk_id`                                          | Empty table → webhook secret or URL wrong |
| 9 | R2 upload                                   | Temporary route `POST /api/test-r2` with 1×1 PNG                                                     | Response JSON `{ url: "https://…" }`                                     | `SignatureDoesNotMatch` → key/secret typo |
| 10| R2 public URL serves                        | `curl -sI $URL_FROM_STEP_9`                                                                          | 200 with `image/png`                                                     | 403 → public access not enabled in bucket |
| 11| Build still passes                          | `pnpm build`                                                                                         | Both apps build                                                          | Fail → driver API usage mismatch          |

If any of 4, 7, or 10 fail — do NOT proceed to desktop/collector work. They are known silent-failure modes.

## Known Risks & Mitigations

| Risk                                                          | Mitigation                                                                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Neon-HTTP driver incompatibility                              | Phase 1 is mandatory swap to `postgres.js` + `drizzle-orm/postgres-js`                                         |
| Supabase transaction pooler breaks prep stmts                 | `prepare: false` on `postgres()` client                                                                        |
| **HMR connection leak → "too many clients already"**          | Phase 1 caches `postgres()` on `globalThis` in dev + `max: 1` in dev                                           |
| **`drizzle-kit` reads only `.env`, not `.env.local`**         | Phase 1 step 3 replaces `import "dotenv/config"` with explicit `config({ path: ".env.local" })`                 |
| RLS enabled by default → silent empty responses               | Phase 4 disables RLS on app-owned tables; Phase 9 step 4 verifies                                              |
| Using `db:push` drifts from 18 migrations                     | Phase 3 uses `db:migrate`                                                                                      |
| R2 public URL returns 403                                     | Phase 6 explicitly enables public access + CORS in dashboard; Phase 9 step 10 verifies                          |
| **aws4fetch can't hash `File`/`Blob`/`Stream` payloads**      | Phase 7 signature excludes Blob; call-site example shows `await file.arrayBuffer()` before upload              |
| `/private/tradeAI` returns 500 post-migration                 | Known dangling — scheduled for Task 3 (BYOAI). Users won't see the tab if feature-flagged, but it exists today |
| Env var name drift from earlier iterations                    | Phase 8 rewrites `.env.example` from actual `process.env.*` references in code                                 |
| Large screenshot uploads tie up VPS bandwidth                 | Acceptable for MVP; presigned-direct-to-R2 deferred to post-MVP                                                |

## What changes in the repo

```
apps/app/
├── package.json                         ← remove @neondatabase/serverless, add postgres, aws4fetch
├── src/
│   ├── drizzle/db.ts                    ← rewrite (neon-http → postgres-js)
│   └── lib/r2.ts                        ← new file
└── .env.example                         ← new R2 vars + fixed names (separate commit ok)

turbo.json                               ← globalEnv expanded
docs/task2-infrastructure-migration.md   ← this plan
```

No changes to `apps/landing` code. No changes to `packages/api-types`.
