# Fix #1 — Report IDOR (`archive.ts`)

## Original finding (from `synthesis.md` Top-3 #1)

> **`apps/app/src/server/actions/archive.ts:104` (`getReportById`) + `:41` (`saveReport`)** — Report IDOR
> Sources: security-mate (HIGH, A01) + architecture-mate (C1, ADR-0001 violation) ⟵ cross-mate
> Reads/writes `ReportsTable` by `reportId` only — no `auth()`, no `eq(userId)`. With RLS disabled, the missing app-layer predicate is the *entire* access control → any user's AI reports leak / can be overwritten.
> Fix: add `auth()` + `and(eq(reportId), eq(userId))` on both the read and the write.

## What I changed (diff)

```diff
 export async function saveReport(report: ReportType, userId: string) {
+    // Ownership is derived from the authenticated session, never from the caller.
+    // RLS is disabled (ADR-0001), so this app-layer check is the only control.
+    const { userId: sessionUserId } = await auth();
+    if (!sessionUserId) {
+        return { success: false, error: "Unauthorized" };
+    }
+    if (userId && userId !== sessionUserId) {
+        console.warn(
+            "saveReport: ignoring caller-supplied userId that does not match the session"
+        );
+    }
+
     try {
         const result = await db
             .insert(ReportsTable)
             .values({
-                userId,
+                userId: sessionUserId,
                 reportData: report,
             })
             .returning({ reportId: ReportsTable.id });
@@ getReportById
     if (!reportId) return null;
+
+    // Scope the lookup to the authenticated owner — prevents IDOR (RLS off, ADR-0001).
+    const { userId } = await auth();
+    if (!userId) return { success: false, error: "Unauthorized" };
+
     try {
         const report = await db.query.ReportsTable.findFirst({
-            where: eq(ReportsTable.id, reportId),
+            where: and(
+                eq(ReportsTable.id, reportId),
+                eq(ReportsTable.userId, userId)
+            ),
         });
```

`auth` and `and` were already imported in the file — no new imports, no new dependencies.

## Why this approach (trade-offs)

- **Derive identity from the session, never trust the caller.** Both functions now get `userId` from `auth()`. `getReportById` adds `eq(userId)` to the `WHERE` so a foreign `reportId` simply returns nothing (no leak). `saveReport` writes under the session user and *ignores* the caller-supplied `userId` (kept in the signature for backward compatibility, but logged-and-overridden if it disagrees — so the public API shape is unchanged).
- **Mirrors the already-correct siblings.** `addRemoveFavorite`, `deleteReportFromDB`, and `getReports` in the same file already do `auth()` + `eq(userId)`; this brings the two outliers in line rather than inventing a new pattern.
- **Considered alternative:** re-enabling Supabase RLS as a DB backstop (proposed ADR-0004). Rejected for Stage 2 scope — it's a cross-cutting infra change, not a contained fix; the app-layer guard is the documented boundary today.

## Test status

Characterization tests pinned the invariant behavior **before** the fix (owner happy-path, empty-arg guard, DB error path) and still pass **after**. Fix-verification cases were added with the fix.

```
✓ tests/stage2/archive.idor.test.ts (9 tests)
  characterization (invariant) — getReportById        3 ✓
  characterization (invariant) — saveReport           2 ✓
  fix verification — IDOR closed                       4 ✓
    ✓ getReportById rejects an unauthenticated caller and never queries
    ✓ getReportById scopes the lookup to the authenticated user
    ✓ saveReport rejects an unauthenticated caller and never inserts
    ✓ saveReport ignores a spoofed userId and writes under the session user
Test Files  1 passed (1) · Tests 9 passed (9)
```

(The 4 fix-verification cases fail on pre-fix code — verified — and pass post-fix.)

## Lessons learned

The dangerous outliers sat right next to correct code doing the exact `auth()` + `eq(userId)` pattern — the AI review caught what a human skim misses because the file *looks* consistently guarded. Keeping the `userId` param in `saveReport`'s signature (rather than removing it) let me close the hole without touching the one caller, honoring "don't change the public API."
