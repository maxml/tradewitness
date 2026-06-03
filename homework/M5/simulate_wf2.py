#!/usr/bin/env python3
"""
simulate_wf2.py — log generator with a sine-wave error rate.

Continuously writes success / error events to ``logs.json``. The
instantaneous error rate follows a sine curve so the WF2 cron monitor
sees the rate cross the 5 % deactivate threshold and the 1 % re-enable
threshold repeatedly, demonstrating the full auto-toggle cycle.

File format: a SINGLE valid JSON array, not JSONL — WF2's Code node
parses the whole file with JSON.parse on every tick. The file is
truncated to the last 10 000 events so disk usage stays bounded.

Usage (from repo root):
    python3 homework/M5/simulate_wf2.py \\
        --output homework/M5/logs.json \\
        --duration 600 --period 120
"""

from __future__ import annotations

import argparse
import json
import math
import random
import sys
import time
from datetime import datetime, timezone
from pathlib import Path


MAX_RETAINED_EVENTS = 10_000


def sine_error_rate(t: float, period: float, amplitude: float, baseline: float) -> float:
    raw = baseline + amplitude * math.sin(2 * math.pi * t / period)
    return max(0.0, min(1.0, raw))


def append_event(output_path: Path, event: dict) -> int:
    try:
        existing = json.loads(output_path.read_text())
        if not isinstance(existing, list):
            existing = []
    except (FileNotFoundError, json.JSONDecodeError):
        existing = []
    existing.append(event)
    if len(existing) > MAX_RETAINED_EVENTS:
        existing = existing[-MAX_RETAINED_EVENTS:]
    output_path.write_text(json.dumps(existing, ensure_ascii=False))
    return len(existing)


def run(
    output_path: Path,
    feature_id: str,
    duration: float,
    rps: float,
    period: float,
    amplitude: float,
    baseline: float,
) -> None:
    if not output_path.exists():
        output_path.write_text("[]")

    start = time.time()
    interval = 1.0 / rps
    last_log = -5.0  # force first stdout line on tick 0

    while time.time() - start < duration:
        elapsed = time.time() - start
        rate = sine_error_rate(elapsed, period, amplitude, baseline)
        status = "error" if random.random() < rate else "success"
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "feature_id": feature_id,
            "status": status,
            "error_rate_now": round(rate, 3),
        }
        total = append_event(output_path, event)

        if elapsed - last_log >= 5:
            print(f"t={int(elapsed):4d}s rate={rate:.1%} last={status} total_events={total}")
            last_log = elapsed

        time.sleep(interval)


def main() -> None:
    parser = argparse.ArgumentParser(description="WF2 log generator (sine error rate)")
    parser.add_argument("--output", default="homework/M5/logs.json", help="Path to logs.json")
    parser.add_argument("--feature-id", default="search_v2")
    parser.add_argument("--duration", type=float, default=1800, help="Seconds (default: 1800 = 30 min)")
    parser.add_argument("--rps", type=float, default=5, help="Events per second (default: 5)")
    parser.add_argument("--period", type=float, default=300, help="Sine period in seconds (default: 300)")
    parser.add_argument("--amplitude", type=float, default=0.10, help="Sine amplitude (default: 0.10)")
    parser.add_argument("--baseline", type=float, default=0.05, help="Sine baseline error_rate (default: 0.05)")
    args = parser.parse_args()

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    rate_lo = max(0.0, args.baseline - args.amplitude)
    rate_hi = min(1.0, args.baseline + args.amplitude)
    print(f"simulate_wf2.py — duration={args.duration}s, rps={args.rps}, period={args.period}s")
    print(f"sine: baseline={args.baseline:.1%}, amplitude={args.amplitude:.1%} → range [{rate_lo:.1%}; {rate_hi:.1%}]")
    print(f"deactivate threshold 5%, re-enable threshold 1% → toggle approx every {args.period / 2:.0f}s")
    print(f"output: {output_path}")
    print("---")

    try:
        run(
            output_path=output_path,
            feature_id=args.feature_id,
            duration=args.duration,
            rps=args.rps,
            period=args.period,
            amplitude=args.amplitude,
            baseline=args.baseline,
        )
    except KeyboardInterrupt:
        print("\ninterrupted by user", file=sys.stderr)


if __name__ == "__main__":
    main()
