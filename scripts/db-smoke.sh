#!/usr/bin/env bash
#
# db-smoke.sh — Phase 9 DB smoke tests for TradeWitness app.
#
# Runs a quick battery of checks against the Supabase Postgres instance:
#   1. connectivity
#   2. tables exist (migrations applied)
#   3. RLS state on public schema (must be disabled for app-owned tables)
#   4. Drizzle migration ledger
#   5. user row count (populated after Clerk signup + webhook)
#
# Usage:
#   scripts/db-smoke.sh                 # default: reads apps/app/.env.local
#   DATABASE_URL=... scripts/db-smoke.sh  # override URL explicitly
#
# Requires: psql. Credentials come from apps/app/.env.local.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$REPO_ROOT/apps/app/.env.local"

GREEN="\033[32m"; RED="\033[31m"; YEL="\033[33m"; DIM="\033[2m"; RESET="\033[0m"
pass() { printf "  ${GREEN}✓${RESET} %s\n" "$1"; }
fail() { printf "  ${RED}✗${RESET} %s\n" "$1"; FAILED=1; }
warn() { printf "  ${YEL}!${RESET} %s\n" "$1"; }
note() { printf "  ${DIM}%s${RESET}\n" "$1"; }

FAILED=0

# ── resolve DATABASE_URL ──────────────────────────────────────────────
if [ -z "${DATABASE_URL:-}" ]; then
  if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: $ENV_FILE not found and DATABASE_URL is not exported"
    exit 1
  fi
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | sed 's/^DATABASE_URL=//')"
  if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is empty in $ENV_FILE — populate it (Supabase direct connection on :5432 for admin checks)"
    exit 1
  fi
  export DATABASE_URL
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql not installed. Install: sudo apt install postgresql-client (Debian/Ubuntu)"
  exit 1
fi

# ── 1. Connectivity ───────────────────────────────────────────────────
printf "\n── 1. Connectivity\n"
if psql "$DATABASE_URL" -tAc "select 1" >/dev/null 2>&1; then
  pass "psql connects; select 1 OK"
else
  fail "cannot connect — check DATABASE_URL (host/password/SSL)"
  echo ""
  echo "Last psql error:"
  psql "$DATABASE_URL" -tAc "select 1" || true
  exit 1
fi

# ── 2. Tables in public schema ────────────────────────────────────────
printf "\n── 2. Tables in public schema\n"
TABLES="$(psql "$DATABASE_URL" -tAc "select tablename from pg_tables where schemaname='public' order by 1" 2>/dev/null || true)"
COUNT=$(printf '%s\n' "$TABLES" | grep -c . || true)
if [ "${COUNT:-0}" -lt 3 ]; then
  fail "only ${COUNT:-0} tables in public — migrations likely NOT applied"
  note "Run: pnpm --filter @tradewitness/app db:migrate"
else
  pass "$COUNT tables in public schema"
  printf '%s\n' "$TABLES" | sed 's/^/    • /'
fi

# ── 3. RLS state per table ────────────────────────────────────────────
printf "\n── 3. RLS state per table\n"
psql "$DATABASE_URL" -c "
  select
    tablename,
    case when rowsecurity then 'ENABLED' else 'disabled' end as rls
  from pg_tables
  where schemaname='public'
  order by rowsecurity desc, tablename;
" 2>/dev/null || true

RLS_ON="$(psql "$DATABASE_URL" -tAc "select count(*) from pg_tables where schemaname='public' and rowsecurity=true" 2>/dev/null || echo 0)"
if [ "${RLS_ON:-0}" -gt 0 ]; then
  warn "$RLS_ON public table(s) have RLS ENABLED"
  note "Clerk-auth queries will silently return [] on these tables."
  note "Fix per-table: ALTER TABLE public.<name> DISABLE ROW LEVEL SECURITY;"
else
  pass "no public tables have RLS enabled"
fi

# ── 4. Drizzle migration ledger ───────────────────────────────────────
printf "\n── 4. Drizzle migration ledger\n"
if psql "$DATABASE_URL" -tAc "select to_regclass('drizzle.__drizzle_migrations') is not null" 2>/dev/null | grep -q t; then
  APPLIED="$(psql "$DATABASE_URL" -tAc "select count(*) from drizzle.__drizzle_migrations" 2>/dev/null)"
  LATEST_HASH="$(psql "$DATABASE_URL" -tAc "select hash from drizzle.__drizzle_migrations order by id desc limit 1" 2>/dev/null)"
  LATEST_TS="$(psql "$DATABASE_URL" -tAc "select to_timestamp(created_at/1000) from drizzle.__drizzle_migrations order by id desc limit 1" 2>/dev/null)"
  pass "$APPLIED migrations applied via drizzle-kit migrate"
  note "Latest: $LATEST_HASH  ($LATEST_TS)"
else
  warn "drizzle.__drizzle_migrations not found"
  note "Either db:push was used (bypasses ledger), or db:migrate hasn't run."
fi

# ── 5. User row count ─────────────────────────────────────────────────
printf "\n── 5. 'user' table populated?\n"
if psql "$DATABASE_URL" -tAc "select to_regclass('public.\"user\"') is not null" 2>/dev/null | grep -q t; then
  USERS="$(psql "$DATABASE_URL" -tAc 'select count(*) from public."user"' 2>/dev/null)"
  if [ "${USERS:-0}" -gt 0 ]; then
    pass "${USERS} user row(s) — Clerk webhook sync is working"
  else
    warn "0 rows in public.\"user\""
    note "Sign up via Clerk → /api/webhooks/clerk should insert a row."
    note "If none appears, check CLERK_WEBHOOK_SECRET and webhook endpoint URL."
  fi
else
  fail "public.\"user\" table does not exist"
  note "Migrations probably did not run. See step 4."
fi

# ── Summary ───────────────────────────────────────────────────────────
printf "\n"
if [ "$FAILED" -eq 1 ]; then
  printf "${RED}FAILED${RESET} — see messages above\n"
  exit 1
fi
printf "${GREEN}All DB smoke checks passed${RESET}\n"
