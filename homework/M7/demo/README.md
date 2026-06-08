# DZ1 demo — пруфы прогона

Сгенерировано харнесом `apps/app/scripts/m7-demo.ts` — он гоняет **реальные**
`route()` + Presidio (`/analyze`) + cloud-ногу (OpenRouter) по acceptance-кейсам
(PLAN §4.2). Браузер/Clerk не нужны.

## Файлы

- **`dz1-routing.md`** — таблица из 12 запросов: маршрут / reason / найденный PII /
  модель / стоимость. Главный результат: **утечек private→cloud = 0**.
- **`dz1-cloud-answers.md`** — реальные ответы cloud-ноги (`openai/gpt-4o-mini`)
  на публичные запросы + `usage`/`costUsd` из ответа OpenRouter.
- **`dz1-routing.json`** — те же данные машиночитаемо (включая safety-кейсы,
  историю-не-течёт-в-cloud, суммы).

## Что покрыто (acceptance §4.2)

| Кейс | Результат |
|---|---|
| PII в тексте (email/phone/card/PERSON, в т.ч. uk) → local | ✅ |
| user-owned данные → local | ✅ |
| чисто-публичный → cloud (uk + en) | ✅ реальный вызов |
| порядок: «поясни мій win rate» → local (user-data > public) | ✅ |
| Presidio down/fallback → local (fail-closed) | ✅ |
| ambiguous → local | ✅ |
| история не течёт в cloud (publicOnly-фильтр) | ✅ |

## Воспроизвести

```bash
# нужны: Ollama-сервер (см. ../0-deploy.md), Presidio (docker), OPENROUTER_API_KEY в .env.local
cd apps/app
NODE_OPTIONS="--conditions=react-server" pnpm tsx scripts/m7-demo.ts
# (react-server — чтобы server-only модули импортировались под tsx)
```

## Известное ограничение (риск §8)

EN-Presidio ложно метит кириллицу как `PERSON` (score 0.85) → часть **публичных**
uk-запросов уходит в **local**. Это fail-safe (без утечки). Полное лечение —
uk/ru recognizer или мультиязычная модель — за рамками DZ1.
