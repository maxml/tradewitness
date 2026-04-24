import Filtering from "@/components/Filtering";
import { ReactNode } from "react";

export default function HistoryLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col h-full">
            <Filtering isStatisticsPage={false} />
            <section className="flex-1 overflow-auto px-2 md:px-6">
                {children}
            </section>
        </div>
    );
}
