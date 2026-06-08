# M7 — REVIEW (одна страница: решения + результаты + что проверять)

> Приватный AI-ассистент с роутером по чувствительности. Стек: TypeScript / Next.js /
> Postgres (Drizzle) / Clerk. Ветка `homework/m7-ai-assistant`. Это сводка — детали по ссылкам.

## 1. Решения (что и почему)

| Тема | Решение | Почему |
|---|---|---|
| Стек | TradeWitness (Next/Drizzle/Clerk), не proshop_mern | наш форк; маппинг понятий — [PLAN §0](./PLAN.md) |
| Локальная модель | **Ollama** `qwen2.5:3b-instruct-q5_K_M` (q5, 4 GB VRAM) | влезает целиком в GTX 1050 Ti, tool-calling рабочий |
| Роутер | **код в Next** (`route()`), без n8n | детерминированная развилка видна в TS, сессия не покидает доверенный код |
| PII-детект | **Presidio** (Docker) + regex-fallback, fail-closed | имена ловит NER; regex добивает email/phone/card |
| Облако | **OpenRouter** `openai/gpt-4o-mini` | дешёвый remote-провайдер ВНЕ периметра (контраст с local); сменили Anthropic — [почему](./writeup-dz1.md) |
| Двумерный роутинг | маршрут = f(PII в тексте, чувствительность данных тулов) | «чистый» текст с приватными данными тоже → local ([PLAN §2.2](./PLAN.md)) |
| Защита тулов | `userId` из `auth()` внутри, НЕ параметр LLM | детерминированный скоуп — основа DZ2 |

## 2. DZ1 — результаты ([demo](./demo/dz1-routing.md))

Реальный прогон `route()` + Presidio + OpenRouter, 12 кейсов:

- **Утечек private→cloud: 0** ✅ (главный критерий приёмки)
- PII (email/phone/card/PERSON, в т.ч. uk) → local ✅ · user-owned → local ✅ · публичный → cloud ✅ (2 реальных вызова, $0.000248)
- Fail-closed (Presidio down → local) ✅ · порядок (user-data > public) ✅ · история не течёт в cloud ✅
- **Дашборд (live):** в `chat_logs` засеяно 7 реальных строк тем же кодом, что и `/api/assistant`
  (`scripts/m7-seed-dashboard.ts`) — PII замаскирован в message И response, local=$0/cloud=$,
  строка `<REDACTION_UNAVAILABLE>`, эскалация sensitivity по ответу. Скрин:
  [demo/dashboard-screenshot.png](./demo/dashboard-screenshot.png) · данные текстом:
  [demo/dz1-dashboard-snapshot.md](./demo/dz1-dashboard-snapshot.md).
- **История не течёт в cloud (live DB round-trip):** [demo/dz1-history-no-leak.md](./demo/dz1-history-no-leak.md)
  — `loadHistory(publicOnly:true)` = `[]`, полная история видна только локально.
- **Локалка:** 100% GPU, ~15 tok/s, рабочий tool-call — [0-deploy.md](./0-deploy.md)
- **Экономия:** 10/12 запросов бесплатно ($0.00) и в периметре; оценка сэкономленного ~$0.0017 — [writeup-dz1.md](./writeup-dz1.md)
- **Честная находка:** EN-Presidio шумит на кириллице (ложный PERSON 0.85) → часть публичных uk-запросов уходит в local. Это **fail-safe** (без утечки), риск §8.

## 3. DZ2 — результаты ([attack-log](./dz2/attack-log.md))

Атака prompt-инъекцией на агента с доступом к БД, before/after, обе модели:

| build | прямая | непрямая (LLM01, инъекция в заметке трейда) |
|---|---|---|
| **VULNERABLE** (broad-тулы) | ❌ утечка | ❌ утечка (cloud выполнил инъекцию) |
| **SAFE** (session-scoped тулы) | ✅ нет | ✅ нет |

- Главный (детерминированный) эшелон: у тула нет параметра `userId` и нет `list_all_users` → джейлбрейк **физически** не дотянется до чужих данных.
- System-prompt hardening — второй (вероятностный) эшелон; **один НЕ достаточен** (сильная модель выполнила инъекцию).
- Маппинг: OWASP **LLM01 + LLM06**; убрали ногу «доступ к чужим данным» из lethal trifecta — [writeup-dz2.md](./dz2/writeup-dz2.md).

## 4. Где код (в `apps/app/`)

- Роутер: `src/server/assistant/router.ts` · PII: `presidio.ts` · agent-loop (обе ноги): `agent.ts`
- Тулы (scoped, без `userId`-параметра): `tools.ts` + `src/server/queries/assistant.ts`
- Оркестратор: `src/app/api/assistant/route.ts` · виджет: `src/components/assistant/` · дашборд: `src/app/private/admin/chat-logs/`
- Схема логов: `src/drizzle/schema.ts` (`ChatLogsTable`, row-per-turn) · prune: `scripts/prune-chat-logs.ts`

## 5. Как проверить (воспроизвести)

```bash
# предусловия: Ollama-сервер :11435 (см. 0-deploy.md), Presidio :5002 (docker),
#              OPENROUTER_API_KEY в apps/app/.env.local
cd apps/app
pnpm m7-demo                       # DZ1: таблица маршрутов → homework/M7/demo/
pnpm tsx scripts/m7-dz2-attack.ts  # DZ2: before/after  → homework/M7/dz2/
```

## 6. Границы (честно)

- **Raw `userMessage`/`assistantResponse` остаются в БД** (retention/backup их видят); защищён только периметр app/admin-UI (redacted-select, fail-closed masking). Не encrypted-at-rest.
- **EN-Presidio на кириллице** — ложные/пропущенные имена; полноценно лечится uk/ru-recognizer (риск §8), для homework — fail-safe.
- **Дашборд** засеян реальными строками через тот же код (`scripts/m7-seed-dashboard.ts`) и снят живьём:
  [demo/dashboard-screenshot.png](./demo/dashboard-screenshot.png) — маскинг в message/response, local=$0/cloud=$, `<REDACTION_UNAVAILABLE>`.
- **Local Ollama-сервер** :11435 поднят под пользователем dell (системный сервис не тянул модели — сетевой подвох в 0-deploy.md); для постоянства оформить user-systemd-юнит.

## 7. Артефакты

[PLAN.md](./PLAN.md) (ТЗ) · [README.md](./README.md) · [0-deploy.md](./0-deploy.md) ·
[writeup-dz1.md](./writeup-dz1.md) · [demo/](./demo/) · [dz2/](./dz2/) · коммиты: `86e7b01d` (DZ1), `42a3f051` (DZ2).
