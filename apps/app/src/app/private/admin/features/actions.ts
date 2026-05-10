"use server";

import { currentUser } from "@clerk/nextjs/server";
import { FeatureFlagState } from "@tradewitness/feature-flags-core";
import { revalidatePath } from "next/cache";

const getInternalUrl = () => process.env.APP_INTERNAL_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://127.0.0.1:3001';
const getFeatureFlagsApiKey = () => {
  if (process.env.FEATURE_FLAGS_API_KEY) return process.env.FEATURE_FLAGS_API_KEY;
  if (process.env.NODE_ENV !== "production") return "local-m3-change-me";
  return "";
};

export async function updateFeatureFlag(name: string, updates: { status?: FeatureFlagState, traffic_percentage?: number }) {
  // Authorization check
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()).filter(Boolean) || [];
  
  if (!primaryEmail || !adminEmails.includes(primaryEmail)) {
    return { success: false, error: "Forbidden: Admin access required." };
  }

  const apiKey = getFeatureFlagsApiKey();
  if (!apiKey) {
    return { success: false, error: "FEATURE_FLAGS_API_KEY is required." };
  }
  const internalUrl = getInternalUrl();

  try {
    const res = await fetch(`${internalUrl}/api/feature-flags`, {
      method: "PATCH",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, ...updates })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || `Failed with status ${res.status}` };
    }

    const data = await res.json();
    revalidatePath("/private/admin/features");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
