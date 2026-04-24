# TradeWitness

TradeWitness is an AI-powered trading journal and mentorship CRM. Traders can upload screenshots of their trades (to be parsed via OCR), track their win rate, build their equity curve, and generate a "Discipline Score" for mentors to review.

This project is structured as a **Turborepo Monorepo**, containing a Landing Page (`apps/landing`) and the main SaaS application (`apps/app`).

## Tech Stack
- **Framework:** Next.js 15 & 16 (App Router)
- **Language:** TypeScript
- **Monorepo:** Turborepo + pnpm
- **Database:** Supabase (PostgreSQL) + Drizzle ORM
- **Object Storage:** Cloudflare R2
- **Auth:** Clerk
- **Styling:** Tailwind CSS

## Folder Structure
```
tradewitness/
├── apps/
│   ├── app/           # The Trading Journal SaaS (Next.js 15, Drizzle, Clerk, R2)
│   └── landing/       # Marketing Landing Page & Blog (Next.js 16, Supabase Client)
├── packages/
│   └── api-types/     # Shared Zod schemas and TypeScript types
├── docs/              # Architecture Decisions (ADRs) and Task Plans
```

## Local Setup Instructions (Under 30 Minutes)

### Prerequisites
1. **Node.js** (v20.x or v22.x)
2. **pnpm** (v9.x) - `npm install -g pnpm@9`
3. A **Supabase** account (Free tier)
4. A **Clerk** account (Free tier)
5. A **Cloudflare R2** account (Free tier)

### 1. Environment Variables
Copy the `.env.example` file to `.env.local` in both `apps/landing` and `apps/app`, then fill in your actual keys.
```bash
cp .env.example apps/app/.env.local
cp .env.example apps/landing/.env.local
```
*(Refer to `.env.example` in the root for the required keys).*

### 2. Install Dependencies
Run pnpm install from the root. This will install dependencies for all workspace apps.
```bash
pnpm install
```

### 3. Database Migrations
Create the tables in your Supabase database by running the Drizzle migrations:
```bash
pnpm --filter @tradewitness/app db:migrate
```
*CRITICAL:* Go to your Supabase Dashboard -> SQL Editor and **disable Row Level Security (RLS)** for all newly created tables (e.g., `user`, `trades`, `strategies`), as auth is handled entirely by Clerk.

### 4. Run the Development Server
Start both applications simultaneously:
```bash
pnpm dev
```
- Landing Page: `http://localhost:3000`
- Web App (Journal): `http://localhost:3001`

### Troubleshooting
- **`url is required` error during migrations:** Ensure your `apps/app/.env.local` contains a valid `DATABASE_URL` pointing to your Supabase instance (Port 5432).
- **`too many clients already` error in Supabase:** This happens if you remove the `globalThis` connection caching from `db.ts` and Next.js hot-reloads too many times. Restart your dev server.
- **R2 `SignatureDoesNotMatch`:** Ensure your R2 Bucket is public and your R2 credentials have `Object Read & Write` permissions.