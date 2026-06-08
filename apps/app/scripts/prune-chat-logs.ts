// M7 — delete chat_logs older than CHAT_LOGS_RETENTION_DAYS. The env var alone
// prunes nothing; this script is the actual mechanism. See homework/M7/PLAN.md §4.5.
//
// Run from apps/app:  pnpm db:prune-chat-logs
// (loads apps/app/.env.local for DATABASE_URL; safe to schedule via cron.)
//
// NOTE: env MUST be loaded before "@/drizzle/db" is imported, because that
// module creates the postgres client at import time from process.env. Hence
// the dynamic imports below — do not hoist them to static top-level imports.

async function main() {
    // Node >=20.12 — load env without extra deps.
    try {
        process.loadEnvFile(".env.local");
    } catch {
        // .env.local optional; rely on the ambient environment otherwise.
    }

    if (!process.env.DATABASE_URL) {
        throw new Error(
            "DATABASE_URL is not set (checked .env.local and the environment)."
        );
    }

    const days = Number(process.env.CHAT_LOGS_RETENTION_DAYS ?? "30");
    if (!Number.isFinite(days) || days <= 0) {
        throw new Error(
            `Invalid CHAT_LOGS_RETENTION_DAYS: ${process.env.CHAT_LOGS_RETENTION_DAYS}`
        );
    }

    // Imported AFTER env is loaded so db.ts reads the right DATABASE_URL.
    const { db } = await import("@/drizzle/db");
    const { ChatLogsTable } = await import("@/drizzle/schema");
    const { lt } = await import("drizzle-orm");

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const deleted = await db
        .delete(ChatLogsTable)
        .where(lt(ChatLogsTable.createdAt, cutoff))
        .returning({ id: ChatLogsTable.id });

    console.log(
        `Pruned ${deleted.length} chat_logs row(s) older than ${days} day(s) (before ${cutoff.toISOString()}).`
    );
    process.exit(0);
}

main().catch((err) => {
    console.error("prune-chat-logs failed:", err);
    process.exit(1);
});
