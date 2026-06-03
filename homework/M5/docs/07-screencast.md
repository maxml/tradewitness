# 07 — Screencast (how to record 3–5 minute demo)

Required: a 3–5 minute video that shows the full M3 + M4 + M5 loop
working end-to-end. The grader watches this to confirm the system is
real and not just JSON in a folder.

---

## A. Pick a recorder

You're on Linux (Ubuntu, kernel 6.8). Three solid choices, pick one:

| Tool | Pros | Cons | Install |
|---|---|---|---|
| **OBS Studio** | full control, splits screen + webcam + audio, MP4 out of the box | overkill for 5 min | `sudo apt install obs-studio` or Flathub `flatpak install flathub com.obsproject.Studio` |
| **Kazam** | simplest, point-and-shoot, captures area / window | older project, no webcam overlay | `sudo apt install kazam` |
| **SimpleScreenRecorder** | reliable, low CPU, good for tighter region capture | UI looks dated | `sudo apt install simplescreenrecorder` |

If you want the absolute minimum: install OBS, do one "Auto-Configuration
Wizard" run, hit Start Recording.

### Audio
- Plug in a headset mic if you have one — laptop mics on this kernel
  pick up fan noise hard.
- In OBS: Settings → Audio → Mic/Aux = your headset, Desktop Audio =
  Default (so the Telegram notification sound is audible).
- Test 10 seconds first. Loud Telegram pop is good for the demo: it
  proves the alert actually fired.

### Resolution / file size
- Record at **1080p**, 30 fps, MP4 (H.264), bitrate ~6000 kbps.
- 5 min × 6 Mbps ≈ 225 MB. Too big for GitHub (100 MB limit) but fine
  for Loom / YouTube unlisted / Telegram (2 GB limit).
- If you need to trim or compress: `ffmpeg -i in.mp4 -vcodec libx264
  -crf 28 -preset slow out.mp4` (CRF 28 ≈ 70 MB for 5 min @ 1080p).

---

## B. Pre-recording checklist

Set this up before you hit record. Half the bad screencasts are the
ones where the demo half-works on camera.

- [ ] From repo root: `docker compose --env-file homework/M5/.env.local up -d` — n8n running.
- [ ] `curl http://localhost:5678/healthz` → ok.
- [ ] WF1 and WF2 both active (toggle on in the n8n UI).
- [ ] AI Agent nodes have `Verbose` + `Return Intermediate Steps` on
      (you want the reasoning visible in the trace).
- [ ] Next.js app running (`pnpm dev` or whatever the project uses),
      logged in as admin on `/private/admin/features`.
- [ ] `simulate_wf1.py` and `simulate_wf2.py` work — do a 30 s dry run
      of each, confirm WF1 returns 200 and WF2 writes events.
- [ ] Telegram chat open in a visible window. Latest messages cleared
      (so the alerts you record are the only ones on screen).
- [ ] Browser DevTools closed, notifications silenced (Slack, mail, etc.)
- [ ] Two terminals open: one for simulators, one for `docker compose --env-file homework/M5/.env.local logs -f n8n`.
- [ ] Window layout: split screen with browser (dashboard + n8n + Telegram)
      on the left, terminals on the right.

---

## C. Script (target 4 minutes)

Read this once, then record without reading. Bullet points, not a
teleprompter — keeps the pace natural.

### 00:00 — 00:30 — context (10–15 s)
- One sentence: "This is M5 — manual trigger from the dashboard plus a
  scheduled monitor, both driving feature flags through M3 MCP."
- Show the dashboard at `/private/admin/features`, point at the Auto-Pilot
  Controls panel.

### 00:30 — 01:30 — WF1 happy path
- Click **Тестовий режим** on a flag that's currently Disabled.
- Switch tabs to the n8n executions view, point at the trace:
  Webhook → Switch (fallback) → AI Agent → Respond. Hover the AI
  Agent step to show tool calls (get_feature_info → set_feature_state →
  get_feature_info).
- Switch back to the dashboard — badge has updated to Testing, alert
  shows the agent's message in Ukrainian.

### 01:30 — 02:00 — WF1 hallucination test
- Run the curl from `docs/05-hallucination-test.md` in a terminal.
- Response: `success: false, rejected_at: "input-validation"`.
- Show the n8n trace for that execution: stops at Switch → Respond 400,
  no AI Agent step. Say one sentence: "the guard fires before any LLM
  tokens are spent."

### 02:00 — 02:20 — simulators
- In terminal A: `python3 simulate_wf1.py --include-invalid --duration 60 --interval 5`.
  Let 2–3 iterations run on camera, then Ctrl-C. Show one valid 200 and
  one invalid 400 line.
- In terminal B: `python3 simulate_wf2.py --duration 600 --period 120 &`
  (background). Show the first few stdout summary lines proving error
  rate is moving.

### 02:20 — 03:30 — WF2 full cycle
- Switch to n8n executions, filter by WF2. Watch one fire on camera.
- Open Telegram chat. Wait — within ~60 s of error rate crossing 5 %,
  a 🚨 deactivated message arrives. Read it on camera.
- Switch back to dashboard, show that the flag's badge is now Disabled.
- Stay on it. Within another 60–90 s, the next message arrives: ✅
  reenabled. Dashboard badge flips back to Enabled.

> If the cycle won't cooperate during the take, you can pre-run the
> simulator for 5 minutes off-camera so the next toggle is imminent, then
> hit record. Don't fake the messages — just time the recording.

### 03:30 — 04:00 — wrap
- Show `homework/M5/` folder contents in a terminal: workflows JSON,
  simulators, logs.json, this docs/ folder.
- One sentence: "Defense lives in code — Switch in n8n plus JSON schema
  on the MCP — not in the system prompt."
- Cut.

---

## D. Editing (optional)

The grader doesn't care about pretty cuts. Things worth doing if you
have time:

- Trim dead air at the start/end (`ffmpeg -ss 00:00:03 -to 00:04:12 -c copy out.mp4`).
- Add a 5 s title card showing your name + date (any video editor;
  Kdenlive is free on Linux).
- If audio is bad, re-record voiceover in Audacity, mute the video's
  original track, overlay the new one.

Don't add background music. Don't add fancy transitions. Plain demo > polished noise.

---

## E. Hosting

| Option | Limit | Privacy | Notes |
|---|---|---|---|
| **Loom** | 25 videos, 5 min each on free tier | unlisted | best fit for this size |
| **YouTube unlisted** | none | unlisted = anyone with link | upload, set unlisted, paste link in README |
| **Telegram saved messages** | 2 GB / file | private | send to yourself, copy the t.me link |
| **GitHub** in PR | 100 MB / file | repo-visible | only works if you compressed below 100 MB |

Pick whichever you'll actually use. Loom is the simplest.

Put the link in the final `homework/M5/README.md` under a `## Screencast`
heading. If hosted in-repo as `screencast.mp4`, link it as a relative path.

---

## F. Failure modes (so you don't waste a take)

| Symptom | Cause | Fix |
|---|---|---|
| No Telegram message | Telegram credential not tested in n8n, or chat_id wrong | n8n UI → Credentials → Telegram → Test |
| WF2 fires but Telegram silent on fallback minute (intended) | logs in-threshold — agent action_taken=no_op | not a bug, mention this in voiceover |
| WF1 returns 500 with no body | AI Agent's Chat Model credential missing or out of quota | switch model, re-test |
| Dashboard doesn't update after WF1 success | server action didn't pass `current_state` to client | check the action's return shape vs `<AutoPilotControls>` props |
| WF2 fires but does nothing | Switch's `current_status` is `undefined` — MCP response path doesn't match Merge Data code | inspect Merge Data output in n8n trace, adjust the `??` fallback |

If any of these show up live, stop the take, fix off-camera, retry.
