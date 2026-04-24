# TradeWitness

Система для усвідомленого трейдингу. Фіксує угоди через скріншоти та
створює публічний рейтинг довіри, який неможливо підробити.

## Architecture

```
tradewitness-mono/
├── apps/
│   ├── landing/         # Next 16 + Tailwind v4 + Supabase — marketing site + blog
│   └── app/             # Next 15 + Tailwind v3 + Clerk + Neon/Drizzle — web app (SaaS)
└── packages/
    └── api-types/       # Shared Zod schemas (Trade, TradeInput, etc.)
```

A separate desktop collector (Electron/Tauri) lives outside this repo and
POSTs `TradeInput` (see `packages/api-types`) to the web app's API.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Accounts on: [Neon](https://neon.tech), [Clerk](https://clerk.com),
  [Supabase](https://supabase.com), [Anthropic](https://console.anthropic.com)

## Setup

```bash
# 1. Install
pnpm install

# 2. Fill env vars
cp apps/landing/.env.example apps/landing/.env.local
cp apps/app/.env.example apps/app/.env.local
# Edit both .env.local files with real credentials

# 3. Initialize databases
# Supabase: paste apps/landing/supabase-schema.sql into SQL editor
# Neon:
pnpm --filter @tradewitness/app db:push

# 4. Run
pnpm dev
```

After `pnpm dev`:
- http://localhost:3000 — landing / blog
- http://localhost:3001 — web app

## Scripts

- `pnpm dev` — both apps in watch mode via Turborepo
- `pnpm build` — production build for both
- `pnpm lint` — lint both workspaces
- `pnpm --filter @tradewitness/app db:studio` — Drizzle Studio for Neon DB

## Upstream attributions

This repo is a hard fork of two open-source projects — see `NOTICE` and
`UPSTREAM.md`. We do not maintain sync with upstream.

## License

Dual-licensed:

- Open source under **AGPL-3.0-or-later** (see `LICENSE`)
- Commercial license available (see `LICENSE-COMMERCIAL.md`)

Contact: maxafinin@gmail.com
