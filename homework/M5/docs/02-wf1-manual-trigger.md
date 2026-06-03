# 02 — WF1: Manual trigger from the Dashboard

Build a Next.js → n8n webhook → AI Agent → MCP flow for the
`/private/admin/features` page.

---

## A. Architecture

```
Dashboard (apps/app) ─► server action ─► POST /webhook/feature-control ─►
  Webhook (Header Auth) ─► Switch (4 rules + fallback) ─►
    AI Agent (Chat Model, Window Buffer Memory, MCP Tool, Output Parser) ─►
  Respond to Webhook 200 ─► server action ─► UI update + toast
```

Reject branches of the Switch go to a shared `Respond 400` node.

---

## B. Frontend changes (`apps/app`)

### B.1 Where to put files

```
apps/app/src/
├── app/private/admin/features/
│   ├── page.tsx                          (existing — extend; see B.4)
│   └── actions/
│       └── auto-pilot-call.ts            (NEW — server action)
└── components/admin/
    └── AutoPilotControls.tsx             (NEW — client component)
```

The route segment is the literal directory `private/` (not a `(private)`
Next.js route group). The page already exists under
`apps/app/src/app/private/admin/features/` behind Clerk + `ADMIN_EMAILS`.
Do not introduce a `(private)` group — that would create a different URL
mapping and not extend the existing M4 dashboard.

### B.2 Server action `auto-pilot-call.ts`

Responsibilities:
- Read `N8N_WEBHOOK_URL` and `N8N_WEBHOOK_API_KEY` from server-side env.
- Re-check Clerk auth + admin email (same gate as the existing PATCH path).
- POST to n8n with `Content-Type: application/json` and `X-API-Key`.
- Return `{ success, message, current_state }` to the caller.
- On non-200 or `success === false`, return a typed error object — no
  exceptions leak to the client.

Why a server action: keeps `N8N_WEBHOOK_API_KEY` off the browser bundle
(rule from docs/01-setup §1.5) and lets us reuse the project's admin
auth check.

### B.3 `AutoPilotControls.tsx` (client component)

Props:
```ts
type FeatureFlagState = {
  name: string;
  status: "Enabled" | "Disabled" | "Testing";
  traffic_percentage: number;
  depends_on: string[];
  last_modified: string;
};

type Props = {
  feature: FeatureFlagState;
  onUpdate: (next: FeatureFlagState) => void;
};
```

`name` is the primary key in `features.json` — there is no `id` field.
The server action's webhook payload still uses `feature_id` (that's the
M5 contract); pass `feature.name` as the value.

State: `loading: "check" | "test" | "rollback" | null`, `feedback: { type, message } | null`.

Three buttons, each calls the server action with:
- `check` → `{ feature_id: feature.name, action: "check" }`
- `test` → `{ feature_id: feature.name, action: "test", target_state: "Testing" }`
- `rollback` → `{ feature_id: feature.name, action: "rollback", target_state: "Disabled" }`

UI rules (from DESIGN.md and M4 conventions):
- Single 1px border, no gradients, no two-column comparison cards.
- Reuse Radix primitives already in `components/`.
- Disabled state for all three buttons while any is loading.
- Success → small green alert; error → red alert with the agent's
  `message` verbatim.

### B.4 Where it appears

In `apps/app/src/app/private/admin/features/page.tsx` (or its child
client component containing the table), render `<AutoPilotControls>` next
to the selected-row detail panel, or as a row-level dropdown action.
Either layout works; pick whichever matches the existing M4 layout.

`onUpdate` should update the same local state the M4 toggle uses, so the
status badge and slider reflect the new value immediately after the agent
finishes.

### B.5 Env (re-stated)

`apps/app/.env.local`:
```
N8N_WEBHOOK_URL=http://localhost:5678/webhook/feature-control
N8N_WEBHOOK_API_KEY=<same as homework/M5/.env.local>
```

---

## C. n8n workflow `wf1-manual-trigger`

### C.1 Webhook Trigger

| Field | Value |
|---|---|
| `type` | `n8n-nodes-base.webhook` |
| `typeVersion` | `2` |
| `httpMethod` | `POST` |
| `path` | `feature-control` |
| `authentication` | `headerAuth` |
| Credential | `n8n-feature-control-api-key` (from docs/01-setup §1.5) |
| `responseMode` | `responseNode` (we use a Respond node) |

### C.2 Switch — Input Validation (n8n 2.x `rules` mode)

`type: n8n-nodes-base.switch`, `typeVersion: 3`, `mode: rules`,
`options.fallbackOutput: extra`.

| # | outputKey | leftValue | operator | rightValue |
|---|---|---|---|---|
| 0 | `missing_feature_id` | `={{ $json.feature_id }}` | string · isEmpty | — |
| 1 | `missing_action` | `={{ $json.action }}` | string · isEmpty | — |
| 2 | `invalid_action` | `={{ ['check','test','rollback','rollout'].includes($json.action) }}` | boolean · equals | `false` |
| 3 | `invalid_traffic` | `={{ $json.traffic_percentage !== undefined && ($json.traffic_percentage < 0 \|\| $json.traffic_percentage > 100) }}` | boolean · equals | `true` |
| 4 | fallback | — | — | → AI Agent |

Outputs 0..3 → one shared `Respond 400` node.

### C.3 Tools: 3× `httpRequestTool` against the M3 HTTP wrapper

The MCP is stdio-only; n8n calls it through the HTTP wrapper from
`docs/01-setup` §1.4. Three tool nodes, one per wrapper endpoint:

| Tool node name | Method | URL | Body schema |
|---|---|---|---|
| `get_feature_info` | POST | `http://host.docker.internal:7733/tools/get_feature_info` | `{ feature_id }` |
| `set_feature_state` | POST | `http://host.docker.internal:7733/tools/set_feature_state` | `{ feature_id, state }` |
| `adjust_traffic_rollout` | POST | `http://host.docker.internal:7733/tools/adjust_traffic_rollout` | `{ feature_id, traffic_percentage }` |

Each tool node:
- `type: n8n-nodes-base.httpRequestTool`.
- `name` and `description` filled — the agent picks based on description.
- Auth: Bearer token credential with value `${M3_MCP_API_KEY}`.
- Connection: `ai_tool` → AI Agent.

If you later add SSE to the wrapper, you can collapse all three into a
single `@n8n/n8n-nodes-langchain.toolMcp` sub-node pointing at
`http://host.docker.internal:7733/sse`. That's optional and out of scope
here.

### C.4 AI Agent — Tools Agent

| Field | Value |
|---|---|
| `type` | `@n8n/n8n-nodes-langchain.agent` |
| `typeVersion` | `3` |
| `options.maxIterations` | `5` |
| `options.systemMessage` | `=` + GCAO prompt in §D below |

Sub-nodes (connected via the AI Agent ports, not in the main chain):

- **Chat Model** — pick one (Claude Sonnet 4 or 4.6 recommended). Connection: `ai_languageModel`.
- **Window Buffer Memory** (`@n8n/n8n-nodes-langchain.memoryBufferWindow`):
  - `contextWindowLength: 5`
  - `sessionIdType: customKey`
  - `sessionKey: ={{ $json.feature_id }}` — without this every webhook
    call gets a fresh session and memory is useless.
  - Connection: `ai_memory`.
- **Tools** — 3× `httpRequestTool` from §C.3. Connection: `ai_tool`.
- **Structured Output Parser** (`@n8n/n8n-nodes-langchain.outputParserStructured`),
  `schemaType: manual`:
  ```json
  {
    "type": "object",
    "required": ["success", "message"],
    "properties": {
      "success": {"type": "boolean"},
      "message": {"type": "string"},
      "current_state": {
        "type": ["object", "null"],
        "properties": {
          "name": {"type": "string"},
          "status": {"type": "string", "enum": ["Enabled","Disabled","Testing"]},
          "traffic_percentage": {"type": "number"},
          "depends_on": {"type": "array", "items": {"type": "string"}},
          "last_modified": {"type": "string"}
        }
      },
      "rejected_at": {"type": ["string", "null"]}
    }
  }
  ```
  Note: `features.json` has no `id` field — `name` is the primary key.
  The webhook input still uses `feature_id` (the wrapper translates it to
  `name` internally), but the response surface stays consistent with the
  data model.
  Connection: `ai_outputParser`.

### C.5 Respond to Webhook nodes

**Respond 400** (shared, fed by Switch outputs 0..3):
```json
{ "success": false, "message": "Validation error", "rejected_at": "input-validation" }
```
HTTP code 400.

**Respond 200** (fed by AI Agent `main[0]`):
- `respondWith: json`
- `responseBody: ={{ $json }}`
- HTTP code 200.

### C.6 Connections

```
Webhook              main[0] → Switch main[0]
Switch               main[0..3] → Respond 400 main[0]
Switch               main[4]   → AI Agent main[0]
Chat Model           ai_languageModel → AI Agent
Window Buffer Memory ai_memory        → AI Agent
MCP Tool / HTTP*3    ai_tool          → AI Agent
Output Parser        ai_outputParser  → AI Agent
AI Agent             main[0]          → Respond 200 main[0]
```

---

## D. GCAO system prompt for WF1

Paste into `AI Agent → Options → System Message`, prefixed with `=` so n8n
treats it as an expression and interpolates `{{ $json.* }}`:

```
Goal:
Execute the operator request for feature flag {{ $json.feature_id }}.

Context:
- Always call get_feature_info FIRST to read current state before any mutation.
- Operator command: action={{ $json.action }}, target_state={{ $json.target_state }}, traffic_percentage={{ $json.traffic_percentage }}.
- Allowed actions: "check" (read-only), "test" (move to Testing), "rollback" (move to Disabled), "rollout" (change traffic_percentage).
- Available tools: get_feature_info, set_feature_state, adjust_traffic_rollout.

Action:
1. action="check"    → get_feature_info, return current state, success=true.
2. action="test"     → get_feature_info → if status already Testing return no_op success=true → else set_feature_state(Testing) → get_feature_info to verify.
3. action="rollback" → get_feature_info → if status already Disabled return no_op success=true → else set_feature_state(Disabled) → get_feature_info to verify.
4. action="rollout"  → get_feature_info → adjust_traffic_rollout(traffic_percentage) → get_feature_info.
5. If a tool returns an error, return success=false with the tool's message in `message`.

Output (strict JSON, matches the configured schema):
{
  "success": boolean,
  "message": string,                       // one short Ukrainian sentence
  "current_state": { name, status, traffic_percentage, depends_on, last_modified } | null,
  "rejected_at": "input-validation" | "tool-execution" | null
}

Constraints:
- traffic_percentage must be in [0, 100]. If out of range, refuse without calling tools.
- target_state must be one of Enabled | Disabled | Testing.
- Do NOT call set_feature_state if current status already matches the target.
- Real defense for invalid inputs lives in the Switch node and in the MCP JSON schema — these constraints are only a redundant guardrail.
```

---

## E. Smoke tests (run after wiring up)

### Test URL vs Production URL

n8n exposes two webhook URLs per Webhook node:

| URL | When it responds |
|---|---|
| `http://localhost:5678/webhook-test/feature-control` | Only while "Listen for test event" is active in the editor. Single-shot per click. |
| `http://localhost:5678/webhook/feature-control` | Always, but **only after** you click "Activate" on the workflow. |

Use `webhook-test/...` while iterating (you see every execution in the
editor in real time). Switch to `webhook/...` and activate the workflow
for the simulators and the screencast. The curl probes below assume
the production URL on an activated workflow — adjust the path if you're
still in test mode.

```bash
set -a; . homework/M5/.env.local; set +a

# Auth check
curl -i -X POST http://localhost:5678/webhook/feature-control \
  -H "Content-Type: application/json" \
  -d '{"feature_id":"search_v2","action":"check"}'
# → 401/403

# Happy path
curl -s -X POST http://localhost:5678/webhook/feature-control \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${N8N_WEBHOOK_API_KEY}" \
  -d '{"feature_id":"search_v2","action":"check"}' | jq .
# → { "success": true, "message": "...", "current_state": {...} }

# Already-Disabled no_op
curl -s -X POST http://localhost:5678/webhook/feature-control \
  -H "X-API-Key: ${N8N_WEBHOOK_API_KEY}" -H "Content-Type: application/json" \
  -d '{"feature_id":"<already-disabled-id>","action":"rollback","target_state":"Disabled"}' | jq .
# → success:true, message mentions "уже Disabled"

# Hallucination probe (full curl in docs/05)
curl -s -X POST http://localhost:5678/webhook/feature-control \
  -H "X-API-Key: ${N8N_WEBHOOK_API_KEY}" -H "Content-Type: application/json" \
  -d '{"feature_id":"search_v2","action":"rollout","traffic_percentage":-50}' | jq .
# → success:false, rejected_at:"input-validation"
```

Also enable in the AI Agent node: `Verbose` and `Return Intermediate Steps`
— without these the execution trace is hard to screenshot for the report.
