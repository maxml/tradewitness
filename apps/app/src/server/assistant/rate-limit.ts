// M7 — in-memory per-user rate limit. Fine for homework/demo; in Next
// dev/serverless this state can reset or duplicate across instances, so prod
// would need a DB/Redis-backed limiter. See homework/M7/PLAN.md §4.2.
import "server-only";

import { ASSISTANT_RATE_LIMIT_PER_MIN } from "./config";

const WINDOW_MS = 60_000;

const globalForRl = globalThis as unknown as {
    assistantHits: Map<string, number[]> | undefined;
};
const hits = globalForRl.assistantHits ?? new Map<string, number[]>();
globalForRl.assistantHits = hits;

export function checkRateLimit(userId: string, now = Date.now()): boolean {
    const windowStart = now - WINDOW_MS;
    const recent = (hits.get(userId) ?? []).filter((t) => t > windowStart);
    if (recent.length >= ASSISTANT_RATE_LIMIT_PER_MIN) {
        hits.set(userId, recent);
        return false;
    }
    recent.push(now);
    hits.set(userId, recent);
    return true;
}
