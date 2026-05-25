# 04 — Python simulators

Two scripts, both driven by sine waves so transitions across thresholds
are visible in real time.

```
homework/M5/
├── simulate_wf1.py     # POSTs to WF1 webhook with mixed valid/invalid payloads
└── simulate_wf2.py     # writes sine-wave success/error events to logs.json
```

Both run on the host with `python3`. No virtual env needed — only stdlib
plus `requests` (for `simulate_wf1.py`).

```bash
pip install requests
```

---

## A. `simulate_wf1.py` — WF1 dispatcher

### Purpose
- Smoke-test WF1 after wiring.
- Generate predictable activity for the screencast.
- Probe the hallucination guard (`--include-invalid`).

### CLI

```
python3 simulate_wf1.py
  --webhook-url   <required>   e.g. http://localhost:5678/webhook/feature-control
  --api-key       <from env>   X-API-Key value, defaults to env N8N_WEBHOOK_API_KEY
  --feature-id    search_v2    target feature
  --duration      120          seconds
  --interval      10           seconds between requests
  --include-invalid            inject traffic_percentage=-50 every 7th request
```

### Behaviour
- Rotates through actions: `check`, `test`, `rollout`, `check`, `rollback`, `check`.
- `traffic_percentage` for rollout is `int(50 + 40 * sin(2π·t / 60))` — sweeps 10..90.
- With `--include-invalid`, every 7th iteration sends `{ action: "rollout", traffic_percentage: -50 }`. WF1's Switch should reject these.
- Logs each request and the parsed response (status, success, message) to stdout.

### Run

```bash
set -a; . homework/M5/.env.local; set +a
python3 homework/M5/simulate_wf1.py \
  --webhook-url "http://localhost:5678/webhook/feature-control" \
  --duration 120 --interval 10 --include-invalid
```

### Where the spec lives
The full reference implementation is in the assignment text (M5 §A.6).
Match that exactly except for two changes:
1. Default `--feature-id` is whatever exists in `data/feature-flags/features.json` for testing — `search_v2` if present.
2. `--api-key` defaults to env `N8N_WEBHOOK_API_KEY` instead of just `N8N_API_KEY` (rename for consistency with `.env.local`).

---

## B. `simulate_wf2.py` — log generator

### Purpose
- Continuously write success/error events with a sine-wave error rate.
- Force WF2 to cycle through deactivate ↔ re-enable so the Telegram log
  shows the full loop.

### CLI

```
python3 simulate_wf2.py
  --output      logs.json
  --feature-id  search_v2
  --duration    1800        seconds (30 min)
  --rps         5           events per second
  --period      300         sine period (s) — full cycle (one toggle pair)
  --amplitude   0.10        sine amplitude
  --baseline    0.05        baseline error_rate
```

### Behaviour
- At time `t`, the instantaneous error rate is
  `max(0, baseline + amplitude * sin(2π·t / period))`.
  With defaults: range ≈ 0%..15%, threshold 5% → toggle every ~150 s.
- Each tick: roll a uniform, mark event `error` if under the rate else `success`.
- Append to `output` (truncate to last 10 000 events to bound disk).
- Stdout: one summary line every ~5 s with current rate / total events.

### Run

```bash
# Real run (30 min, 5 min period) — matches assignment's defaults
python3 homework/M5/simulate_wf2.py --output homework/M5/logs.json

# Quick demo (10 min, 2 min period) — fast cycles for the screencast
python3 homework/M5/simulate_wf2.py --output homework/M5/logs.json \
  --duration 600 --period 120
```

### File path coordination
The simulator writes to a host path. n8n reads from inside its container.
Set up the docker mount per docs/01-setup §1.1:

```
host:      ./homework/M5/logs.json
container: /data/m5/logs.json
```

WF2's Code node reads from `/data/m5/logs.json` (docs/03 §C.2).

### Where the spec lives
Full reference implementation in the assignment text (M5 §B.2). Match it
verbatim. The only project-specific tweak is the default `--output` —
keep it as `logs.json` and run the script from the repo root with
`--output homework/M5/logs.json` to keep the file at the expected path.
