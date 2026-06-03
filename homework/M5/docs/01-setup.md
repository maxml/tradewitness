# 01 — Setup (prerequisites before any workflow)

Do these in order. Each section ends with a verification step. Stop and fix
before moving on if a check fails.

---

## 1.1 n8n locally with Docker Compose

Goal: n8n UI reachable at `http://localhost:5678`, with state persisted
inside the project (gitignored), able to talk to the host (where MCP and
Next.js run), and able to read the simulator's `logs.json`.

### Files involved

```
<repo root>/
├── docker-compose.yml              # committed at repo root, paths from here
└── homework/M5/
    ├── .env.local                  # secrets, sourced via --env-file
    └── n8n-data/                   # created on first start; gitignored
```

The compose file is at the **project root** so every path is relative to
the rest of the codebase, not relative to the M5 folder. It mounts:
- `./homework/M5/n8n-data` → `/home/node/.n8n` (n8n's state dir)
- `./homework/M5` → `/data/m5` (so WF2 can read `logs.json` from the host)

### Run (all commands from project root)

```bash
docker compose --env-file homework/M5/.env.local up -d
docker compose --env-file homework/M5/.env.local logs -f n8n   # Ctrl-C when boot lines stop appearing
```

To stop without losing state:
`docker compose --env-file homework/M5/.env.local down`. State stays in
`homework/M5/n8n-data/`. Re-run `up -d` (with the same `--env-file`) and
everything is back.

Every `docker compose …` invocation in these docs uses
`--env-file homework/M5/.env.local`. Without it, compose substitutes
empty values for `${TELEGRAM_BOT_TOKEN}`, `${M3_MCP_API_KEY}` etc. — the
container starts but n8n nodes referencing `={{ $env.X }}` resolve to
empty strings, which is hard to debug from the UI.

### What the compose file does (in short)

- Mounts `./homework/M5/n8n-data` for workflows / credentials / executions DB.
- Mounts `./homework/M5` at `/data/m5` so WF2 reads `/data/m5/logs.json`.
- Exports the four secrets from `.env.local` into container env so n8n
  nodes can reference them as `={{ $env.TELEGRAM_BOT_TOKEN }}` etc., not
  hardcode values into the workflow JSON.
- Sets `extra_hosts: host.docker.internal:host-gateway` — required on
  native Linux so the container can reach host services (MCP, Next.js).
- Sets `N8N_SECURE_COOKIE=false` so the UI works over plain
  `http://localhost` (local-only; don't ship this to a public host).
- Sets `WEBHOOK_URL=http://localhost:5678/` so n8n shows the right
  webhook URL inside the UI after creating one.

### Reaching host services from inside n8n

| From → To | URL inside an n8n node |
|---|---|
| n8n container → M3 MCP (host) | `http://host.docker.internal:<mcp-port>` |
| n8n container → Next.js app (host) | `http://host.docker.internal:3001` (dev script is `next dev --turbopack -p 3001`) |
| n8n container → M3 HTTP wrapper (host) | `http://host.docker.internal:7733` |
| Browser → n8n | `http://localhost:5678` |
| Browser/host → n8n webhook | `http://localhost:5678/webhook/feature-control` |
| Next.js app → n8n webhook | same as above |

### First-time setup inside the UI

1. Open `http://localhost:5678` → create owner account (any email — local).
2. Settings → Community Nodes → install `@n8n/n8n-nodes-langchain`.
   Needed for the MCP Client Tool sub-node. If blocked, fall back to the
   3× `httpRequestTool` variant in docs/02-wf1 §C.3.
3. Settings → Credentials — leave empty; we add per workflow.

### Verify

```bash
curl -fsS http://localhost:5678/healthz       # → {"status":"ok"}
docker compose --env-file homework/M5/.env.local ps   # n8n-m5 listed, status running
ls homework/M5/n8n-data                       # workflows.db, config, etc.
git status -s homework/M5/n8n-data            # → nothing (gitignored)
```

---

## 1.2 Telegram bot

The bot token is already in `.env.local` (`TELEGRAM_BOT_TOKEN`). What's left
is getting your `chat_id` and wiring credentials inside n8n.

### Get chat_id

```bash
# 1. Open Telegram, find the bot via its handle, send /start.
# 2. Source the env and call getUpdates:
set -a; . homework/M5/.env.local; set +a
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates" | jq '.result[].message.chat'
# → look for "id": <number>. For private chat it's positive, for group negative.
# 3. Put that number into homework/M5/.env.local as TELEGRAM_CHAT_ID.
```

### Add Telegram credential in n8n

n8n UI → Credentials → New → **Telegram API**:
- Name: `telegram-m5-alerts`
- Access Token: the value of `TELEGRAM_BOT_TOKEN` from `.env.local`
  (paste it directly into the n8n field — n8n stores it encrypted in its
  own DB at `~/.n8n-data/`).
- Save → click "Test" — should return success.

### Verify

```bash
set -a; . homework/M5/.env.local; set +a
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}&text=hello from m5 setup"
# → message appears in Telegram. {"ok":true,...}
```

---

## 1.3 Claude Code subagents

WF1/WF2 prompts reference two subagents:
- `n8n-requirements-orchestrator` — turns an idea into a YAML spec.
- `n8n-workflow-builder` — turns a spec into n8n JSON.

These are not currently in `~/.claude/agents/`. They ship with the course
materials repo (see the assignment Part D).

### Install

```bash
mkdir -p ~/.claude/agents
# Source: course materials, aidev-course-materials/M5/agents/*.md.
# Copy both files into ~/.claude/agents/ (user-level, all projects).
cp /path/to/aidev-course-materials/M5/agents/n8n-requirements-orchestrator.md \
   ~/.claude/agents/
cp /path/to/aidev-course-materials/M5/agents/n8n-workflow-builder.md \
   ~/.claude/agents/
```

Restart Claude Code after copying.

### Fallback if you don't have the course-materials repo

You can build WF1/WF2 fully by hand in the n8n UI using the explicit node
lists in docs/02-wf1 and docs/03-wf2. The subagents only speed up JSON
generation. Note in the final README that they were unavailable.

### Verify

```bash
ls ~/.claude/agents | grep n8n
# → n8n-requirements-orchestrator.md
#   n8n-workflow-builder.md
```

In Claude Code: `/agents` shows both.

---

## 1.4 Build the M3 HTTP wrapper

The MCP at `mcps/feature-flags/src/index.ts` only ships a
`StdioServerTransport`. n8n cannot speak stdio over the network. WF2 also
needs a plain HTTP read regardless of WF1's transport choice. So an HTTP
wrapper is mandatory.

We do **not** rename the existing MCP tool params (`feature_name`,
`percentage`) — keeping them avoids breaking Claude Desktop or any other
existing MCP consumer. Instead, the HTTP wrapper accepts the M5 contract
(`feature_id`, `traffic_percentage`) and maps internally to the existing
MCP / feature-flag REST API. The MCP package name is
`@tradewitness/feature-flags-mcp`.

CLAUDE.md says **do not edit `data/feature-flags/features.json`
directly** — that file is unchanged. Mutations still go through the
existing internal REST API via `patchFlag(name, ...)`.

### Spec

A new file alongside the MCP, e.g. `mcps/feature-flags/src/http.ts`,
started by a new `pnpm` script (`start:http`).

Stack suggestion: Node 20+ stdlib `http` or Express/Fastify. Keep it
small — ≤150 lines.

Listen on `0.0.0.0:7733` (not `127.0.0.1`, otherwise Docker can't reach
it via `host.docker.internal`). Port `7733` is a suggestion; whatever
you pick, plug the same value into `docs/02-wf1` §C.3 and `docs/03` §C.3.

### Endpoints

| Method | Path | Body | Response |
|---|---|---|---|
| `GET`  | `/health` | — | `{ "ok": true }` |
| `POST` | `/tools/get_feature_info` | `{ feature_id: string }` | full feature flag JSON (from `features.json`) |
| `POST` | `/tools/set_feature_state` | `{ feature_id: string, state: "Enabled" \| "Disabled" \| "Testing" }` | updated flag JSON |
| `POST` | `/tools/adjust_traffic_rollout` | `{ feature_id: string, traffic_percentage: number }` (0..100 integer) | updated flag JSON |

Auth: require `Authorization: Bearer ${M3_MCP_API_KEY}` on all endpoints
except `/health`. Return 401 otherwise.

### Validation (Layer 2 of defense in depth)

The wrapper owns its own **request** JSON schemas (`feature_id`,
`traffic_percentage`, etc.) because that's the M5 contract. It does
**not** import the MCP's tool `inputSchema` blocks — those validate
`feature_name`/`percentage`, which are different field names.

What the wrapper validates on every request, before any side effect:
- `feature_id`: non-empty string, must exist (verified after `fetchFlags()`).
  Reject unknown ids with 404 so the agent gets a clear error.
- `state`: enum `["Enabled","Disabled","Testing"]`.
- `traffic_percentage`: integer, `0 ≤ x ≤ 100`. Reject `-50`, `150`,
  `1.5`, etc. with 400.

What the wrapper **can and should** reuse from the MCP code: the
*business-rule* helpers — dependency checks like
`validateStateChange()` (already in `mcps/feature-flags/src/index.ts`)
and the "Disabled flag cannot have traffic > 0" rule. Pull those into
the shared module from the "Internal mapping" section so both transports
enforce the same domain logic.

### Internal mapping

- Wrapper accepts `feature_id`; calls the internal feature-flags REST
  API with `name = feature_id` (the JSON file's primary key is `name`).
- `traffic_percentage` and `state` pass through unchanged.
- The internal `fetchFlags()` / `patchFlag(name, ...)` helpers already
  exist in `mcps/feature-flags/src/index.ts`. They call
  `${API_URL}/api/feature-flags` (default `http://127.0.0.1:3001`) with
  header `x-api-key: ${FEATURE_FLAGS_API_KEY ?? "local-m3-change-me"}`.
  **Extract them into a shared module** (e.g.
  `mcps/feature-flags/src/feature-flags-client.ts`) and import that
  module from both `index.ts` (stdio MCP) and the new `http.ts` (HTTP
  wrapper). Do **not** duplicate the fetch logic.
- CLAUDE.md forbids editing `data/feature-flags/features.json` directly,
  and the route through the app API already respects that — keep it.

### Hard dependency: the Next.js `apps/app` server must be running

Both the existing MCP and the new wrapper proxy through
`http://127.0.0.1:3001/api/feature-flags`. **If the Next.js app is not
running, every wrapper call returns 502 / "API Error: fetch failed".**

When you build the wrapper you can either:
- require the app to be up (document this in a `homework/M5/README.md`
  Phase 12 pre-flight reminder), or
- start the app yourself before the wrapper in your dev workflow.

In `apps/app/.env.local`, make sure `FEATURE_FLAGS_API_KEY` matches
`M3_MCP_API_KEY` so the wrapper can authenticate to the app.

### Errors

Return JSON in the shape `{ "error": "<code>", "message": "<human>" }`
with status:
- 400 — schema validation failure (bad type/range).
- 401 — missing or wrong bearer.
- 404 — unknown `feature_id`.
- 409 — dependency violation (e.g. enabling a flag whose dep is Disabled
  — the MCP already raises this; surface it as 409).
- 500 — anything else.

### Wire-up

In `mcps/feature-flags/package.json` add:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node build/index.js",
    "start:http": "node build/http.js"
  }
}
```

Build and run:
```bash
pnpm --filter @tradewitness/feature-flags-mcp build
pnpm --filter @tradewitness/feature-flags-mcp run start:http
```
(Package name is `@tradewitness/feature-flags-mcp`. `pnpm --filter
feature-flags ...` does **not** match anything.)

### Verify

```bash
set -a; . homework/M5/.env.local; set +a

curl -i http://localhost:7733/health
# → HTTP/1.1 200, body {"ok":true}

curl -i -X POST http://localhost:7733/tools/get_feature_info \
  -H "Content-Type: application/json" \
  -d '{"feature_id":"search_v2"}'
# → HTTP/1.1 401 (no bearer)

curl -i -X POST http://localhost:7733/tools/get_feature_info \
  -H "Authorization: Bearer ${M3_MCP_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"feature_id":"search_v2"}'
# → HTTP/1.1 200, body = flag JSON

curl -i -X POST http://localhost:7733/tools/adjust_traffic_rollout \
  -H "Authorization: Bearer ${M3_MCP_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"feature_id":"search_v2","traffic_percentage":-50}'
# → 400 (schema rejection — Layer 2 of defense in depth)
```

---

## 1.5 n8n webhook secret (`X-API-Key`)

Generate the value once:

```bash
openssl rand -hex 32
# Paste into homework/M5/.env.local as N8N_WEBHOOK_API_KEY=...
```

### Add Header Auth credential in n8n

n8n UI → Credentials → New → **Header Auth**:
- Name: `n8n-feature-control-api-key`
- Header Name: `X-API-Key`
- Header Value: paste the value of `N8N_WEBHOOK_API_KEY`.

This credential is attached to WF1's Webhook node (see docs/02-wf1 §C.1).

### Frontend side

Next.js app reads the value at request time. Server-side env var
(do **not** prefix with `NEXT_PUBLIC_` — the key would end up in the
browser bundle). Add to `apps/app/.env.local`:

```
N8N_WEBHOOK_URL=http://localhost:5678/webhook/feature-control
N8N_WEBHOOK_API_KEY=<same value as in homework/M5/.env.local>
```

The Auto-Pilot Controls component will call the n8n webhook through a
Next.js server action / route handler, so the key never reaches the
browser. See docs/02-wf1 §B.

### Verify

```bash
# Without header — expect 403/401:
curl -i -X POST http://localhost:5678/webhook/feature-control \
  -H "Content-Type: application/json" \
  -d '{"feature_id":"search_v2","action":"check"}'

# With header — expect 200 (after WF1 is built; for now just check that
# the auth layer is wired):
curl -i -X POST http://localhost:5678/webhook/feature-control \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <value>" \
  -d '{"feature_id":"search_v2","action":"check"}'
```

---

## 1.6 CORS (only needed if calling n8n directly from the browser)

The plan in docs/02-wf1 keeps the API key on the Next.js server side and
proxies through a server action, so the browser never talks to n8n
directly and CORS is a non-issue.

If you decide to skip the server-action proxy and call n8n from a client
component, add these to the n8n Webhook node → Options → Response Headers:

The repo runs two Next apps on different dev ports:
- `apps/app` (admin dashboard, where WF1 is actually called) — port **3001**.
- `apps/landing` — port **3000** (not used by WF1, but listed in case
  you call the webhook from there for testing).

Pick whichever origin actually makes the request. n8n's `Access-Control-Allow-Origin`
header can only hold a single value, so set it to your primary origin or
respond dynamically. Examples:

```
# Primary (admin dashboard)
Access-Control-Allow-Origin: http://localhost:3001

# Or, when testing from the landing app
Access-Control-Allow-Origin: http://localhost:3000

Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-API-Key
```

If you need to support both at once, gate the value through a small Set
node that echoes `={{ $request.headers.origin }}` only when it matches
either `http://localhost:3000` or `http://localhost:3001`.

---

## 1.7 MCP M3 reachability from n8n

There is exactly one path: the HTTP wrapper from §1.4. n8n calls it from
inside the container via `http://host.docker.internal:7733`. WF1 uses
either the `httpRequestTool` sub-nodes or the MCP Client Tool (if the
wrapper also exposes SSE — optional, not required). WF2 uses a plain
HTTP Request node directly. See `docs/02-wf1` §C.3 and `docs/03` §C.3.

### Verify

```bash
docker exec -it n8n-m5 sh -c \
  'wget -qO- --header="Authorization: Bearer $M3_MCP_API_KEY" \
   http://host.docker.internal:7733/health'
# → {"ok":true}
```

If this fails: confirm the wrapper binds `0.0.0.0` (not `127.0.0.1`), and
that `docker-compose.yml` still has the `extra_hosts:
host.docker.internal:host-gateway` line.
