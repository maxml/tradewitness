#!/usr/bin/env python3
"""
simulate_wf1.py — dispatcher for the M5 WF1 (manual trigger) workflow.

Posts to the n8n webhook /feature-control on a fixed cadence, rotating
through the supported actions (check, test, rollout, rollback). The
traffic_percentage for rollout follows a sine wave so the agent has to
handle the full 0..100 range across runs.

With --include-invalid, every 7th request becomes a deliberate violation
(traffic_percentage = -50). The Switch node in WF1 should reject it
before the AI Agent runs.

Usage (from repo root):
    set -a; . homework/M5/.env.local; set +a
    python3 homework/M5/simulate_wf1.py \\
        --webhook-url "http://localhost:5678/webhook/feature-control" \\
        --duration 120 --interval 10 --include-invalid
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
import time
from datetime import datetime

import requests


ACTIONS_CYCLE = ["check", "test", "rollout", "check", "rollback", "check"]


def build_payload(feature_id: str, action: str, traffic_percentage: int) -> dict:
    payload: dict = {"feature_id": feature_id, "action": action}
    if action == "rollout":
        payload["traffic_percentage"] = traffic_percentage
    elif action == "test":
        payload["target_state"] = "Testing"
    elif action == "rollback":
        payload["target_state"] = "Disabled"
    return payload


def run(
    webhook_url: str,
    api_key: str,
    feature_id: str,
    duration: float,
    interval: float,
    include_invalid: bool,
) -> None:
    start = time.time()
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": api_key,
    }
    iteration = 0

    while time.time() - start < duration:
        elapsed = time.time() - start
        traffic_percentage = int(50 + 40 * math.sin(2 * math.pi * elapsed / 60))
        action = ACTIONS_CYCLE[iteration % len(ACTIONS_CYCLE)]
        payload = build_payload(feature_id, action, traffic_percentage)

        is_invalid_probe = include_invalid and iteration > 0 and iteration % 7 == 0
        if is_invalid_probe:
            payload = {"feature_id": feature_id, "action": "rollout", "traffic_percentage": -50}
            label = "INVALID probe"
        else:
            label = f"action={action}"

        ts = datetime.now().isoformat(timespec="seconds")
        print(f"[{ts}] {label} payload={json.dumps(payload, ensure_ascii=False)}")

        try:
            response = requests.post(webhook_url, headers=headers, json=payload, timeout=30)
            content_type = response.headers.get("content-type", "")
            data = response.json() if content_type.startswith("application/json") else {"raw": response.text}
            print(
                f"  → status={response.status_code} "
                f"success={data.get('success')} "
                f"rejected_at={data.get('rejected_at')} "
                f"message={data.get('message')}"
            )
        except requests.exceptions.RequestException as exc:
            print(f"  → network error: {exc}", file=sys.stderr)

        iteration += 1
        time.sleep(interval)


def main() -> None:
    parser = argparse.ArgumentParser(description="WF1 dispatcher simulator")
    parser.add_argument("--webhook-url", required=True, help="Full URL of /feature-control webhook")
    parser.add_argument(
        "--api-key",
        default=os.environ.get("N8N_WEBHOOK_API_KEY", ""),
        help="X-API-Key header value (defaults to env N8N_WEBHOOK_API_KEY)",
    )
    parser.add_argument("--feature-id", default="search_v2", help="Target feature_id (default: search_v2)")
    parser.add_argument("--duration", type=float, default=120, help="Run for N seconds (default: 120)")
    parser.add_argument("--interval", type=float, default=10, help="Seconds between requests (default: 10)")
    parser.add_argument(
        "--include-invalid",
        action="store_true",
        help="Send a deliberate violation (traffic_percentage=-50) every 7th request",
    )
    args = parser.parse_args()

    if not args.api_key:
        sys.exit("X-API-Key not provided: pass --api-key or set env N8N_WEBHOOK_API_KEY")

    print(f"simulate_wf1.py — duration={args.duration}s, interval={args.interval}s")
    print(f"webhook: {args.webhook_url}")
    print(f"feature: {args.feature_id}, include_invalid={args.include_invalid}")
    print("---")

    run(
        webhook_url=args.webhook_url,
        api_key=args.api_key,
        feature_id=args.feature_id,
        duration=args.duration,
        interval=args.interval,
        include_invalid=args.include_invalid,
    )

    print("---\ndone.")


if __name__ == "__main__":
    main()
