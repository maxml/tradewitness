"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { FeatureFlag } from "@tradewitness/feature-flags-core";

export type AutoPilotAction = "check" | "test" | "rollback";

export type AutoPilotResult =
  | {
      success: true;
      message: string;
      current_state: FeatureFlag | null;
      rejected_at: string | null;
    }
  | {
      success: false;
      message: string;
      rejected_at: string | null;
    };

function buildPayload(featureId: string, action: AutoPilotAction) {
  if (action === "check") return { feature_id: featureId, action };
  if (action === "test") return { feature_id: featureId, action, target_state: "Testing" };
  return { feature_id: featureId, action, target_state: "Disabled" };
}

async function ensureAdmin(): Promise<string | null> {
  const user = await currentUser();
  if (!user) return "Unauthorized";
  const primaryEmail = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress;
  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",")
      .map((email) => email.trim())
      .filter(Boolean) || [];
  if (!primaryEmail || !adminEmails.includes(primaryEmail)) {
    return "Forbidden: Admin access required.";
  }
  return null;
}

export async function callAutoPilot(featureId: string, action: AutoPilotAction): Promise<AutoPilotResult> {
  const authError = await ensureAdmin();
  if (authError) return { success: false, message: authError, rejected_at: "auth" };

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const apiKey = process.env.N8N_WEBHOOK_API_KEY;
  if (!webhookUrl || !apiKey) {
    return {
      success: false,
      message: "N8N_WEBHOOK_URL or N8N_WEBHOOK_API_KEY is not configured on the server.",
      rejected_at: "configuration",
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(buildPayload(featureId, action)),
      cache: "no-store",
    });

    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // Non-JSON body — surface as raw text so the operator can see it.
      return {
        success: false,
        message: `n8n returned HTTP ${res.status}: ${text.slice(0, 200) || "(empty body)"}`,
        rejected_at: "transport",
      };
    }

    const body = (data ?? {}) as {
      success?: boolean;
      message?: string;
      current_state?: FeatureFlag | null;
      rejected_at?: string | null;
    };

    if (!res.ok || body.success === false) {
      return {
        success: false,
        message: body.message ?? `n8n returned HTTP ${res.status}`,
        rejected_at: body.rejected_at ?? "tool-execution",
      };
    }

    // WF1 mutated the flag — refresh server-rendered data so SSR matches.
    if (action !== "check") {
      revalidatePath("/private/admin/features");
    }

    return {
      success: true,
      message: body.message ?? "ok",
      current_state: body.current_state ?? null,
      rejected_at: body.rejected_at ?? null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `network error reaching n8n: ${message}`,
      rejected_at: "transport",
    };
  }
}
