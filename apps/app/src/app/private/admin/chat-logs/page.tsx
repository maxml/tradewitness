import {
  isCurrentUserAdmin,
  getChatLogsForAdmin,
} from "@/server/queries/chat-logs-admin";
import ChatLogsDashboardClient from "./ChatLogsDashboardClient";

export const dynamic = 'force-dynamic';

export default async function AdminChatLogsPage() {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  const rows = await getChatLogsForAdmin();

  return <ChatLogsDashboardClient rows={rows} />;
}
