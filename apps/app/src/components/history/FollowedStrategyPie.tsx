import React from "react";
import { PieChart } from "@mui/x-charts/PieChart";

export const FollowedStrategyPie = ({ percentage = 65 }) => {
    const data = [
        { id: 0, value: percentage, color: "var(--buy)" },
        { id: 1, value: 100 - percentage, color: "var(--sell)" },
    ];

    return (
        <div className="w-8 h-8 flex items-center justify-center relative">
            <PieChart
                width={32}
                height={32}
                margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
                series={[
                    {
                        data,
                        innerRadius: 11,
                        outerRadius: 16,
                        paddingAngle: 0,
                        startAngle: 0,
                        endAngle: 360,
                    },
                ]}
                tooltip={{ trigger: "none" }}
                slotProps={{ legend: { hidden: true } }}
            />

            {/* Percentage text in the center */}
            <div className="absolute inset-0 flex items-center justify-center cursor-pointer"></div>
        </div>
    );
};
