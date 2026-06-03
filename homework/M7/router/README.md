# Router — код, не n8n

По решению Q2 роутер реализован **кодом в Next-приложении**, n8n не используется.
Решение о маршруте видно прямо в TypeScript (не спрятано в конфиг).

Исходники:

- `apps/app/src/server/assistant/router.ts` — `route(message, piiEntities, intent)`,
  упорядоченные правила (PII → user-owned intent → public-allowlist → ambiguous=local).
- `apps/app/src/server/assistant/presidio.ts` — PII-детект (Presidio + regex-fallback), fail-closed.
- `apps/app/src/app/api/assistant/route.ts` — оркестратор: PII → route → local/cloud → лог.

Двумерность роутинга (PII в тексте + чувствительность данных тулов) и почему cloud
не получает сырые user-owned тулы — см. `../PLAN.md` §2.2.
