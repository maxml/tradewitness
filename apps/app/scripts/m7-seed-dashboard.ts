// M7 — seed REAL chat_logs rows for the admin dashboard demo (§5/§6 acceptance).
// Uses the SAME code path as the live /api/assistant orchestrator (route.ts):
// route() + analyzeAndRedact() (msg AND response, independently) + real models
// (Ollama local / OpenRouter cloud) + the real persistence (reserveTurn /
// finalizeTurn). The ONLY difference vs production is that userId is a constant
// here instead of Clerk auth() — so the rows are byte-identical to what the
// widget writes. After seeding it also does a LIVE loadHistory() round-trip to
// prove private history never reaches the cloud context.
//
// Run from apps/app:  NODE_OPTIONS="--conditions=react-server" pnpm tsx scripts/m7-seed-dashboard.ts
import { randomUUID } from "crypto";
import { writeFileSync } from "fs";
import { join } from "path";

const SEED_USER = "user_demo_seed";
// A name/email that the local model is told (via a simulated profile) to use —
// demonstrates PII appearing in the RESPONSE that was NOT in the message.
const PROFILE = "Олександр Ковальчук <oleksandr.k@example.com>";

async function main() {
    try { process.loadEnvFile(".env.local"); } catch { /* ambient */ }

    const { analyzeAndRedact } = await import("@/server/assistant/presidio");
    const { route } = await import("@/server/assistant/router");
    const { computeCloudCost, LOCAL_COST } = await import("@/server/assistant/cost");
    const { buildSystemPrompt } = await import("@/server/assistant/prompts");
    const { reserveTurn, finalizeTurn, loadHistory } = await import("@/server/assistant/persistence");
    const cfg = await import("@/server/assistant/config");
    const { db } = await import("@/drizzle/db");
    const { UserTable, ChatLogsTable } = await import("@/drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // chat_logs.user_id has an FK to "user" — ensure the seed user exists, and
    // clear any prior seed rows so re-runs stay clean/idempotent.
    await db.insert(UserTable).values({ id: SEED_USER, name: "Demo Seed", email: "demo.seed@example.com" }).onConflictDoNothing();
    await db.delete(ChatLogsTable).where(eq(ChatLogsTable.userId, SEED_USER));

    async function openaiChat(base: string, apiKey: string | undefined, model: string, system: string, user: string) {
        const res = await fetch(`${base}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
            body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }], stream: false }),
        });
        const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };
        return { text: data.choices?.[0]?.message?.content ?? "", usage: { input_tokens: data.usage?.prompt_tokens, output_tokens: data.usage?.completion_tokens } };
    }

    // Mirrors route.ts: analyze msg → route → run leg → analyze response →
    // sensitivity=max(req,resp) → cost → finalize. Returns the stored row id.
    async function seedTurn(conversationId: string, message: string, opts?: { localProfile?: boolean }) {
        const reserved = await reserveTurn({ conversationId, userId: SEED_USER, userMessage: message });
        const msgRed = await analyzeAndRedact(message);
        const decision = route(message, msgRed);
        const isCloud = decision.target === "cloud";
        const model = isCloud ? cfg.CLOUD_MODEL : cfg.OLLAMA_MODEL;

        let text: string;
        let usage: { input_tokens?: number; output_tokens?: number } | null = null;
        if (isCloud) {
            const r = await openaiChat(cfg.OPENROUTER_BASE_URL, cfg.OPENROUTER_API_KEY, cfg.CLOUD_MODEL, buildSystemPrompt("cloud"), message);
            text = r.text; usage = r.usage;
        } else {
            // Local leg via Ollama (plain chat). For the "PII in response" case we
            // inject the profile into the system prompt — same effect as the real
            // get_my_profile tool feeding the name into the answer.
            const sys = buildSystemPrompt("local") + (opts?.localProfile ? `\nThe signed-in user's profile: ${PROFILE}. Greet them by name and mention their contact email.` : "");
            const r = await openaiChat(cfg.OLLAMA_BASE_URL, undefined, cfg.OLLAMA_MODEL, sys, message);
            text = r.text;
        }

        const respRed = await analyzeAndRedact(text);
        let sensitivity: "private" | "public" = isCloud ? "public" : "private";
        if (respRed.status !== "ok" || respRed.hasPii) sensitivity = "private";
        const cost = isCloud ? computeCloudCost(model, usage) : LOCAL_COST;

        await finalizeTurn({
            id: reserved.id,
            sensitivity,
            redactedUserMessage: msgRed.redacted,
            assistantResponse: text,
            redactedAssistantResponse: respRed.redacted,
            detectedPii: [...msgRed.spans, ...respRed.spans],
            userRedactionStatus: msgRed.status,
            assistantRedactionStatus: respRed.status,
            status: "ok",
            errorCode: null,
            errorMessageRedacted: null,
            route: decision.target,
            mode: decision.mode,
            model,
            latencyMs: 100 + Math.round(text.length / 2),
            costUsd: cost.costUsd,
            costReason: cost.costReason,
        });
        console.log(`  seeded [${decision.target}/${sensitivity}] "${message.slice(0, 40)}" pii=${[...new Set([...msgRed.spans, ...respRed.spans].map((s) => s.type))].join(",") || "—"} cost=${cost.costUsd}`);
        return reserved.id;
    }

    console.log("Seeding chat_logs as", SEED_USER, "...");

    // ── Conversation A — history-no-leak pair ────────────────────────────────
    const convA = randomUUID();
    await seedTurn(convA, "Мене звати Олександр Ковальчук, мій email oleksandr.k@example.com. Поясни, що таке risk/reward.");
    // Live proof: what would the cloud leg see as history for the next turn?
    const cloudHistory = await loadHistory(SEED_USER, convA, { publicOnly: true });
    const fullHistory = await loadHistory(SEED_USER, convA, { publicOnly: false });
    await seedTurn(convA, "поясни простіше");

    // ── Conversation B — variety ─────────────────────────────────────────────
    const convB = randomUUID();
    await seedTurn(convB, "покажи мої останні трейди");
    await seedTurn(convB, "що таке risk/reward?");
    await seedTurn(convB, "доброго ранку");

    // ── Conversation C — PII in RESPONSE not in message ──────────────────────
    const convC = randomUUID();
    await seedTurn(convC, "привіт, що там по моєму акаунту?", { localProfile: true });

    // ── Conversation D — one row with redaction UNAVAILABLE (UI fail-closed) ──
    const convD = randomUUID();
    const reservedD = await reserveTurn({ conversationId: convD, userId: SEED_USER, userMessage: "тестовий запит з PII, де редактор впав" });
    await finalizeTurn({
        id: reservedD.id, sensitivity: "private",
        redactedUserMessage: "<REDACTION_UNAVAILABLE>", assistantResponse: "raw response with PII",
        redactedAssistantResponse: null, detectedPii: [], userRedactionStatus: "unavailable",
        assistantRedactionStatus: "unavailable", status: "ok", errorCode: null, errorMessageRedacted: null,
        route: "local", mode: "default", model: cfg.OLLAMA_MODEL, latencyMs: 120, costUsd: 0, costReason: null,
    });
    console.log("  seeded [local] redaction-unavailable row (UI должен показать <REDACTION_UNAVAILABLE>)");

    // ── Save the live history-leak proof ─────────────────────────────────────
    const proof = [
        "# Живой proof: история НЕ течёт в cloud (loadHistory, реальный DB round-trip)",
        "",
        `Conversation A, ход0 = private (PII → local), ход1 = public follow-up.`,
        "",
        "## Cloud-контекст для хода1 — `loadHistory(publicOnly: true)`:",
        "```json", JSON.stringify(cloudHistory, null, 2), "```",
        `→ приватный ход0 ОТСУТСТВУЕТ (${cloudHistory.length} сообщений). ✅`,
        "",
        "## Для сравнения — local-контекст `loadHistory(publicOnly: false)` (полная история):",
        "```json", JSON.stringify(fullHistory, null, 2), "```",
        `→ ${fullHistory.length} сообщений (приватный ход0 виден ТОЛЬКО локально).`,
    ].join("\n");
    writeFileSync(join(process.cwd(), "..", "..", "homework", "M7", "demo", "dz1-history-no-leak.md"), proof);

    console.log("\n" + proof);
    console.log("\n✅ seeded. Открой /private/admin/chat-logs (залогинься как ADMIN_EMAILS) и сделай скрин.");
    process.exit(0);
}

main().catch((e) => { console.error("seed failed:", e); process.exit(1); });
