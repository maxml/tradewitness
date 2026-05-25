# M5 — implementation plan (start here)

This is the entry point. The plan below is ordered — do the phases
top-to-bottom; each one has a verification step and links to a deep-dive
doc when more detail is needed. The `docs/` folder contains those
deep-dives (architecture, prompts, node configs); you read them on
demand from the phases below, not in order.

**Time:** 4–6 hours, matching the assignment.
**Nothing in this folder is implemented yet** — this is only the plan.

---

## What this homework builds

Two n8n workflows wired into the existing TradeWitness stack:

- **WF1 — Manual trigger.** Admin clicks a button in the Feature Dashboard
  (`/private/admin/features`) → POST to a local n8n webhook → AI Agent
  calls M3 MCP tools → response goes back to the UI.
- **WF2 — Scheduled monitor.** n8n cron reads a sine-wave error-rate log
  every minute → if error rate crosses a threshold, AI Agent toggles the
  flag via MCP and posts an alert to Telegram.

Plus a hallucination test (the `traffic_percentage: -50` curl), two
Python simulators, and a 3–5 minute screencast.

### Project deviation from the assignment

The assignment template targets a `proshop_mern` fork. This repo is
`tradewitness` (Next.js monorepo). Path mapping:

| Assignment expects | Here |
|---|---|
| `frontend/src/screens/FeatureDashboardScreen.js` | `apps/app/src/app/private/admin/features/` (note: literal `private`, **not** a `(private)` route group) |
| `frontend/src/components/AutoPilotControls.jsx` | `apps/app/src/components/admin/AutoPilotControls.tsx` (new) |
| `homework/M5/*` | same — this folder |

Tooling: TypeScript strict (CLAUDE.md), Tailwind v3 OK in `apps/app`,
Drizzle not involved here.

---

## Files

| File | Purpose |
|---|---|
| `<repo>/docker-compose.yml` | n8n service definition; paths relative to repo root. |
| `homework/M5/.env.example` | template for secrets (committed). |
| `homework/M5/.env.local` | actual secrets (gitignored). |
| `homework/M5/n8n-data/` | created on first `compose up`; gitignored. |
| `homework/M5/docs/` | deep-dive references for each phase. |

### Deep-dive index (read from the phases below, not in order)

- `docs/01-setup.md` — n8n via Docker Compose, Telegram bot, Claude Code
  subagents, M3 HTTP wrapper spec, webhook secret, CORS, MCP↔n8n transport.
- `docs/02-wf1-manual-trigger.md` — WF1 architecture, n8n nodes, GCAO
  system prompt, frontend Auto-Pilot Controls component.
- `docs/03-wf2-scheduled-monitor.md` — WF2 architecture, n8n nodes, GCAO
  system prompt, Telegram alert wiring.
- `docs/04-simulators.md` — `simulate_wf1.py` and `simulate_wf2.py` specs.
- `docs/05-hallucination-test.md` — defense-in-depth proof.
- `docs/07-screencast.md` — recorder setup, pre-flight checklist,
  4-minute script, hosting options.

---

## Secrets (status)

All secrets live in `homework/M5/.env.local` (gitignored).
`.env.example` shows the variable names.

| Variable | Status |
|---|---|
| `TELEGRAM_BOT_TOKEN` | set |
| `TELEGRAM_CHAT_ID` | set (`26462215`) |
| `N8N_WEBHOOK_API_KEY` | TODO — `openssl rand -hex 32` |
| `M3_MCP_API_KEY` | `local-m3-change-me` (default from existing MCP) |

## Prerequisite status

| Item | State | Action |
|---|---|---|
| M3 MCP server (`mcps/feature-flags`) | exists (stdio only); needs HTTP wrapper | Phase 1 |
| M4 Feature Dashboard | exists at `apps/app/src/app/private/admin/features/` | Phase 7 |
| Python 3.10+ | 3.10.12 — ok | — |
| n8n instance | not installed | Phase 2 |
| Telegram bot | token + chat_id set | smoke test in Phase 2 |
| Claude Code subagents | missing | Phase 5 (optional) |
| MCP range validation | already has `minimum/maximum` 0..100 — ok | — |

---

# Implementation plan

Do the phases top-to-bottom. Don't move on until the verify step passes.

## Phase 0 — Confirm secrets

| Step | Action |
|---|---|
| 0.1 | `cat homework/M5/.env.local` — `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set. |
| 0.2 | Generate `N8N_WEBHOOK_API_KEY` with `openssl rand -hex 32` and paste into `.env.local`. |

**Verify:** `git status` shows no `.env.local` (gitignored).

## Phase 1 — Build the M3 HTTP wrapper

The existing MCP (`mcps/feature-flags/src/index.ts`) speaks stdio only, so
n8n cannot call it. WF2 specifically uses an HTTP Request node, so HTTP
is unavoidable regardless of WF1's transport choice. Build a thin HTTP
surface alongside the MCP. The wrapper also lets us speak the M5 contract
(`feature_id`, `traffic_percentage`) without renaming the existing MCP
tools — zero risk to Claude Desktop or other MCP consumers.

| Step | Action |
|---|---|
| 1.1 | Add an Express/Fastify server next to the MCP (e.g. `mcps/feature-flags/src/http.ts`) per `docs/01-setup.md` §1.4. |
| 1.2 | Endpoints: `GET /health`, `POST /tools/get_feature_info`, `POST /tools/set_feature_state`, `POST /tools/adjust_traffic_rollout`. |
| 1.3 | Bearer auth via `Authorization: Bearer ${M3_MCP_API_KEY}`. |
| 1.4 | Internal mapping: `feature_id → name`, `traffic_percentage` and `state` pass through. The wrapper owns its **own** request schemas for the M5 contract (`feature_id`, `traffic_percentage`); reuse only the **business-rule** helpers from the MCP (`validateStateChange`, the "Disabled flag can't have traffic > 0" rule). See `docs/01-setup.md` §1.4. |
| 1.5 | Add `start:http` script to `mcps/feature-flags/package.json`. Suggested port: `7733`. |
| 1.6 | Build & run: `pnpm --filter @tradewitness/feature-flags-mcp build && pnpm --filter @tradewitness/feature-flags-mcp run start:http`. |

**Before verifying**: the wrapper proxies through
`http://127.0.0.1:3001/api/feature-flags`, so the Next.js `apps/app`
server must already be running. In another shell:
```bash
pnpm --filter @tradewitness/app dev   # exposes 3001
```
Confirm `apps/app/.env.local` has `FEATURE_FLAGS_API_KEY` set to the
same value as `M3_MCP_API_KEY` in `homework/M5/.env.local`, otherwise
the wrapper gets 401 from the app API.

**Verify:**
```bash
set -a; . homework/M5/.env.local; set +a

curl -i http://localhost:7733/health
# → HTTP/1.1 200, body {"ok":true}

curl -i -X POST -H "Authorization: Bearer ${M3_MCP_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"feature_id":"search_v2"}' \
  http://localhost:7733/tools/get_feature_info
# → HTTP/1.1 200, body = feature flag JSON with name=search_v2

curl -i -X POST -H "Authorization: Bearer ${M3_MCP_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"feature_id":"search_v2","traffic_percentage":-50}' \
  http://localhost:7733/tools/adjust_traffic_rollout
# → HTTP/1.1 400, body = schema validation error
```

`-i` keeps the response headers in stdout so the status code is visible
proof, not a hand-written comment. The `${M3_MCP_API_KEY}` substitution
happens on the host shell — make sure the `set -a; . .env.local; set +a`
line ran in the same shell session.

## Phase 2 — Start n8n + sanity-check Telegram

| Step | Action |
|---|---|
| 2.1 | Confirm the bot reaches you: `set -a; . homework/M5/.env.local; set +a && curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" -d "chat_id=${TELEGRAM_CHAT_ID}&text=m5 phase 2 check"` — message appears. |
| 2.2 | From repo root: `docker compose --env-file homework/M5/.env.local up -d`. State lands in `homework/M5/n8n-data/`. |
| 2.3 | Open `http://localhost:5678`, create owner account. |
| 2.4 | Install the `@n8n/n8n-nodes-langchain` community node (optional but recommended). |

**Verify:** `curl http://localhost:5678/healthz` → `{"status":"ok"}`
and `git status -s homework/M5/n8n-data` returns nothing.

Full compose details: `docs/01-setup.md` §1.1.

## Phase 3 — Credentials in n8n

| Step | Action |
|---|---|
| 3.1 | Header Auth credential `n8n-feature-control-api-key` with header `X-API-Key` and the value of `N8N_WEBHOOK_API_KEY`. |
| 3.2 | Telegram API credential `telegram-m5-alerts` with `TELEGRAM_BOT_TOKEN`. Test connection. |
| 3.3 | Chat Model credential (Anthropic / OpenAI / OpenRouter) — pick one model. |
| 3.4 | Bearer Token credential for the M3 MCP (value `M3_MCP_API_KEY`). |

**Verify:** each credential's "Test" passes inside the n8n UI.

## Phase 4 — Verify n8n can reach the HTTP wrapper

| Step | Action |
|---|---|
| 4.1 | Start the wrapper on the host (Phase 1.6) and confirm it's reachable from inside the n8n container. |

**Verify** (from inside the container). The bearer comes from the
container's own env (compose passes it through), so use `sh -c` to do
the expansion **inside** the container, not on your host shell:
```bash
docker exec -it n8n-m5 sh -c \
  'wget -qO- --header "Authorization: Bearer $M3_MCP_API_KEY" \
   http://host.docker.internal:7733/health'
# → {"ok":true}
```

If this fails, the most likely causes are:
- missing `extra_hosts: host.docker.internal:host-gateway` in
  `docker-compose.yml` (already there — re-check),
- wrapper listening on `127.0.0.1` instead of `0.0.0.0`,
- compose was started without `--env-file homework/M5/.env.local`, so
  `$M3_MCP_API_KEY` is empty inside the container.

## Phase 5 — Install Claude Code subagents (optional)

| Step | Action |
|---|---|
| 5.1 | Copy `n8n-requirements-orchestrator.md` and `n8n-workflow-builder.md` into `~/.claude/agents/`. |
| 5.2 | Restart Claude Code. Run `/agents` — both visible. |

If the source files aren't available, skip this phase and build
workflows by hand from `docs/02` and `docs/03`. Note the substitution in
the final report.

**Verify:** `ls ~/.claude/agents | grep n8n` → 2 files.

## Phase 6 — Build WF1 in n8n

Two paths, pick one.

### 6A. With subagents (faster)
- Run the WF1 orchestrator prompt (assignment §D.3) to confirm the spec
  matches `docs/02` §C.
- Run the WF1 builder prompt (assignment §D.4) to get the JSON.
- Import JSON via Settings → Import from File.
- Plug in credentials.
- Paste GCAO from `docs/02` §D into the AI Agent's System Message
  (remember the `=` prefix).

### 6B. Without subagents
- Build node-by-node in the UI following `docs/02` §C.
- Confirm `ai_*` connections by exporting the JSON and visually
  scanning the `connections` object.

In both paths, enable `Verbose` and `Return Intermediate Steps` on the
AI Agent before testing — needed for the trace screenshot.

**Verify:** all four curl probes in `docs/02` §E pass (no-auth → 401,
happy path → 200, no_op rollback, hallucination probe → 400). Export
the workflow to `homework/M5/wf1-manual-trigger.json`.

## Phase 7 — Wire the Dashboard

Per `docs/02` §B:

| Step | Action |
|---|---|
| 7.1 | Add `apps/app/.env.local` entries (`N8N_WEBHOOK_URL`, `N8N_WEBHOOK_API_KEY`). |
| 7.2 | Create the server action `auto-pilot-call.ts` with admin gate + fetch. |
| 7.3 | Create `<AutoPilotControls>` client component. |
| 7.4 | Render it inside the existing `/private/admin/features` page. |
| 7.5 | TypeScript strict — no `any`; type the WF1 response. |

**Verify:** click each of the three buttons in the browser, observe:
- Status badge / traffic_percentage update without a page reload.
- Toast or alert shows the agent's `message`.
- An invalid payload manually crafted in DevTools is rejected with a
  red alert sourced from `rejected_at:"input-validation"`.

## Phase 8 — `simulate_wf1.py`

Per `docs/04` §A.

| Step | Action |
|---|---|
| 8.1 | Drop the script at `homework/M5/simulate_wf1.py`. |
| 8.2 | Run with `--duration 60 --interval 5` first (fast smoke). |
| 8.3 | Then with `--include-invalid` and watch the rejections. |
| 8.4 | Capture a representative log section for the final report. |

**Verify:** every 7th request returns `rejected_at:"input-validation"`.

## Phase 9 — `simulate_wf2.py` + log volume

Per `docs/04` §B.

| Step | Action |
|---|---|
| 9.1 | Drop the script at `homework/M5/simulate_wf2.py`. |
| 9.2 | Run with `--duration 600 --period 120` for a quick demo. |
| 9.3 | Confirm `homework/M5/logs.json` grows and that `docker exec -it n8n-m5 cat /data/m5/logs.json \| head` reads the same content. |

**Verify:** file exists on host, n8n container reads same file.

## Phase 10 — Build WF2 in n8n

Same A/B path as Phase 6, but for WF2 (`docs/03`).

Easy-to-miss checks:
- AI Agent has **no Memory** sub-node.
- Telegram is connected **only** to the AI Agent's `main[0]`, never to
  the NoOp branch.
- Fallback Switch output → NoOp node, not unbound.

**Before testing**: `search_v2` is currently `Disabled` in
`data/feature-flags/features.json`. WF2's deactivate branch only fires
when current status is **not** Disabled. Flip the flag to `Testing` (via
the dashboard or a direct WF1 `test` call) before starting
`simulate_wf2.py` — otherwise the first cycle will only show re-enable.

**Verify** with `simulate_wf2.py` running:
- Within ~3 minutes, Telegram shows a `🚨 deactivated` alert.
- Within ~5 more minutes, a `✅ reenabled` alert.
- During in-threshold minutes, no message arrives.

Export to `homework/M5/wf2-scheduled-monitor.json`.

## Phase 11 — Hallucination test artifact

Per `docs/05`.

| Step | Action |
|---|---|
| 11.1 | Run the curl probe with `traffic_percentage:-50`, capture response. |
| 11.2 | Screenshot the n8n executions trace showing termination at Respond 400. |
| 11.3 | Save both to `homework/M5/`. |

## Phase 12 — Screencast

Full plan: `docs/07-screencast.md` (recorder, audio, pre-flight,
4-minute script, hosting, failure-mode fixes).

Summary: 1080p MP4, ~4 minutes, OBS or Loom; covers WF1 happy path →
hallucination test → simulators → WF2 full toggle cycle in Telegram.
Save to `homework/M5/screencast.mp4` or paste an unlisted Loom /
YouTube link into the final report.

## Phase 13 — Final report (rewrite this README)

After everything works, replace the body of this README with the report:
- Architecture overview (one paragraph).
- Stack choices and why (n8n local Docker, model picked, MCP transport).
- WF1 + WF2 summaries with screenshots.
- Hallucination test: what was tested, where defense lives, link to
  artifact.
- "What was hard" section (2–3 sentences).
- Link to screencast.

Keeping the `docs/` folder around for the reviewer is fine — leaving
the plan visible doesn't hurt.

## Phase 14 — PR

Branch off `main`, commit `homework/M5/*` and the `apps/app` changes,
push, open PR. PR description links the screencast and lists which
optional bonuses (HITL, Langfuse, multi-agent) were attempted, if any.

Files the PR must include (in addition to `homework/M5/*` and
`apps/app/*`):
- `docker-compose.yml` (repo root, currently untracked).
- `.gitignore` (modified to add `n8n-data/`).
- `mcps/feature-flags/*` updated for the new HTTP wrapper (Phase 1).

Pre-PR sanity:
- `git status` shows no `.env.local` and no `n8n-data/`.
- `pnpm typecheck` (or equivalent) clean for `apps/app`.
- MCP build clean.

---

## Risks and shortcuts

- **HTTP wrapper** is the only way to get n8n talking to M3, and WF2's
  Schedule trigger forces HTTP regardless of how WF1 is wired. There is
  no shortcut around Phase 1.
- **n8n community node install** can fail on Docker images behind
  restrictive networks. Fallback to `httpRequestTool` (the only path in
  `docs/02` §C.3) works without community nodes and is the default here.
- **`host.docker.internal` on Linux** requires the `extra_hosts` line
  (already in `docker-compose.yml`). If the n8n container can't reach
  the wrapper, double-check this first and confirm the wrapper binds to
  `0.0.0.0`, not `127.0.0.1`.

---

## Final deliverables (target after Phase 14)

```
homework/M5/
├── README.md                       ← rewritten as the report in Phase 13
├── wf1-manual-trigger.json         ← n8n workflow export
├── wf2-scheduled-monitor.json      ← n8n workflow export
├── simulate_wf1.py
├── simulate_wf2.py
├── logs.json                       ← captured after a run
├── trace-wf1.png
├── trace-wf2-toggle.png
└── screencast.mp4 (or link)
```
