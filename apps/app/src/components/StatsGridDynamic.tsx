"use client";

import dynamic from "next/dynamic";

// The stat grids are the heaviest client chunk in the app (@mui/x-charts).
// They are interactive client charts with no useful SSR output, so we load
// them lazily (ssr: false) wherever they appear — this keeps @mui/x-charts out
// of the route's server compile graph and shrinks the initial payload. Shared
// between the marketing home page and /private/statistics.
const ChartFallback = () => (
    <div className="flex-center py-16">
        <div className="running-algorithm">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
        </div>
    </div>
);

export const StatsGridPageOne = dynamic(
    () => import("./StatsGridPageOne").then((m) => m.StatsGridPageOne),
    { ssr: false, loading: ChartFallback }
);

export const StatsGridPageTwo = dynamic(
    () => import("./StatsGridPageTwo").then((m) => m.StatsGridPageTwo),
    { ssr: false, loading: ChartFallback }
);
