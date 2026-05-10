import { getAllTradeRecords } from "@/server/actions/trades";
import { getAllStrategies } from "@/server/actions/strategies";
import PrivateLayoutClient from "@/components/private-layout/PrivateLayoutClient";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Strategy } from "@/types/strategies.types";

export default async function PrivateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();
    const user = await currentUser();

    const tradeRecords = await getAllTradeRecords();

    // Load strategies alongside trades
    let strategies: Strategy[] = [];
    if (userId) {
        const strategiesResult = await getAllStrategies(userId);
        if (strategiesResult && "strategies" in strategiesResult) {
            strategies = strategiesResult.strategies;
        }
    }

    const primaryEmail = user?.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()).filter(Boolean) || [];
    const isAdmin = !!primaryEmail && adminEmails.includes(primaryEmail);

    return (
        <PrivateLayoutClient
            initialTradeRecords={tradeRecords}
            initialStrategies={strategies}
            isAdmin={isAdmin}>
            {children}
        </PrivateLayoutClient>
    );
}
