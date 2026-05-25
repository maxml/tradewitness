# Importing the M5 workflows into n8n

`wf1-manual-trigger.json` and `wf2-scheduled-monitor.json` are
**skeletons** — they contain the main chain (triggers, switches, code
nodes, set, telegram, AI Agent shell with system prompt baked in), but
the AI Agent's **sub-nodes** (Chat Model, Memory, Tools, Output Parser)
are not in the JSON because their format changes per n8n minor version
and importing the wrong shape silently breaks the agent. You add those
in the UI after import, following the steps below.

---

## 1. Import

n8n UI → **Workflows** → **Add workflow** → **⋮ menu** → **Import from File**
→ pick `wf1-manual-trigger.json`. Repeat for WF2.

Right after import you'll see red dots on:
- the Webhook node (WF1) — credential placeholder `REPLACE_ME`,
- `Get Feature Status` (WF2) — credential placeholder,
- `Send Alert` (WF2) — credential placeholder,
- both AI Agents — missing Chat Model / Tools / Output Parser sub-nodes.

That's expected. Fix in this order.

## 2. Credentials (create if not yet)

| Credential name | Type | Value | Used by |
|---|---|---|---|
| `n8n-feature-control-api-key` | Header Auth | header `X-API-Key`, value = `N8N_WEBHOOK_API_KEY` from `homework/M5/.env.local` | WF1 Webhook |
| `m3-wrapper-bearer` | Header Auth | header `Authorization`, value `Bearer <M3_MCP_API_KEY>` | WF2 Get Feature Status + all M3 tool nodes |
| `telegram-m5-alerts` | Telegram API | access token = `TELEGRAM_BOT_TOKEN` | WF2 Send Alert |
| `Anthropic API` (or OpenAI/Gemini/OpenRouter) | the model's native cred type | your model API key | Both AI Agents |

After creating them, open each red-dot node and select the credential
from the dropdown.

## 3. Sub-nodes for **WF1 → AI Agent**

Click the AI Agent node, then use the `+` affordances around it to add
each of the following.

### 3.1 Chat Model
Add → Sub-nodes → AI → **Anthropic Chat Model** (or your choice).
- Model: `claude-sonnet-4-20250514` or current Sonnet/Opus.
- Connect: `ai_languageModel` → AI Agent (this happens automatically
  when you add it via the `+` slot on the AI Agent's bottom).

### 3.2 Memory: Window Buffer
Add → Sub-nodes → AI → **Window Buffer Memory**.
- Parameters:
  - `contextWindowLength`: `5`
  - `sessionIdType`: `customKey`
  - `sessionKey`: `={{ $('Webhook').item.json.body.feature_id }}`
- Connect: `ai_memory` → AI Agent.

### 3.3 Tools — 3× HTTP Request Tool
Add three **HTTP Request Tool** sub-nodes, one per M3 wrapper endpoint.
All share the same `m3-wrapper-bearer` credential.

| Tool name | Method | URL | Body (JSON) |
|---|---|---|---|
| `get_feature_info` | POST | `http://host.docker.internal:7733/tools/get_feature_info` | `{ "feature_id": "{{ $fromAI('feature_id', 'exact feature_id', 'string') }}" }` |
| `set_feature_state` | POST | `http://host.docker.internal:7733/tools/set_feature_state` | `{ "feature_id": "{{ $fromAI('feature_id', 'exact feature_id', 'string') }}", "state": "{{ $fromAI('state', 'one of Enabled, Disabled, Testing', 'string') }}" }` |
| `adjust_traffic_rollout` | POST | `http://host.docker.internal:7733/tools/adjust_traffic_rollout` | `{ "feature_id": "{{ $fromAI('feature_id', 'exact feature_id', 'string') }}", "traffic_percentage": {{ $fromAI('traffic_percentage', 'integer 0..100', 'number') }} }` |

For each tool node:
- Authentication: Generic Credential Type → Header Auth → `m3-wrapper-bearer`.
- Description: write what the tool does (the agent picks based on description).
- Connect: `ai_tool` → AI Agent.

### 3.4 Structured Output Parser
Add → Sub-nodes → AI → **Structured Output Parser**.
- `schemaType`: `manual`
- `inputSchema` (paste verbatim):
  ```json
  {
    "type": "object",
    "required": ["success", "message"],
    "properties": {
      "success": { "type": "boolean" },
      "message": { "type": "string" },
      "current_state": {
        "type": ["object", "null"],
        "properties": {
          "name": { "type": "string" },
          "status": { "type": "string", "enum": ["Enabled", "Disabled", "Testing"] },
          "traffic_percentage": { "type": "number" },
          "depends_on": { "type": "array", "items": { "type": "string" } },
          "last_modified": { "type": "string" }
        }
      },
      "rejected_at": { "type": ["string", "null"] }
    }
  }
  ```
- Connect: `ai_outputParser` → AI Agent.

## 4. Sub-nodes for **WF2 → Monitor Agent**

Same flow as §3 but:

### 4.1 Chat Model — same as WF1.
### 4.2 Memory — **none**. The cron tick is stateless; attaching memory wastes tokens.
### 4.3 Tools — 2 HTTP Request Tools:
- `get_feature_info` — same as WF1 §3.3.
- `set_feature_state` — same as WF1 §3.3.
- (`adjust_traffic_rollout` not needed.)

### 4.4 Structured Output Parser
- `schemaType`: `manual`
- `inputSchema`:
  ```json
  {
    "type": "object",
    "required": ["action_taken", "alert_message"],
    "properties": {
      "action_taken": { "type": "string", "enum": ["deactivated", "reenabled", "no_op", "error"] },
      "previous_state": { "type": ["object", "null"] },
      "new_state": { "type": ["object", "null"] },
      "alert_message": { "type": "string" },
      "error_rate_percent": { "type": "number" },
      "threshold_used": { "type": "number" },
      "reason": { "type": ["string", "null"] }
    }
  }
  ```

## 5. Activate

WF1 — click the **Active** toggle at the top right. Production webhook
URL becomes `http://localhost:5678/webhook/feature-control`.

WF2 — click **Active**. The Schedule Trigger starts firing every minute.

## 6. Smoke tests

See `docs/02-wf1-manual-trigger.md` §E (WF1) and
`docs/03-wf2-scheduled-monitor.md` §E (WF2). Quick WF1 probe:

```bash
set -a; . homework/M5/.env.local; set +a
curl -s -X POST http://localhost:5678/webhook/feature-control \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${N8N_WEBHOOK_API_KEY}" \
  -d '{"feature_id":"search_v2","action":"check"}' | jq .
```

## Notes

- The AI Agent JSON in these workflows uses `typeVersion: 1.7`. If your
  n8n is older/newer and rejects on import, just edit that field on the
  node after import — sub-nodes pick the matching version automatically.
- The Switch nodes use `typeVersion: 3` with `rules` mode — n8n 1.42+.
- If the n8n container can't reach `host.docker.internal:7733`, see
  `docs/01-setup.md` §1.7. Most common cause: M3 wrapper bound to
  `127.0.0.1` instead of `0.0.0.0` (it defaults to `0.0.0.0` in our
  http.ts), or compose started without `--env-file`.
