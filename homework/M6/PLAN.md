# M6 «Агент-Контролёр» — план выполнения (TradeWitness)

> Адаптация ДЗ6 под наш форк. Оригинальное ТЗ написано на примере `proshop_mern` (MERN + Python),
> у нас **TradeWitness** — TS-монорепо (pnpm + turborepo), Next.js + Drizzle + Supabase + Clerk + Stripe + R2.
> Везде, где ТЗ говорит `proshop_mern`, `backend/controllers`, `pytest`, `mutmut`, `homework-m6/` —
> читай значения из «Шага 0» ниже.

- **Дата:** 2026-05-25
- **Ветка:** `m6-agents`
- **Папка сдачи:** `homework/M6/` (в едином стиле с `homework/M4`, `homework/M5`)
- **Курсовой репо:** https://github.com/Serg1kk/aidev-course-materials/tree/main/M6 (склонирован read-only в `/tmp/aidev-cm`)

---

## 🗺️ Шаг 0 — карта форка (опорная для всех стейджей)

| Что | Значение в TradeWitness |
|---|---|
| MCP-серверы | `mcps/feature-flags/` (TS), `mcps/search-docs/` (TS) |
| RAG-сервер | `mcps/rag/` (TS — `query.ts`, `ingest.ts`) |
| Feature flags слой | `data/feature-flags/features.json` + `packages/feature-flags-core` + `mcps/feature-flags` |
| Язык MCP/RAG | **TypeScript/Node** (Python НЕТ) |
| Test framework | **Vitest** (ставим в Stage 2; сейчас тестов в проекте нет) |
| Mutation tool (опц.) | **Stryker** (`mutmut` на JS не работает) |
| Файл правил агента | `CLAUDE.md` + `AGENTS.md` (оба в корне), плюс `GEMINI.md`, `.codex/` |
| Папка docs | `docs/` (adr/, m3-corpus/, architecture.md, task*.md) |
| Папка ADR | `docs/adr/` (0001–0003) + `docs/m3-corpus/adrs/` |

### PROJECT CONTEXT (вставлять в spawn-промпты mate-агентов)

```
PROJECT CONTEXT (TradeWitness — НЕ proshop_mern)
- Repo: TradeWitness fork — TS-монорепо (pnpm + turborepo), Next.js + Drizzle + Supabase + Clerk + Stripe + Cloudflare R2
- Stack: TypeScript/Node везде (Python НЕТ)
- Файл правил агента (read first): CLAUDE.md + AGENTS.md (оба в корне)
- ADRs: docs/adr/ (0001-0003) + docs/m3-corpus/adrs/ (read first)
- Auth: Clerk (JWT/сессии), вебхуки Clerk + Stripe
```

### SCOPE (реальные пути — «контроллеры/middleware/routes» этого проекта)

```
SCOPE
- apps/app/src/server/actions/*.ts   (journal, user, stripe, archive, strategies, feedback, trades) ← аналог controllers
- apps/app/src/app/api/**/route.ts    (feature-flags, claude, follow-up-claude, webhooks/clerk, webhooks/stripe)
- apps/app/src/app/private/admin/features/actions.ts
- apps/app/src/lib/r2.ts, apps/app/src/drizzle/db.ts
- mcps/feature-flags/src/*.ts         (MCP #1)
- mcps/search-docs/                   (MCP #2)
- mcps/rag/{query.ts,ingest.ts}       (RAG)
- packages/feature-flags-core/
- Out of scope: node_modules/, .next/, build/, *.config.*, tests
```

---

## Подготовка (pre-reqs, ~15 мин)

1. `mkdir -p .claude/agents` → скопировать 5 агентов + `templates/` из `/tmp/aidev-cm/M6/agents/`:
   - `security-mate.md`, `performance-mate.md`, `architecture-mate.md`, `legacy-auditor-mate.md`, `test-writer-mate.md`
2. Создать скелет `homework/M6/{stage1-code-review, stage2-fix-top3/tests, stage3-living-docs, stage4-tests-agent}`.
3. Прочитать ключевой код перед ревью: `mcps/feature-flags/src/index.ts`, `mcps/rag/query.ts`, `apps/app/src/server/actions/*.ts`.

---

## ⭐ Stage 1 — Multi-Agent Code Review (~1.5–2 ч)

**Цель:** 3 специализированных sub-agent последовательно (Опция A через Agent tool) → `synthesis.md` с Top-3 для Stage 2.

1. **security-mate** → `homework/M6/stage1-code-review/security-findings.jsonl` + `security-review.md`
   - 8–20 findings, у каждого: `file:line`, severity (HIGH/MED/LOW), OWASP-категория, fix approach.
2. **performance-mate** → `performance-findings.jsonl` + `performance-review.md`
   - N+1, blocking I/O, missing pagination/caching; у каждого estimated impact (`+200ms p95` / `+5MB`).
3. **architecture-mate** → `architecture-findings.jsonl` + `architecture-review.md`
   - читает `docs/adr/` ПЕРВЫМ, layer boundaries, criticality C1/C2/C3, предлагает 1–2 новых ADR.
4. **Синтез** → `synthesis.md`: группировка по severity → дедуп cross-mate → «Recommended fix order» (top-5) → **таблица «Top-3 для Stage 2»** (file:line / issue / fix / effort) + token usage estimate.

**Чеклист:** 4 файла существуют; ≥5 findings на агента; HIGH ≥2; cross-mate observation ≥1.

---

## ⭐ Stage 2 — Fix Top-3 (~1.5–2 ч)

**Цель:** починить 3 findings из «Top-3» через safe-refactor recipe.

0. Поставить **Vitest** (workspace-конфиг в корне; добавить `test`-скрипт).

Для каждого из 3 findings:
1. **Characterization tests ДО фикса** → `homework/M6/stage2-fix-top3/tests/test-<finding>.test.ts`
   - фиксируют ТЕКУЩЕЕ поведение, **должны пройти на исходном коде**; ≥3 теста (happy + edge + error).
   - отдельный git-commit (тесты раньше фикса — видно в history).
2. **Фикс** с явными «Do NOT»: не менять public API / error handling / logging; не трогать др. файлы; без новых deps; <200 строк. Тесты снова зелёные.
3. `fix-N-<topic>.md`: original finding (copy из synthesis.md) + diff + why (trade-offs) + test output + lessons learned. Commit `fix(<scope>): ...`.

**Чеклист:** 3 `fix-N.md`; тесты на все 3 finding'а; ни один fix не сломал API / не добавил deps / <200 строк; отдельные conventional commits.

---

## ⭐ Stage 3 — Legacy Audit + Living Documentation (~2.5–3.5 ч)

**Цель:** living documentation pack через `legacy-auditor-mate` в plan-mode.

⚠️ **Запускать через role-entry, НЕ через Task** (Task-субагент не может спавнить других субагентов):
> `/plan` → «Read `.claude/agents/legacy-auditor-mate.md` and act according to that role» + PROJECT CONTEXT + WORKFLOW EXPECTATIONS.

Auditor выполняет:
- **Phase 1 (discovery):** walk дерева, детект стека из манифестов, поиск subprojects (mcps/*, apps/*, packages/*).
- **Phase 1.5 (docs audit) ⭐:** классификация каждого файла `docs/` → ✅ ACCURATE / 🔄 PARTIAL / 📦 HISTORICAL / ❌ STALE → `homework/M6/stage3-living-docs/docs-audit.md` (шаблон `.claude/agents/templates/docs-audit.template.md`).
- **Phase 2 (plan):** `00-plan.md` с TODO → **СТОП на approval.**
- *(после approval)* **Phase 3 (dispatch):** спавн security/perf/arch через Task + 4-step reverse engineering на ≥2 модулях (MCP feature-flags + RAG) → `docs/specs/<module>-spec.md` (Overview / Decision Table / Sequence Diagram / Edge Cases ≥10 / Open Questions / Suggested Tests).
- **Phase 4 (aggregate):** синтез → `stage3-synthesis.md` (⚠️ НЕ перезаписывать `stage1/synthesis.md`); `project-index.json` (subprojects ≥3, system_folders, hard_rules ≥5 вкл. «ALWAYS read project-index.json FIRST», ai_routing, filesystem_tree); атомарный swap — архивировать только 📦/❌ доки в `docs-archived-2026-05-25/`.
- **Phase 5 (automate):** `update_project_index.py` в `.claude/scripts/` (WATCH_PATHS под наши пути: `apps/app/src/`, `mcps/feature-flags/`, `mcps/rag/`, `mcps/search-docs/`, `packages/`); опц. PostToolUse hook; добавить 2 секции в `CLAUDE.md`/`AGENTS.md` («⭐ START HERE» + «⭐ Keeping project-index.json current»).

Скопировать артефакты в `homework/M6/stage3-living-docs/`: `00-plan.md`, `docs-audit.md`, `project-index.json`, `update_project_index.py`, `docs-new/`, `docs-archived/`, копию `CLAUDE.md`/`AGENTS.md`.

**Чеклист:** валидный JSON; `last_updated` сегодня; ≥2 spec-файла; mermaid рендерится; обе секции в конфиге; архив только устаревшего.

---

## ⭐ Stage 4 — Tests Agent (~1–1.5 ч)

**Цель:** `test-writer-mate` пишет тесты на 2 сервиса (лучше те, что прошли reverse engineering в Stage 3).

1. Проверить `.claude/agents/test-writer-mate.md`.
2. Спавн через Agent tool на **2 сервисах**: MCP feature-flags + RAG (reference: `docs/specs/<module>-spec.md`).
   - покрыть public-функции + топ-10 edge cases + 2–3 security; Vitest; value-checking assertions (НЕ `assert not None`).
3. Прогон `vitest run` → скриншот `homework/M6/stage4-tests-agent/coverage-report.png`.
4. Копии: `test-writer-mate.md`, `service-1-tests/`, `service-2-tests/`.
5. *(опц., senior)* Stryker → MSI > 70%.

**Чеклист:** 2 сервиса; ≥5 кейсов на сервис; assertions проверяют VALUES; нет try-catch-swallow / trivial-тестов; реалистичные данные; все тесты зелёные.

---

## Карта папки сдачи (homework/M6/)

```
homework/M6/
├── PLAN.md                          ← этот файл
├── stage1-code-review/
│   ├── security-review.md
│   ├── performance-review.md
│   ├── architecture-review.md
│   └── synthesis.md
├── stage2-fix-top3/
│   ├── fix-1-<topic>.md
│   ├── fix-2-<topic>.md
│   ├── fix-3-<topic>.md
│   └── tests/
├── stage3-living-docs/
│   ├── 00-plan.md
│   ├── docs-audit.md
│   ├── stage3-synthesis.md
│   ├── project-index.json
│   ├── update_project_index.py
│   ├── docs-new/
│   ├── docs-archived/
│   └── CLAUDE.md (или AGENTS.md)
└── stage4-tests-agent/
    ├── test-writer-mate.md
    ├── service-1-tests/
    ├── service-2-tests/
    └── coverage-report.png
```

---

## Ключевые отклонения от ТЗ (учтены)

- **Стек TS, не Python** → Vitest вместо pytest, Stryker вместо mutmut; пути server actions/API routes вместо `backend/controllers`.
- **Папка сдачи** — `homework/M6/` вместо `homework-m6/` (единый стиль с M4/M5).
- **Правила CLAUDE.md** — запрещено редактировать `data/feature-flags/features.json` напрямую и грепать `docs/`. В Stage 1/3 учитываем: флаги через `feature-flags` MCP, docs через `search_project_docs`.

## Порядок работ

```
pre-reqs → Stage 1 → Stage 2 → Stage 3 → Stage 4
           (Stage 2 зависит от synthesis.md; Stage 4 проще после спеков Stage 3)
```
