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
import { useEffect, useRef, useState } from "react";

export default function Page() {
    const [start, setStart] = useState<string | undefined>();
    const [end, setEnd] = useState<string | undefined>();
    const buttonRef = useRef<HTMLDivElement | null>(null);

    const [isSwitchChartsActive, setIsSwitchChartsActive] = useState(false);

    const handleSwitch = () => {
        if (buttonRef.current && !isSwitchChartsActive) {
            buttonRef.current.style.boxShadow =
                "0 0 0 1px #70451a3d, 0 1px 2px #70451a0d, 2px 3px 5px #70451a29, 4px 6px 5px #70451a14, 8px 12px 8px #70451a14,8px 0 0.5px #70451a33 inset, 20px 20px 25px 25px #70451a33 inset";
        } else if (buttonRef.current && isSwitchChartsActive) {
            buttonRef.current.style.boxShadow =
                "0 0 0 1px #70451a3d, 0 1px 2px #70451a0d, 2px 3px 5px #70451a29, 4px 6px 5px #70451a14, 8px 12px 8px #70451a14,8px 0 0.5px #70451a33 inset, 10px 0 4px -6px #70451a33 inset";
        }
        setIsSwitchChartsActive((prev) => !prev);
    };

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
        <div className="md:h-full">
            <div className="flex items-center justify-between pt-2 md:px-4">
                <div className="flex items-center gap-4">
                    <p className="max-md:text-[.7rem]">Details</p>

                    <div
                        ref={buttonRef}
                        onClick={handleSwitch}
                        className={`${
                            isSwitchChartsActive
                                ? "switch-button active"
                                : "switch-button"
                        }`}
                    />
                    <p className="max-md:text-[.7rem]">Summary</p>
                </div>

                <AddCapitalDialog />
            </div>
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
    );
}
