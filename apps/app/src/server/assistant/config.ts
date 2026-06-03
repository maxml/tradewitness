// M7 assistant — central config + env reading. See homework/M7/PLAN.md §7.1.
import "server-only";

export const CLAUDE_MODEL =
    process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5-20250929";

export const OLLAMA_BASE_URL =
    process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1";

export const OLLAMA_MODEL =
    process.env.OLLAMA_MODEL ?? "qwen2.5:3b-instruct-q5_K_M";

export const PRESIDIO_ANALYZER_URL =
    process.env.PRESIDIO_ANALYZER_URL ?? "http://localhost:5002";

export const CHAT_LOGS_RETENTION_DAYS = Number(
    process.env.CHAT_LOGS_RETENTION_DAYS ?? "30"
);

// Input / agent-loop limits (§4.2, §4.3).
export const ASSISTANT_MAX_MESSAGE_CHARS = Number(
    process.env.ASSISTANT_MAX_MESSAGE_CHARS ?? "4000"
);
export const ASSISTANT_MAX_HISTORY_TURNS = Number(
    process.env.ASSISTANT_MAX_HISTORY ?? "20"
);
export const ASSISTANT_RATE_LIMIT_PER_MIN = Number(
    process.env.ASSISTANT_RATE_LIMIT_PER_MIN ?? "20"
);
export const ASSISTANT_MAX_TOOL_CALLS = 5;
export const ASSISTANT_TURN_TIMEOUT_MS = 60_000;
export const ASSISTANT_TOOL_TIMEOUT_MS = 15_000;
export const PRESIDIO_TIMEOUT_MS = 2_000;

/**
 * Hard guarantee that the "local" leg is actually local — the whole point of
 * routing private data to Ollama is that data never leaves the perimeter. A
 * remote OLLAMA_BASE_URL would silently turn the local leg into a cloud leak.
 * See homework/M7/PLAN.md §7.1.
 */
const PRIVATE_HOST_ALLOWLIST = new Set(
    (process.env.OLLAMA_PRIVATE_HOST_ALLOWLIST ?? "")
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean)
);

export function assertLocalOllamaUrl(rawUrl: string = OLLAMA_BASE_URL): void {
    let host: string;
    try {
        host = new URL(rawUrl).hostname.toLowerCase();
    } catch {
        throw new Error(`OLLAMA_BASE_URL is not a valid URL: ${rawUrl}`);
    }

    const isLoopback =
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "::1" ||
        host === "[::1]" ||
        // RFC1918 private ranges, acceptable for an on-prem private host.
        /^10\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host);

    if (isLoopback || PRIVATE_HOST_ALLOWLIST.has(host)) return;

    throw new Error(
        `OLLAMA_BASE_URL must point to a local/private host (got "${host}"). ` +
            `Routing private data to a remote model would break the privacy guarantee. ` +
            `Add it to OLLAMA_PRIVATE_HOST_ALLOWLIST only if you are certain it is private.`
    );
}
