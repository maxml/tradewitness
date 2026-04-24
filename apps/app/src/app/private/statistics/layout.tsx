import Filtering from "@/components/Filtering";
import { ReactNode } from "react";

export default function StatisticsLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col md:h-full">
            <Filtering isStatisticsPage={true} />
            <section className="flex-1 px-3 md:px-6">{children}</section>
        </div>
    );
}
