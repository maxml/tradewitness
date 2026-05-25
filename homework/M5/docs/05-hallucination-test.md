# 05 — Hallucination / defense-in-depth test

The point: a malicious or buggy caller cannot push the feature into an
invalid state, even if the LLM "agrees" to do it. Defense lives in
**code**, not in the system prompt.

---

## A. The probe

WF1 must be **activated** in n8n before this URL responds. While still
in the editor, swap `/webhook/` for `/webhook-test/` and click "Listen
for test event" once per probe. Full URL-mode notes in `docs/02-wf1` §E.

```bash
set -a; . homework/M5/.env.local; set +a

curl -i -X POST http://localhost:5678/webhook/feature-control \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${N8N_WEBHOOK_API_KEY}" \
  -d '{"feature_id":"search_v2","action":"rollout","traffic_percentage":-50}'
```

### Expected response (400 or 200 with success=false)

```json
{
  "success": false,
  "message": "Validation error",
  "rejected_at": "input-validation"
}
```

The agent **must not have been invoked** for this request. Confirm in the
n8n executions trace — the run should end at Switch → Respond 400, with
no AI Agent execution at all. That's the whole point: the cheap
deterministic guard fires before any LLM tokens are spent.

---

## B. Where the defense lives (two layers)

1. **Layer 1 — Switch node in WF1** (docs/02 §C.2, rule `invalid_traffic`).
   Rejects the request before it reaches the AI Agent. This is the layer
   that the curl above exercises.
2. **Layer 2 — request validation in the M3 HTTP wrapper**
   (`mcps/feature-flags/src/http.ts`, see `docs/01-setup.md` §1.4).
   The wrapper's own request schema enforces
   `traffic_percentage: integer, 0..100` and `state: enum` and rejects
   bad payloads with 400 before any side effect. The agent reaches the
   M3 surface only through this wrapper, so a hallucinated tool argument
   that slipped past Layer 1 would still be caught here. The legacy
   stdio MCP keeps its own `feature_name`/`percentage` schema for its
   own consumers — that's a separate Layer-2 instance, not the one M5
   relies on.

Both layers must be present for the answer to count as "defense in
depth". The system prompt's Constraints section in docs/02 §D is a third,
weakest layer — a recommendation to the model, not a guarantee. Never
rely on it alone.

---

## C. What to capture for the report

- Screenshot or copy of the curl response showing `rejected_at: "input-validation"`.
- Screenshot of the n8n executions trace showing the run terminating at
  Respond 400 (no AI Agent step).
- A run of `simulate_wf1.py --include-invalid` showing every 7th request
  rejected the same way.

Put these in `homework/M5/` as `trace-wf1-hallucination.png` (or include
them in the screencast).

---

## D. Related anti-pattern to avoid in the write-up

Don't claim that the constraint in the system prompt ("traffic_percentage
in [0, 100], refuse otherwise") **is** the defense. It's a redundant
guardrail. The defense is code. Make this explicit in the final
`homework/M5/README.md`.
