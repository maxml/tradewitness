"use client";

import AddCapitalDialog from "@/components/statistics/AddCapitalDialog";
import { StatsGridPageOne } from "@/components/StatsGridPageOne";
import { StatsGridPageTwo } from "@/components/StatsGridPageTwo";
import { getOtherDataForGridPageTwo } from "@/features/statistics/getDataForDetails";
import {
    getDataForSummaryChartGridPageOne,
    getOtherDataForGridPageOne,
} from "@/features/statistics/getDataForSummary";
import { useAppSelector } from "@/redux/store";
import { getCapital } from "@/server/actions/user";
import { useEffect, useState } from "react";
import * as Switch from "@radix-ui/react-switch";

export default function Page() {
    const [start, setStart] = useState<string | undefined>();
    const [end, setEnd] = useState<string | undefined>();

    const [isSwitchChartsActive, setIsSwitchChartsActive] = useState(false);

    const trades = useAppSelector((state) => state.tradeRecords.listOfTrades);
    const filteredTrades = useAppSelector(
        (state) => state.history.filteredTrades
    );

    const localCapital = useAppSelector((state) => state.statistics.capital);
    const tradesToSort = filteredTrades || trades || [];
    const startValueToUse = localCapital ?? start;

    const tradingData = getDataForSummaryChartGridPageOne(tradesToSort);

    const otherData = getOtherDataForGridPageOne(tradesToSort);

    useEffect(() => {
        async function fetchData() {
            const response = await getCapital();
            if (response && typeof response === "string") {
                setStart(response);
            }
        }

        fetchData();
    }, []);

    useEffect(() => {
        if (startValueToUse !== undefined) {
            const reducedTotal = tradesToSort.reduce(
                (acc, cur) => acc + Number(cur.result),
                0
            );
            setEnd((Number(startValueToUse) + reducedTotal).toString());
        }
    }, [startValueToUse, tradesToSort]);

    const otherDataPageTwo = getOtherDataForGridPageTwo(
        tradesToSort,
        startValueToUse
    );

    return (
        <div className="md:h-full bg-background text-foreground flex flex-col">
            <div className="flex items-center justify-between py-4 md:px-8 border-b border-border bg-card">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium transition-colors ${!isSwitchChartsActive ? 'text-foreground' : 'text-muted'}`}>Summary</span>
                        <Switch.Root
                            checked={isSwitchChartsActive}
                            onCheckedChange={setIsSwitchChartsActive}
                            className="w-[42px] h-[24px] bg-zinc-700 rounded-full relative outline-none cursor-pointer border border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:bg-primary transition-colors"
                            aria-label="Toggle between Summary and Details view"
                        >
                            <Switch.Thumb className="block w-[18px] h-[18px] bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[20px]" />
                        </Switch.Root>
                        <span className={`text-sm font-medium transition-colors ${isSwitchChartsActive ? 'text-foreground' : 'text-muted'}`}>Details</span>
                    </div>
                </div>

                <AddCapitalDialog />
            </div>
            <div className="flex-1 overflow-auto">
                {isSwitchChartsActive ? (
                    <StatsGridPageTwo
                        start={startValueToUse}
                        end={end}
                        oterData={otherDataPageTwo}
                    />
                ) : (
                    <StatsGridPageOne
                        tradingData={tradingData}
                        otherData={otherData}
                    />
                )}
            </div>
        </div>
    );
}
