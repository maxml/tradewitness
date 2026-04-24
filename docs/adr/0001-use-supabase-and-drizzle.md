# Architecture Decisions Record

## 1. Context

TradeWitness required a unified, cost-effective infrastructure to replace its disjointed state (Neon for App, Supabase for Landing). The system needed robust relational storage capable of handling complex analytical queries (MAE, MFE, Equity Curves) while remaining on a free/hobby tier during the MVP phase.

## 2. Decision

We chose **Supabase Postgres** as the single source of truth for the entire monorepo, paired with **Drizzle ORM** for the Node.js application backend.

## 3. Alternatives Considered

- **Neon (Serverless Postgres):** Great branching and serverless HTTP driver, but we already had a Supabase instance for the Landing page. Maintaining two separate database vendors increases operational overhead.
- **PlanetScale:** Dropped its free tier entirely.
- **TypeORM / Prisma:** TypeORM relies on decorators and reflection, which clashes with Next.js Server Components. Prisma is good but has a heavier runtime engine. Drizzle is lightweight, fully type-safe, and runs natively on Edge/Serverless environments.

## 4. Consequences

- **Positive:** Cost is $0. We have a unified database management dashboard. Drizzle provides incredibly fast cold starts for Next.js API routes.
- **Negative:** Supabase Row Level Security (RLS) conflicts out-of-the-box with Clerk Authentication (since Clerk doesn't populate `auth.uid()`). As a consequence, we must explicitly **disable RLS** on Drizzle-managed tables and enforce authorization purely at the application layer via Drizzle queries (`where(eq(userId, currentUser))`).