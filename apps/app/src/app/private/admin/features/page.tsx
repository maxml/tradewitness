import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FeatureFlag } from "@tradewitness/feature-flags-core";
import FeatureDashboardClient from "./FeatureDashboardClient";

export const dynamic = 'force-dynamic';

function getFeatureFlagsApiKey() {
  if (process.env.FEATURE_FLAGS_API_KEY) return process.env.FEATURE_FLAGS_API_KEY;
  if (process.env.NODE_ENV !== "production") return "local-m3-change-me";
  return "";
}

export default async function AdminFeaturesPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()).filter(Boolean) || [];
  
  if (!primaryEmail || !adminEmails.includes(primaryEmail)) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  const internalUrl = process.env.APP_INTERNAL_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://127.0.0.1:3001';
  const apiKey = getFeatureFlagsApiKey();

  let flags: FeatureFlag[] = [];
  let fetchError = null;

  try {
    const res = await fetch(`${internalUrl}/api/feature-flags`, {
      headers: {
        'x-api-key': apiKey,
      },
      cache: 'no-store'
    });
    
    if (res.ok) {
      flags = await res.json();
    } else {
      fetchError = await res.text();
    }
  } catch (err: any) {
    fetchError = err.message;
  }

  if (fetchError) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-destructive mb-4">Error loading flags</h1>
        <div className="p-4 bg-card border border-destructive/50 rounded-md text-muted font-mono text-sm">
          {fetchError}
        </div>
      </div>
    );
  }

  return <FeatureDashboardClient initialFlags={flags} />;
}
