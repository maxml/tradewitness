"use client";

import * as React from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type Route = "local" | "cloud";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  route?: Route;
  reason?: string;
}

interface AssistantSuccessResponse {
  conversationId: string;
  message: string;
  route: Route;
  reason: string;
}

interface AssistantErrorResponse {
  error: string;
}

function isErrorResponse(value: unknown): value is AssistantErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as Record<string, unknown>).error === "string"
  );
}

function isSuccessResponse(value: unknown): value is AssistantSuccessResponse {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.conversationId === "string" &&
    typeof v.message === "string" &&
    (v.route === "local" || v.route === "cloud") &&
    typeof v.reason === "string"
  );
}

function RouteBadge({ route, reason }: { route: Route; reason?: string }) {
  return (
    <span
      title={reason}
      className={cn(
        "mt-1 inline-flex w-fit items-center rounded-sm px-2 py-0.5 text-[11px] font-medium",
        route === "local"
          ? "bg-success/15 text-success"
          : "bg-primary/15 text-primary"
      )}
    >
      {route}
    </span>
  );
}

export function AssistantWidget() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | undefined>(
    undefined
  );
  const [error, setError] = React.useState<string | null>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, pending]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || pending) return;

    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setPending(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: trimmed,
        }),
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 429) {
          setError("Rate limited, slow down");
        } else if (isErrorResponse(data) && data.error === "unauthenticated") {
          setError("Please sign in to use the assistant.");
        } else {
          setError("Something went wrong. Please try again.");
        }
        return;
      }

      if (!isSuccessResponse(data)) {
        setError("Received an unexpected response. Please try again.");
        return;
      }

      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          route: data.route,
          reason: data.reason,
        },
      ]);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {open && (
        <div className="mb-3 flex h-[28rem] w-80 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border border-border bg-card-alt">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">
              Assistant
            </span>
            <button
              type="button"
              aria-label="Close assistant"
              onClick={() => setOpen(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-card hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
          >
            {messages.length === 0 && !error && (
              <p className="mt-8 text-center text-sm text-muted">
                Ask anything about your trades, strategies, or the app.
              </p>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col",
                  m.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground"
                  )}
                >
                  {m.content}
                </div>
                {m.role === "assistant" && m.route && (
                  <RouteBadge route={m.route} reason={m.reason} />
                )}
              </div>
            ))}

            {pending && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking…
              </div>
            )}

            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-border px-3 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={pending}
              placeholder="Type a message…"
              aria-label="Message the assistant"
              className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground transition-colors placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="button"
              aria-label="Send message"
              onClick={() => void sendMessage()}
              disabled={pending || input.trim().length === 0}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:brightness-110 disabled:pointer-events-none disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        type="button"
        aria-label={open ? "Close assistant" : "Open assistant"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}

export default AssistantWidget;
