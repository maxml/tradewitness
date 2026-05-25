"use server";
import { db } from "@/drizzle/db";
import { ReportsTable } from "@/drizzle/schema";
import { ReportsEntry, ReportType } from "@/types/tradeAI.types";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";

type ReportsSuccess = {
    success: true;
    reports: ReportsEntry[];
    reportId?: string;
};

type GetReportByIdSuccess = {
    success: true;
    report: ReportType;
};

type ReportError = {
    success: false;
    error: string;
};

type Report = {
    id: string;
    createdAt: Date;
    reportData: ReportType;
    isFavorite: boolean;
};

type DeleteAddFavoriteReportSuccess = {
    success: true;
};

type ReportsResult = ReportsSuccess | ReportError;
type GetReportByIdResult = GetReportByIdSuccess | ReportError;
type DeleteAddFAvoriteReportResult =
    | DeleteAddFavoriteReportSuccess
    | ReportError;

export async function saveReport(report: ReportType, userId: string) {
    // Ownership is derived from the authenticated session, never from the caller.
    // RLS is disabled (ADR-0001), so this app-layer check is the only control.
    const { userId: sessionUserId } = await auth();
    if (!sessionUserId) {
        return { success: false, error: "Unauthorized" };
    }
    if (userId && userId !== sessionUserId) {
        console.warn(
            "saveReport: ignoring caller-supplied userId that does not match the session"
        );
    }

    try {
        const result = await db
            .insert(ReportsTable)
            .values({
                userId: sessionUserId,
                reportData: report, // Store the complete report structure as JSON
            })
            .returning({ reportId: ReportsTable.id });

        return {
            success: true,
            reportId: result[0].reportId,
        };
    } catch (error) {
        console.error("Failed to save report:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        } else {
            return { success: false, error: "Unknown error occurred!" };
        }
    }
}

export async function getReports(
    userId: string | undefined
): Promise<ReportsResult | null> {
    if (!userId) return null;

    try {
        const reports = await db
            .select()
            .from(ReportsTable)
            .where(eq(ReportsTable.userId, userId))
            .orderBy(desc(ReportsTable.createdAt));

        if (!reports.length) return null;

        const reportEntries: ReportsEntry[] = (reports as Report[]).map(
            (report) => ({
                reportId: report.id,
                createdAt: new Date(report.createdAt).toLocaleDateString(),
                isFavorite: report.isFavorite,
                numberOfMessages:
                    report.reportData.instruments.length +
                    report.reportData.moneyManagement.length +
                    (report.reportData.timeManagement?.length ?? 0),
            })
        );

        return {
            success: true,
            reports: reportEntries,
        };
    } catch (error) {
        console.error("Failed to fetch reports:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Unknown error occurred!" };
    }
}

export async function getReportById(
    reportId: string | undefined
): Promise<GetReportByIdResult | null> {
    if (!reportId) return null;

    // Scope the lookup to the authenticated owner — prevents IDOR (RLS off, ADR-0001).
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        const report = await db.query.ReportsTable.findFirst({
            where: and(
                eq(ReportsTable.id, reportId),
                eq(ReportsTable.userId, userId)
            ),
        });

        return {
            success: true,
            report: report?.reportData as ReportType,
        };
    } catch (error) {
        console.error("Failed to fetch reports:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Unknown error occurred!" };
    }
}

export async function addRemoveFavorite(
    reportId: string | undefined
): Promise<DeleteAddFAvoriteReportResult | null> {
    if (!reportId) return null;

    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        const report = await db.query.ReportsTable.findFirst({
            where: and(
                eq(ReportsTable.id, reportId),
                eq(ReportsTable.userId, userId)
            ),
        });

        if (!report) return null;

        await db
            .update(ReportsTable)
            .set({
                isFavorite: !report.isFavorite,
            })
            .where(
                and(
                    eq(ReportsTable.id, reportId),
                    eq(ReportsTable.userId, userId)
                )
            )
            .execute();

        return {
            success: true,
        };
    } catch (error) {
        console.error("Failed to toggle favorite status:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Unknown error occurred!" };
    }
}

export async function deleteReportFromDB(
    reportId: string | undefined
): Promise<DeleteAddFAvoriteReportResult | null> {
    if (!reportId) return null;

    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    try {
        await db
            .delete(ReportsTable)
            .where(
                and(
                    eq(ReportsTable.id, reportId),
                    eq(ReportsTable.userId, userId)
                )
            );

        return {
            success: true,
        };
    } catch (error) {
        console.error("Failed to delete report:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Unknown error occurred!" };
    }
}
