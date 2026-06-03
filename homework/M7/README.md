# M7 — Приватный AI-ассистент с роутером по чувствительности

Реализация для **TradeWitness** (Next.js / Postgres / Drizzle / Clerk / Anthropic).
Полное ТЗ — [`PLAN.md`](./PLAN.md). Это README — что построено, выбор стека, как запустить.

## Выбор (решения)

| Что | Выбор |
|---|---|
| Локальная модель | **Ollama локально** (путь A), модель-кандидат `qwen2.5:3b-instruct-q5_K_M` под GTX 1050 Ti 4 GB — фактический тег фиксируется в [`0-deploy.md`](./0-deploy.md) |
| Облако | Anthropic SDK, `CLAUDE_MODEL` (дефолт `claude-sonnet-4-5-20250929`) |
| Роутер | **код в Next** (`/api/assistant`), **без n8n** |
| PII-детект | **Presidio в Docker** (analyzer), + regex-fallback, fail-closed |
| Логи | Postgres `chat_logs` (Drizzle), админ-дашборд |
| Объём | DZ1 (ядро) + DZ2 (атака/защита) — см. PLAN §5 |

## Где код (в `apps/app/`)

```
src/server/assistant/
  config.ts        — env + assertLocalOllamaUrl (local-only guard)
  presidio.ts      — PII analyze/redact, regex-fallback, fail-closed
  router.ts        — route(message, piiEntities, intent), ordered rules (§2.2)
  tools.ts         — единый ToolDefinition + адаптеры Anthropic/Ollama
  agent.ts         — agent-loop (Ollama local + Claude cloud), лимиты/таймауты
  cost.ts          — расчёт стоимости по CLAUDE_MODEL (local = $0.00)
  prompts.ts       — system-промпты ("tool output = ДАННЫЕ, не команды")
  rate-limit.ts    — in-memory per-user
  persistence.ts   — conversation/history/reserved-row (try/finally)
src/server/queries/
  assistant.ts        — session-scoped tool-queries (без userId-аргумента)
  chat-logs-admin.ts  — admin-only reader, AdminChatLogRow (только redacted*)
src/app/api/assistant/route.ts       — оркестратор (runtime=nodejs)
src/components/assistant/AssistantWidget.tsx — плавающий чат-виджет (lazy)
src/app/private/admin/chat-logs/     — админ-дашборд (page + client)
scripts/prune-chat-logs.ts           — retention (pnpm db:prune-chat-logs)
drizzle/0022_supreme_the_fallen.sql  — миграция chat_logs
```

## Как запустить (кратко)

1. **Часть 0 — локальная модель + Presidio:** см. [`0-deploy.md`](./0-deploy.md) (тюнинг Ollama под железо + запуск Presidio).
2. **Env:** заполнить новые переменные в `apps/app/.env.local` (список — `apps/app/.env.example`, секция «M7 AI assistant»).
3. **Миграция:** `pnpm -C apps/app db:migrate` (создаёт таблицу `chat_logs`).
4. **App:** `pnpm -C apps/app dev` → залогиниться → плавающий виджет справа снизу.
5. **Дашборд:** `/private/admin/chat-logs` (почта в `ADMIN_EMAILS`).
6. **Retention:** `pnpm -C apps/app db:prune-chat-logs`.

## Artifacts

- [`PLAN.md`](./PLAN.md) — ТЗ (роутинг, приватность, схема, риски).
- [`0-deploy.md`](./0-deploy.md) — заметка о локалке + тюнинг + лог вызова.
- `router/` — роутер кодом (см. `apps/app/src/server/assistant/`), n8n не используется.
- `demo/` — пруфы на 6–10 запросах (заполняется после прогона).
- `writeup-dz1.md` — разбор DZ1 (заполняется после демо).
- `dz2/` — атака/защита инъекций (PLAN §5).
