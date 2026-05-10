import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FeatureFlag } from "@tradewitness/feature-flags-core";

export const dynamic = 'force-dynamic';

export default async function AdminFeaturesPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  
  if (!primaryEmail || !adminEmails.includes(primaryEmail)) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const internalUrl = process.env.APP_INTERNAL_URL || 'http://127.0.0.1:3001';
  const apiKey = process.env.FEATURE_FLAGS_API_KEY || '';

  let flags: FeatureFlag[] = [];
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
      console.error("Failed to fetch flags:", await res.text());
    }
  } catch (err) {
    console.error("Error fetching feature flags", err);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Feature Flags Admin</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">Name</th>
              <th className="py-2 px-4 border-b text-left">Status</th>
              <th className="py-2 px-4 border-b text-left">Traffic (%)</th>
              <th className="py-2 px-4 border-b text-left">Dependencies</th>
              <th className="py-2 px-4 border-b text-left">Last Modified</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((flag) => (
              <tr key={flag.name} className="border-b">
                <td className="py-2 px-4">{flag.name}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    flag.status === 'Enabled' ? 'bg-green-100 text-green-800' :
                    flag.status === 'Testing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {flag.status}
                  </span>
                </td>
                <td className="py-2 px-4">{flag.traffic_percentage}%</td>
                <td className="py-2 px-4">{flag.depends_on.join(', ') || '-'}</td>
                <td className="py-2 px-4">{new Date(flag.last_modified).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
