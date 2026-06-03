# 03 — WF2: Scheduled monitor + Telegram alerts

n8n cron reads a sine-wave error-rate log every minute, decides whether to
deactivate or re-enable a feature via MCP, and sends a Telegram alert.

---

## A. Architecture

```
simulate_wf2.py (host) ── writes ──► homework/M5/logs.json (mounted to /data/m5/logs.json in n8n)

n8n WF2 every 1 min:
  Schedule Trigger
    ─► Code: Read & Analyze Logs (last 60s window → error_rate)
    ─► HTTP: Get Feature Status (MCP get_feature_info)
    ─► Code: Merge Data (unify into one $json)
    ─► Switch (rules):
         out[0] deactivate  → Set Decision deactivate ─┐
         out[1] reenable    → Set Decision reenable   ─┤
         out[2] fallback    → NoOp                     │
                                                       ▼
                                              AI Agent (Monitor)
                                                 ChatModel, Tools, Parser
                                                 (NO Memory — cron stateless)
                                                       │
                                                       ▼
                                            Telegram Send Message
```

---

## B. Data plumbing

`simulate_wf2.py` (host) writes to `homework/M5/logs.json`. n8n container
mounts this folder at `/data/m5` (docs/01-setup §1.1). WF2's Code node
reads from `/data/m5/logs.json`.

`logs.json` is a **single valid JSON array** (not JSONL / not
newline-delimited). The Code node reads the whole file and `JSON.parse`s
it once per tick. The simulator appends by reading, pushing, and
writing the array back. Each element looks like:
```json
{
  "timestamp": "2026-05-25T12:00:00.000Z",
  "feature_id": "search_v2",
  "status": "success" | "error",
  "error_rate_now": 0.073
}
```

---

## C. n8n workflow `wf2-scheduled-monitor`

### C.1 Schedule Trigger

| Field | Value |
|---|---|
| `type` | `n8n-nodes-base.scheduleTrigger` |
| `typeVersion` | `1` |
| `rule.interval` | `[{ field: "minutes", minutesInterval: 1 }]` |

### C.2 Code — "Read & Analyze Logs"

`type: n8n-nodes-base.code`, JS. Requires `NODE_FUNCTION_ALLOW_BUILTIN=fs`
on the n8n container — already set in `docker-compose.yml`. Without it,
`require('fs')` throws and the workflow fails on every tick.

```js
const fs = require('fs');
const path = '/data/m5/logs.json';
let data = [];
try {
  data = JSON.parse(fs.readFileSync(path, 'utf-8'));
} catch (e) {
  return [{ json: { error: e.message, error_rate: 0, total: 0, errors: 0, feature_id: 'search_v2' } }];
}
const now = Date.now();
const windowMs = 60 * 1000;
const recent = data.filter(e => (now - new Date(e.timestamp).getTime()) < windowMs);
const total = recent.length;
const errors = recent.filter(e => e.status === 'error').length;
return [{
  json: {
    feature_id: 'search_v2',
    error_rate: total > 0 ? errors / total : 0,
    total,
    errors,
  }
}];
```

### C.3 HTTP Request — "Get Feature Status"

| Field | Value |
|---|---|
| `type` | `n8n-nodes-base.httpRequest` |
| `method` | `POST` |
| `url` | `http://host.docker.internal:7733/tools/get_feature_info` (M3 wrapper from `docs/01-setup` §1.4) |
| `authentication` | Bearer Token (`M3_MCP_API_KEY`) |
| Body | `{ feature_id: "={{ $('Read & Analyze Logs').item.json.feature_id }}" }` |

Schedule Trigger flows don't host an AI Agent at this step, so this is a
deterministic HTTP read regardless of how WF1's AI Agent fetches state.

### C.4 Code — "Merge Data"

n8n's Switch rules in `rules` mode evaluate against the input `$json`, not
cross-node references. Without a merge step, Switch conditions referencing
`$('Get Feature Status')` are brittle. Merge first:

```js
return [{
  json: {
    feature_id:     $('Read & Analyze Logs').item.json.feature_id,
    error_rate:     $('Read & Analyze Logs').item.json.error_rate,
    total:          $('Read & Analyze Logs').item.json.total,
    // M3 wrapper returns the raw feature flag JSON, so `status` lives at the top level.
    current_status: $('Get Feature Status').item.json.status,
  }
}];
```

### C.5 Switch — "Decision" (rules mode, fallback enabled)

| # | outputKey | conditions (combinator: `and`) |
|---|---|---|
| 0 | `deactivate` | `error_rate > 0.05` **AND** `current_status != "Disabled"` |
| 1 | `reenable`   | `error_rate < 0.01` **AND** `current_status == "Disabled"` |
| 2 | fallback     | else → NoOp |

`options.fallbackOutput: extra`.

### C.6 Two `Set` nodes — Set Decision

`type: n8n-nodes-base.set`, one for each branch:

- "Set Decision deactivate": fields `decision="deactivate"`, plus
  pass-through `feature_id`, `error_rate`, `current_status`.
- "Set Decision reenable": same with `decision="reenable"`.

Both feed into the single AI Agent.

### C.7 AI Agent — "Monitor Agent"

| Field | Value |
|---|---|
| `type` | `@n8n/n8n-nodes-langchain.agent` |
| `typeVersion` | `3` |
| `options.maxIterations` | `3` |
| `options.systemMessage` | `=` + GCAO in §D |

Sub-nodes:
- **Chat Model** — same model as WF1 to keep evaluation simple.
- **NO Memory** — cron tick is stateless; attaching memory wastes tokens.
- **Tools** (2× `httpRequestTool`, same M3 wrapper as WF1 §C.3):
  - `get_feature_info` (race protection — re-read state inside the agent),
    URL `http://host.docker.internal:7733/tools/get_feature_info`.
  - `set_feature_state`,
    URL `http://host.docker.internal:7733/tools/set_feature_state`.
  - `adjust_traffic_rollout` is not needed here.
  - Bearer auth: `M3_MCP_API_KEY`.
- **Output Parser** (structured, manual):
  ```json
  {
    "type": "object",
    "required": ["action_taken", "alert_message"],
    "properties": {
      "action_taken":     {"type": "string", "enum": ["deactivated","reenabled","no_op","error"]},
      "previous_state":   {"type": ["object","null"]},
      "new_state":        {"type": ["object","null"]},
      "alert_message":    {"type": "string"},
      "error_rate_percent": {"type": "number"},
      "threshold_used":     {"type": "number"},
      "reason":             {"type": ["string","null"]}
    }
  }
  ```

### C.8 Telegram — "Send Alert"

| Field | Value |
|---|---|
| `type` | `n8n-nodes-base.telegram` |
| `operation` | `sendMessage` |
| `chatId` | `={{ $env.TELEGRAM_CHAT_ID }}` — read from container env so the exported workflow JSON stays secret-free |
| `text` | `={{ $json.alert_message }}` |
| Credential | `telegram-m5-alerts` (docs/01-setup §1.2) |

**Wire only from the AI Agent `main[0]`. Do NOT wire from the NoOp branch
or from the Switch fallback** — that would spam the chat every minute.

### C.9 NoOp

`type: n8n-nodes-base.noOp`, fed by Switch fallback output. Keeps the
execution trace clean ("no action taken") instead of an unbound branch.

### C.10 Connections

```
Schedule Trigger        main → Read & Analyze Logs main
Read & Analyze Logs     main → Get Feature Status main
Get Feature Status      main → Merge Data main
Merge Data              main → Switch main
Switch                  main[0] → Set Decision deactivate main
Switch                  main[1] → Set Decision reenable   main
Switch                  main[2] → NoOp                     main
Set Decision deactivate main → AI Agent main
Set Decision reenable   main → AI Agent main
Chat Model              ai_languageModel → AI Agent
Tools                   ai_tool          → AI Agent
Output Parser           ai_outputParser  → AI Agent
AI Agent                main → Telegram Send Alert main
```

---

## D. GCAO system prompt for WF2

```
Goal:
Register an incident or recovery for feature {{ $json.feature_id }}.
Current error_rate: {{ $json.error_rate }} (deactivate threshold 5%, re-enable threshold 1%).
Current status: {{ $json.current_status }}.
Decision from upstream Switch: {{ $json.decision }} (deactivate | reenable).

Context:
- The decision is already made deterministically upstream. Your job is only to execute it via MCP.
- Available tools: get_feature_info, set_feature_state.
- Do NOT re-decide. Algorithm-before-AI — guards live outside the model.

Action:
1. Call get_feature_info({{ $json.feature_id }}) to re-read state (protects against Switch↔Agent races).
2. If decision="deactivate":
   - If status == "Disabled" → action_taken="no_op", reason="already_disabled".
   - Else → set_feature_state(state="Disabled") → re-read.
3. If decision="reenable":
   - If status != "Disabled" → action_taken="no_op", reason="already_enabled".
   - Else → set_feature_state(state="Enabled") → re-read.
4. Build a short Ukrainian alert_message (one line). Templates:
   - deactivated: "🚨 Feature {name} деактивована: error_rate {X}% перевищив поріг 5%."
   - reenabled:   "✅ Feature {name} відновлена: error_rate {X}% впав нижче 1%."
   - no_op:       "ℹ️ Feature {name} — без змін (error_rate {X}%, статус {S})."

Output (strict JSON, matches the configured schema):
{
  "action_taken": "deactivated" | "reenabled" | "no_op" | "error",
  "previous_state": object | null,
  "new_state": object | null,
  "alert_message": string,
  "error_rate_percent": number,
  "threshold_used": number,
  "reason": string | null
}

Constraints:
- Do NOT call set_feature_state if the current status already matches the target.
- On MCP error, action_taken="error" with reason carrying the tool's message.
```

---

## E. Smoke tests

```bash
# 1. Run simulate_wf2.py with a short sine period for fast cycling:
python3 homework/M5/simulate_wf2.py \
  --output homework/M5/logs.json \
  --duration 600 --period 120

# 2. Watch n8n executions list — Schedule Trigger fires every minute.
# 3. Watch Telegram — within 2–3 minutes you should see a "deactivated"
#    message, and 1–2 minutes later a "reenabled" message.
# 4. Confirm no spam during the fallback (within-threshold) minutes.
```
