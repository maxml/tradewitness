# M5 — review

Findings, decisions and verification notes from building and running the
M5 n8n agentic workflows end-to-end against the M3 feature-flag stack
and M4 admin dashboard. README stays the assignment write-up; this file
is the post-mortem.

Scope of what got built and exercised live:

- `WF1` — manual webhook trigger fired by the Auto-Pilot buttons in
  `/private/admin/features`. Three buttons per feature card
  (`check`, `set_traffic`, rollback), the dashboard hits a Next.js
  **server action** which hits the n8n webhook with `X-API-Key`.
- `WF2` — schedule trigger every 60s, reads `homework/M5/logs.json`,
  computes a 60s error-rate window, decides between deactivate /
  reenable / no-op, calls the agent, sends a Telegram alert.
- `mcps/feature-flags/src/http.ts` — HTTP wrapper bound to `0.0.0.0:7733`
  that the n8n tools call. It re-uses `DependencyGraph` from
  `@tradewitness/feature-flags-core` and forwards to the Next.js
  `/api/feature-flags` route with the shared bearer.

What is checked in:

- `wf1-manual-trigger.json`, `wf2-scheduled-monitor.json` — live state
  re-exported via n8n Public API, stripped to `name`/`nodes`/`connections`/`settings`.
- `simulate_wf1.py`, `simulate_wf2.py`.
- `screenshots/trace-wf1.png`, `screenshots/trace-wf2-toggle.png`,
  `screenshots/trace-tg.png` — execution screenshots.
- `screencast.mp4` — 2-minute end-to-end demo.
- `n8n-import-notes.md`, `docs/`, this file.

What is **not** checked in (gitignored): `.env.local`, `logs.json`,
`n8n-data/`, `__pycache__/`.

---

## End-to-end pipeline shape

```
[ Admin UI button ]
        |
        | (Next.js server action — adds X-API-Key)
        v
[ n8n Webhook ]
        |
        | (Switch: feature_id present? action ∈ allowed? traffic_percentage ∈ [0..100]?)
        v
   ┌────┴─────────────────────────┐
   |                              |
[ Respond 400 ]              [ AI Agent (gpt-4o-mini)
   rejected_at:               + Memory(sessionKey=feature_id)
   "input-validation" ]       + 3 HTTP Request Tools
                              |   - get_feature_info
                              |   - set_feature_state
                              |   - adjust_traffic_rollout
                              | ]
                              |
                              v
                         [ Respond 200 ]
                          (strips ```json fences before sending)
```

```
[ Schedule Trigger 60s ]
        |
        v
[ Read & Analyze Logs (Code) ]
        |
        v
[ Get Feature Status (HTTP → wrapper) ]
        |
        v
[ Merge Data (Set, NOT Code) ]
        |
        v
[ Decision (Switch) ]
   ├── DEACT: rate > 5% AND current_status != Disabled
   ├── REEN:  rate < 1% AND current_status == Disabled
   └── No-Op
        |
        v
[ Set Decision deactivate / reenable / NoOp ]
        |
        v
[ Monitor Agent (gpt-4o-mini, 2 tools, no memory) ]
        |
        v
[ Parse Agent Output (Set, indexOf/lastIndexOf JSON) ]
        |
        v
[ Send Alert (Telegram, chatId hardcoded 26462215) ]
```

---

## Defense in depth, on purpose

Both layers reject the same garbage independently — chosen so that the
agent never sees out-of-range input, *and* the wrapper still rejects it
if a future caller skips n8n.

- **Layer 1** — n8n `Switch` node before the agent: rejects missing
  `feature_id`, unknown `action`, `traffic_percentage` outside `[0..100]`.
  Verified by hallucination probe (screenshot `screenshots/trace-wf1.png`):
  the request was rejected with HTTP 400 and the agent did not run.
- **Layer 2** — `mcps/feature-flags/src/http.ts` re-validates against
  the M3 contract and reuses `DependencyGraph` so dependency-broken
  transitions also get blocked even if a caller bypassed the Switch.

> The agent itself is *never* the safety boundary. This was an explicit
> goal — algorithm-before-AI.

---

## Model swap

Final choice: **`openai/gpt-4o-mini`** via OpenRouter (~$0.15 per 1M
input tokens at the time of writing).

| Tried | Outcome | Why dropped |
|---|---|---|
| `google/gemma-4-26b-a4b-it:free` | model-not-found on OpenRouter | typo / unavailable |
| `meta-llama/llama-3.3-70b-instruct:free` | hit daily quota mid-test | free tier limits |
| `meta-llama/llama-3.3-70b-instruct` (paid) | functional, but flaky tool calls | inconsistent JSON |
| `google/gemini-2.0-flash-001` | **hallucinated tool calls** — returned `action_taken: "deactivated"` while never invoking `set_feature_state`. The feature on disk was unchanged. | unsafe |
| `openai/gpt-4o-mini` ✅ | every run we observed made the expected real tool calls (`get_feature_info` ×2, `set_feature_state` ×1) and the changes hit `features.json` on disk. | shipped |

Lesson: a Structured Output Parser sub-node is not enough; you can have
a syntactically perfect response describing actions that never
happened. The fix is choosing a model that uses tools, *and* always
verifying side effects (we re-`get_feature_info` after `set_feature_state`).

---

## Output parsing — why no Structured Output Parser

Earlier draft attached a Structured Output Parser to both agents. We
removed it:

- On Llama-3.3 it caused the agent to loop ("output did not match
  schema, retrying") until `maxIterations` was hit.
- On Gemini Flash and gpt-4o-mini it emitted JSON wrapped in
  ```` ```json … ``` ```` fences. The parser then either failed silently
  or stripped fields.

Replaced by:

- **WF1**: `Respond 200` body expression does a regex strip of code
  fences before sending. Content-Type is `application/json`.
- **WF2**: A dedicated `Parse Agent Output` Set node sits between the
  agent and the Telegram node. It does `indexOf('{')` to
  `lastIndexOf('}')`, then `JSON.parse`. We tried regex first — on some
  outputs it returned `null` and Telegram literally received the string
  `"null"`. The substring approach is dumber but never returns null.

---

## Code vs Set in WF2

`Merge Data` and `Parse Agent Output` were originally Code nodes. In
our compose setup they intermittently crashed the n8n task runner with
`InternalTaskRunnerDisconnectAnalyzer.toDisconnectError`. Both got
rewritten as **Set** nodes — they evaluate inside the main n8n process
and never crossed the runner boundary again. No functional change in
behaviour.

`Read & Analyze Logs` is still a Code node — it does file I/O and the
benefit of staying single-file outweighed the occasional restart cost.
`NODE_FUNCTION_ALLOW_BUILTIN: "fs"` is set in `docker-compose.yml` for
this reason.

---

## maxIterations

Both agents are configured with `maxIterations: 6`. With `3` we saw
the agent stop with `"Agent stopped due to max iterations."` after
two tool calls but before emitting the final JSON, which then
propagated to Telegram as `"null"`. 6 is comfortable headroom for the
2–3 tool calls we actually make.

---

## Telegram

- `chatId` is hardcoded (`26462215`) in the Telegram node parameters.
  `={{ $env.TELEGRAM_CHAT_ID }}` is rejected by n8n's default
  env-var policy and turning that policy off project-wide felt worse
  than the hardcoded chat id for a single-user demo.
- Bot token is in `homework/M5/.env.local` (gitignored). The token is
  passed only via the n8n Telegram credential, not as an env-var.
- `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` are documented in
  `docs/01-setup.md` so a clean clone reproduces it.

---

## Verification matrix

| Path | What it proves | Evidence |
|---|---|---|
| **WF1 happy path** (`check` button) | Server action → webhook → Switch passes → agent calls `get_feature_info` → Respond 200 returns the feature with `success:true` | `screenshots/trace-wf2-toggle.png` shows a Respond 200 with `feature_id`/`old_state`/`new_state` shape. (Yes, the filename is `wf2-toggle.png` — the screenshot is actually a clean WF1 success run; left as-is and called out here.) |
| **WF1 hallucination probe** (`traffic_percentage: 150`) | Switch blocks invalid input before the agent runs, HTTP 400 with `rejected_at: "input-validation"`. Cost = 0 tokens. | `screenshots/trace-wf1.png` |
| **WF2 deactivate cycle** (exec 78, ~17:00 UTC) | Cron sees `error_rate 5.4%` with `current_status: Testing`, takes the DEACT branch, agent really calls `set_feature_state(Disabled)`, disk file changes, Telegram receives 🚨 alert. | `screenshots/trace-wf2-toggle.png` for canvas; `features.json` `last_modified` jumped; Telegram message text: *"🚨 Feature search_v2 деактивована: error_rate 5.416666666666667% перевищив поріг 5%."* |
| **WF2 reenable cycle** | *(see "Open issues" below)* | not captured |
| **n8n → host networking** | n8n container reaches Next.js (`3001`) and the M3 wrapper (`7733`) through `host.docker.internal` | every successful agent run = proof |
| **Auth on `/api/feature-flags`** | `Unauthorized` without `x-api-key`; admin gate on `/private/admin/features` requires email in `ADMIN_EMAILS` | reproduced both during setup |

---

## Open issues / what didn't land

- **REEN branch not captured on the cycle screenshot.** The Switch
  condition for reenable is `error_rate < 1% AND current_status == Disabled`.
  `simulate_wf2.py` uses a sine with floor ≈ 0% but the 60s rolling
  average over the window never quite dipped below 1.6% in the watch
  window (six consecutive ticks: 1.7, 7.5, 1.6, 8.5, 2.2, 11.2). To
  force a green ✅ alert deterministically, stop the simulator and let
  the window age out — next tick sees rate=0 → REEN fires. Not done.
- **`features.json` left in `Disabled` state.** Drift is intentional —
  it's evidence of the WF2 deactivate cycle and reproduces if you re-run
  the demo. If you want a clean tree, set it back to `Testing` via the
  Auto-Pilot button (`check` then manually edit) or by reverting the
  file.
- **Screencast** — `homework/M5/screencast.mp4` (2:00, 30 MB).

---

## What I'd change if doing M5 again

1. Pick `openai/gpt-4o-mini` (or equivalently tool-disciplined paid
   model) **on day 1**. The free-tier debugging cost more time than the
   model cost would have over the whole assignment.
2. Use Set nodes from the start whenever the operation is pure data
   reshape — Code nodes only when you genuinely need stdlib or fs.
3. Sanity-check the Telegram send-message envelope (`chatId` semantics
   + env-var policy) before integrating, not at debug time.
4. Symmetric simulator: have `simulate_wf2.py` accept a `--profile
   {healthy,broken,recovery}` flag so REEN/DEACT branches can be
   forced for screencast/demo purposes without waiting on the sine
   curve to cooperate.

---

## Pointers

- `homework/M5/README.md` — assignment write-up.
- `homework/M5/docs/` — per-phase implementation notes (setup, WF1,
  WF2, troubleshooting).
- `homework/M5/n8n-import-notes.md` — exact UI steps for re-importing
  the workflow JSONs into a fresh n8n.
- `mcps/feature-flags/src/http.ts` — the HTTP wrapper the agents call.
- `apps/app/src/app/private/admin/features/auto-pilot.ts` — the
  Next.js server action behind the dashboard buttons.
