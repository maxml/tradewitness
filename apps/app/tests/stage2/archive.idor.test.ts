/**
 * M6 Stage 2 — Finding #1 (Report IDOR) — CHARACTERIZATION tests.
 *
 * Target: apps/app/src/server/actions/archive.ts  (getReportById, saveReport)
 * These pin the INVARIANT behavior that must survive the fix (owner happy-path,
 * empty-arg guard, DB error path). They MUST pass on the CURRENT (pre-fix) code.
 *
 * The IDOR fix-verification cases (unauthenticated rejected, spoofed userId ignored)
 * live in the separate `describe('fix verification')` block, added with the fix —
 * they are expected to FAIL pre-fix and PASS post-fix.
 *
 * db (@/drizzle/db) is mocked so no real Postgres connection is opened.
 * auth (@clerk/nextjs/server) is mocked; pre-fix code does not call it (harmless),
 * post-fix code does.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- mocks -----------------------------------------------------------------
const findFirst = vi.fn();
const returning = vi.fn();
const values = vi.fn(() => ({ returning }));
const insert = vi.fn(() => ({ values }));

vi.mock("@/drizzle/db", () => ({
    db: {
        query: { ReportsTable: { findFirst: (...a: unknown[]) => findFirst(...a) } },
        insert: (...a: unknown[]) => insert(...a),
    },
}));

const authMock = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
    auth: () => authMock(),
}));

import { getReportById, saveReport } from "@/server/actions/archive";

// realistic report payload (matches the shape getReports reads)
const reportData = {
    instruments: [{ symbol: "EURUSD", note: "tight spread on London open" }],
    moneyManagement: [{ rule: "risk 1% per trade" }],
    timeManagement: [{ rule: "no trades during NFP" }],
} as unknown as Parameters<typeof saveReport>[0];

beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ userId: "user_owner_2f8a" });
});

describe("characterization (invariant) — getReportById", () => {
    it("returns the report payload for an existing report (owner happy path)", async () => {
        findFirst.mockResolvedValue({ id: "rep_123", userId: "user_owner_2f8a", reportData });

        const res = await getReportById("rep_123");

        expect(res).not.toBeNull();
        expect(res!.success).toBe(true);
        expect((res as { success: true; report: typeof reportData }).report).toEqual(reportData);
    });

    it("returns null when reportId is undefined (empty-arg guard)", async () => {
        const res = await getReportById(undefined);
        expect(res).toBeNull();
        expect(findFirst).not.toHaveBeenCalled();
    });

    it("returns {success:false,error} when the DB query throws (error path)", async () => {
        findFirst.mockRejectedValue(new Error("connection terminated unexpectedly"));

        const res = await getReportById("rep_123");

        expect(res).not.toBeNull();
        expect(res!.success).toBe(false);
        expect((res as { success: false; error: string }).error).toBe(
            "connection terminated unexpectedly"
        );
    });
});

describe("characterization (invariant) — saveReport", () => {
    it("inserts a report and returns {success,reportId} (owner happy path)", async () => {
        returning.mockResolvedValue([{ reportId: "rep_new_99" }]);

        const res = await saveReport(reportData, "user_owner_2f8a");

        expect(res.success).toBe(true);
        expect((res as { success: true; reportId: string }).reportId).toBe("rep_new_99");
        expect(insert).toHaveBeenCalledTimes(1);
    });

    it("returns {success:false,error} when the insert throws (error path)", async () => {
        returning.mockRejectedValue(new Error("duplicate key value violates unique constraint"));

        const res = await saveReport(reportData, "user_owner_2f8a");

        expect(res.success).toBe(false);
        expect((res as { success: false; error: string }).error).toBe(
            "duplicate key value violates unique constraint"
        );
    });
});
