// M7 — the sensitivity router. Deterministic, visible in code (not hidden in
// config). Two-dimensional: PII in text AND whether the request needs
// user-owned data. Order is fixed; first match wins. See homework/M7/PLAN.md §2.2.
import "server-only";

import type { RedactionResult } from "./presidio";

export type RouteTarget = "local" | "cloud";
export type RouteMode = "default" | "sanitized-aggregates";

export type RouteDecision = {
    target: RouteTarget;
    reason: string;
    mode: RouteMode;
};

// Triggers that mean "this needs the user's own data" → local (or aggregate).
const USER_DATA_TRIGGERS: RegExp[] = [
    /\bмо(й|я|и|е|их|ём|его|ей|ю|им)\b/i, // ru: мой/моя/мои/мое/моих...
    /\bмі(й|я)\b/i, // uk: мій/мія
    /\bмо(ї|їх|го|єму)\b/i, // uk: мої/моїх...
    /\bу меня\b/i,
    /\bу мене\b/i,
    /(капитал|капітал|депозит)/i,
    /(заметк|нотатк|журнал|journal)/i,
    /(сделк|трейд|trade|позици|позиці)/i,
    /(стратеги|стратегі|strateg)/i,
    /(профиль|профіль|profile)/i,
    /(win[\s-]?rate|винрейт|винрэйт|вінрейт)/i,
    /\bmy\b/i,
];

// Explicit public-intent allowlist — generic/educational questions only.
const PUBLIC_INTENT_ALLOWLIST: RegExp[] = [
    /(что такое|що таке|what is|what are|what'?s)/i,
    /(как посчитать|как считается|как работает|як порахувати|як працює|how to|how do|how does)/i,
    /(объясни|поясни|explain|define|расскажи про|розкажи про)/i,
    /(почему|чому|why)\b/i,
    /(пример|приклад|example) of/i,
];

export type Intent = {
    needsUserData: boolean;
    isPublic: boolean;
};

export function detectIntent(message: string): Intent {
    const needsUserData = USER_DATA_TRIGGERS.some((re) => re.test(message));
    const isPublic = PUBLIC_INTENT_ALLOWLIST.some((re) => re.test(message));
    return { needsUserData, isPublic };
}

/**
 * Decide the route. `messageRedaction` is the result of analyzing the *current
 * message text* with Presidio (§2.2). Fail-closed: anything uncertain → local.
 */
export function route(
    message: string,
    messageRedaction: RedactionResult,
    intent: Intent = detectIntent(message)
): RouteDecision {
    // 1. PII detector couldn't run → we can't be sure → local (fail-closed).
    if (messageRedaction.status !== "ok") {
        return {
            target: "local",
            reason: "pii-detector-unavailable (fail-closed)",
            mode: "default",
        };
    }

    // 2. PII present in the message text → local.
    if (messageRedaction.hasPii) {
        const types = [...new Set(messageRedaction.spans.map((s) => s.type))];
        return {
            target: "local",
            reason: `pii-in-message: ${types.join(", ")}`,
            mode: "default",
        };
    }

    // 3. Needs user-owned data → local (tool output would leak to cloud).
    //    sanitized-aggregates is documented-only in DZ1 → still local.
    if (intent.needsUserData) {
        return {
            target: "local",
            reason: "requires user-owned data",
            mode: "default",
        };
    }

    // 4. Explicit public intent → cloud (frontier quality, no leak).
    if (intent.isPublic) {
        return {
            target: "cloud",
            reason: "public-intent allowlist",
            mode: "default",
        };
    }

    // 5. Ambiguous → local (cloud is never a fallback).
    return {
        target: "local",
        reason: "ambiguous (default local)",
        mode: "default",
    };
}
