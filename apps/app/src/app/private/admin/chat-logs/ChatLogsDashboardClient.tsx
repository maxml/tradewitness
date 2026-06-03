"use client";

import type { AdminChatLogRow } from "@/server/queries/chat-logs-admin";

interface Props {
  rows: AdminChatLogRow[];
}

const REDACTION_UNAVAILABLE = "<REDACTION_UNAVAILABLE>";

function formatTime(date: Date): string {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCost(costUsd: number | null): string {
  if (costUsd === null) return "—";
  if (costUsd === 0) return "$0.00";
  return `$${costUsd.toFixed(6)}`;
}

/** Renders redacted text, falling back to the literal placeholder when empty,
 *  and flagging cells whose redaction status is not "ok". */
function MaskedCell({
  value,
  redactionStatus,
}: {
  value: string | null;
  redactionStatus: string | null;
}) {
  const text = value && value.length > 0 ? value : REDACTION_UNAVAILABLE;
  const flagged = redactionStatus !== null && redactionStatus !== "ok";

  return (
    <div className="flex items-start gap-1.5 max-w-xs">
      {flagged && (
        <span
          className="text-destructive shrink-0 leading-relaxed"
          title={`Redaction status: ${redactionStatus}`}
          aria-label={`Redaction warning: ${redactionStatus}`}
        >
          ⚠
        </span>
      )}
      <span
        className={`whitespace-pre-wrap break-words ${
          value && value.length > 0 ? "" : "font-mono text-muted"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

export default function ChatLogsDashboardClient({ rows }: Props) {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chat Logs</h1>
        <p className="text-muted mt-1">
          Admin-only audit view. Content is mask-only — messages and responses are
          shown redacted at rest; raw text is never loaded into this UI.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-lg">
          <h3 className="text-lg font-medium text-foreground">No chat logs found</h3>
          <p className="text-muted mt-1">There is no recorded chat activity yet.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted border-b border-border">
                <th className="px-3 py-3 font-medium whitespace-nowrap">Time</th>
                <th className="px-3 py-3 font-medium whitespace-nowrap">User</th>
                <th className="px-3 py-3 font-medium whitespace-nowrap">Route</th>
                <th className="px-3 py-3 font-medium whitespace-nowrap">Model</th>
                <th className="px-3 py-3 font-medium whitespace-nowrap">Sensitivity</th>
                <th className="px-3 py-3 font-medium">Message</th>
                <th className="px-3 py-3 font-medium">Response</th>
                <th className="px-3 py-3 font-medium whitespace-nowrap">PII</th>
                <th className="px-3 py-3 font-medium whitespace-nowrap text-right">Latency</th>
                <th className="px-3 py-3 font-medium whitespace-nowrap text-right">Cost</th>
                <th className="px-3 py-3 font-medium whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isLocal = row.route === "local";
                const isPrivate = row.sensitivity === "private";
                const statusOk = row.status === "ok";

                return (
                  <tr
                    key={row.id}
                    className="border-b border-border/50 last:border-0 align-top hover:bg-card-alt/40 transition-colors"
                  >
                    <td className="px-3 py-3 whitespace-nowrap font-mono text-xs text-muted">
                      {formatTime(row.createdAt)}
                    </td>
                    <td
                      className="px-3 py-3 whitespace-nowrap font-mono text-xs"
                      title={row.userId}
                    >
                      {row.userId.slice(0, 8)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          isLocal
                            ? "bg-success/15 text-success border-success/30"
                            : "bg-primary/15 text-primary border-primary/30"
                        }`}
                      >
                        {isLocal ? "local • $0.00" : row.route ?? "cloud"}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap font-mono text-xs">
                      {row.model ?? "—"}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          isPrivate
                            ? "bg-accent/15 text-accent border-accent/30"
                            : "bg-muted/15 text-muted border-muted/30"
                        }`}
                      >
                        {row.sensitivity}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <MaskedCell
                        value={row.redactedUserMessage}
                        redactionStatus={row.userRedactionStatus}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <MaskedCell
                        value={row.redactedAssistantResponse}
                        redactionStatus={row.assistantRedactionStatus}
                      />
                    </td>
                    <td className="px-3 py-3 text-xs text-muted max-w-[12rem]">
                      <span className="break-words">
                        {row.detectedPiiTypes.length > 0
                          ? row.detectedPiiTypes.join(", ")
                          : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right font-mono text-xs">
                      {row.latencyMs !== null ? `${row.latencyMs}ms` : "—"}
                    </td>
                    <td
                      className="px-3 py-3 whitespace-nowrap text-right font-mono text-xs"
                      title={row.costUsd === null && row.costReason ? row.costReason : undefined}
                    >
                      {formatCost(row.costUsd)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          statusOk
                            ? "bg-muted/15 text-muted border-muted/30"
                            : "bg-destructive/15 text-destructive border-destructive/30"
                        }`}
                        title={row.errorCode ?? undefined}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
