// M7 — PII detection + redaction. Presidio analyzer over HTTP, with a regex
// fallback for deterministic types, fail-closed everywhere. See §2.2, §4.5.
import "server-only";

import type { DetectedPiiSpan } from "@/drizzle/schema";
import { PRESIDIO_ANALYZER_URL, PRESIDIO_TIMEOUT_MS } from "./config";

export type RedactionStatus = "ok" | "fallback" | "unavailable";

export type RedactionResult = {
    redacted: string;
    spans: DetectedPiiSpan[];
    status: RedactionStatus;
    hasPii: boolean;
};

// Deterministic recognizers — work even when Presidio is down and catch
// email/phone/card that an EN-only Presidio might miss in ru/uk text.
const REGEX_RECOGNIZERS: { type: string; re: RegExp }[] = [
    { type: "EMAIL_ADDRESS", re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
    // International phone numbers incl. +380.../+7...
    { type: "PHONE_NUMBER", re: /(?:\+?\d[\d\s().-]{7,}\d)/g },
    // 13-19 digit card-like sequences (allow spaces/dashes).
    { type: "CREDIT_CARD", re: /\b(?:\d[ -]?){13,19}\b/g },
];

function regexSpans(text: string): DetectedPiiSpan[] {
    const spans: DetectedPiiSpan[] = [];
    for (const { type, re } of REGEX_RECOGNIZERS) {
        re.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
            const value = m[0];
            // Phone regex is greedy — ignore very short matches.
            if (type === "PHONE_NUMBER" && value.replace(/\D/g, "").length < 9)
                continue;
            spans.push({
                type,
                start: m.index,
                end: m.index + value.length,
                score: 1,
            });
        }
    }
    return spans;
}

function dedupeSpans(spans: DetectedPiiSpan[]): DetectedPiiSpan[] {
    const sorted = [...spans].sort((a, b) => a.start - b.start || b.end - a.end);
    const out: DetectedPiiSpan[] = [];
    for (const s of sorted) {
        const last = out[out.length - 1];
        if (last && s.start < last.end) {
            // overlapping — keep the wider/higher-score one
            if (s.end - s.start > last.end - last.start) out[out.length - 1] = s;
            continue;
        }
        out.push(s);
    }
    return out;
}

function applyRedaction(text: string, spans: DetectedPiiSpan[]): string {
    if (spans.length === 0) return text;
    const ordered = dedupeSpans(spans).sort((a, b) => a.start - b.start);
    let result = "";
    let cursor = 0;
    for (const s of ordered) {
        if (s.start < cursor) continue;
        result += text.slice(cursor, s.start) + `<${s.type}>`;
        cursor = s.end;
    }
    result += text.slice(cursor);
    return result;
}

async function callPresidio(
    text: string,
    language: string
): Promise<DetectedPiiSpan[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PRESIDIO_TIMEOUT_MS);
    try {
        const res = await fetch(`${PRESIDIO_ANALYZER_URL}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, language }),
            signal: controller.signal,
        });
        if (!res.ok) throw new Error(`presidio ${res.status}`);
        const data = (await res.json()) as Array<{
            entity_type: string;
            start: number;
            end: number;
            score: number;
        }>;
        return data.map((d) => ({
            type: d.entity_type,
            start: d.start,
            end: d.end,
            score: d.score,
        }));
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Detect + redact PII. Always returns a result (never throws):
 *  - status "ok"          → Presidio answered (spans merged with regex).
 *  - status "fallback"    → Presidio failed; only regex recognizers applied.
 * The caller MUST treat any non-"ok" status as "assume private" (fail-closed).
 */
export async function analyzeAndRedact(
    text: string,
    language = process.env.PRESIDIO_LANGUAGE ?? "en"
): Promise<RedactionResult> {
    if (!text || text.trim() === "") {
        return { redacted: text, spans: [], status: "ok", hasPii: false };
    }

    const regex = regexSpans(text);
    try {
        const presidio = await callPresidio(text, language);
        const spans = dedupeSpans([...presidio, ...regex]);
        return {
            redacted: applyRedaction(text, spans),
            spans,
            status: "ok",
            hasPii: spans.length > 0,
        };
    } catch {
        // Presidio unavailable — regex only. We can't be sure about names, so
        // the caller fails closed (treat as private) regardless of hasPii.
        const spans = dedupeSpans(regex);
        return {
            redacted: applyRedaction(text, spans),
            spans,
            status: "fallback",
            hasPii: spans.length > 0,
        };
    }
}
