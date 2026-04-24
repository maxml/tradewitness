import { BarChart, LineChart, PieChart } from "@mui/x-charts";
import { ArrowUp } from "lucide-react";
import { Box, createTheme, ThemeProvider, useMediaQuery } from "@mui/material";
import Odometer from "@/features/odometer/Odometer";
import { daysOfTheWeek } from "@/data/data";
import AddCapitalDialog from "./statistics/AddCapitalDialog";

const theme = createTheme({
    typography: {
        body1: {
            fontSize: ".75rem",
        },
        body2: {
            fontSize: ".75rem",
        },
    },
});

export function StatsGridPageTwo({
    start,
    end,
    oterData,
}: {
    start: string | undefined;
    end: string | undefined;
    oterData: {
        chartOne: {
            capitalChanges: number[];
            dateLabels: string[];
            sp500Alternative: number[];
        };
        chartTwo: {
            topTrades: {
                id: number;
                value: number;
                label: string;
            }[];
        };
        chartThree: {
            results: number[];
            dates: string[];
        };
        chartFour: {
            data: number[];
            color: string;
            label: string;
        }[];
    };
}) {
    const isMobile = useMediaQuery("(max-width:768px)");
    return (
        <ThemeProvider theme={theme}>
            <div className="grid grid-rows-5 md:grid-rows-2 grid-cols-1 md:grid-cols-12 gap-4 max-md:py-4 md:p-4 md:h-[78vh] 2xl:h-[80vh] bg-transparent w-full">
                <div className="max-md:h-[350px] col-span-1 md:col-span-4 row-span-1 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-start shadow-md">
                    <div className="font-semibold border-[0.5px] border-gray-200 w-full p-2">
                        <p>Start Capital vs. Current Capital:</p>
                    </div>
                    <OdometerConditionalRendering start={start} end={end} />
                </div>
                <div className="max-md:h-[350px] col-span-1 md:col-span-4 row-span-1 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-start shadow-md">
                    <div className="font-semibold border-[0.5px] border-gray-200 w-full p-2">
                        <p>Your Returns vs. S&P 500 Returns:</p>
                    </div>
                    <div className="flex gap-6 p-2">
                        <div className="flex gap-2 items-center">
                            <div className="w-[12px] h-[12px] bg-customOrange rounded-sm" />
                            <p>Your returns</p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="w-[12px] h-[12px] bg-[#E3E0DE] rounded-sm" />
                            <p>S&P500</p>
                        </div>
                    </div>
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            position: "relative",

                            "&::after": isMobile
                                ? {
                                      content: '""',
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      zIndex: 10,
                                      pointerEvents: "auto",
                                      cursor: "default",
                                  }
                                : {},
                        }}>
                        <LineChart
                            xAxis={[
                                {
                                    scaleType: "point",
                                    data: oterData.chartOne.dateLabels ?? [],
                                },
                            ]}
                            series={[
                                {
                                    data:
                                        oterData.chartOne.capitalChanges ?? [],
                                    color: "var(--customOrange)",
                                    showMark: false,
                                    label: "Your returns",
                                },
                                {
                                    data:
                                        oterData.chartOne.sp500Alternative ??
                                        [],
                                    color: "#E3E0DE",
                                    showMark: false,
                                    label: "S&P500",
                                },
                            ]}
                            slotProps={{
                                legend: {
                                    hidden: true,
                                },
                            }}
                            margin={{ left: 65, top: 25, right: 30 }}
                        />
                    </Box>
                </div>
                <div className="max-md:h-[350px] col-span-1 md:col-span-4 row-span-1 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-start shadow-md">
                    <div className="font-semibold border-[0.5px] border-gray-200 w-full p-2">
                        <p>Your Most Popular Trading Instruments:</p>
                    </div>
                    <div className="flex gap-6 p-2">
                        <div className="flex gap-2 items-center">
                            <div className="w-[12px] h-[12px] bg-customBlue rounded-sm" />
                            <p>
                                {oterData.chartTwo.topTrades[0]?.label ??
                                    "No data"}{" "}
                                <span className="text-gray-400 text-[0.7rem]">
                                    {oterData.chartTwo.topTrades[0]?.value ?? 0}
                                </span>
                            </p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="w-[12px] h-[12px] bg-customYellow rounded-sm" />
                            <p>
                                {oterData.chartTwo.topTrades[1]?.label ??
                                    "No data"}{" "}
                                <span className="text-gray-400 text-[0.7rem]">
                                    {oterData.chartTwo.topTrades[1]?.value ?? 0}
                                </span>
                            </p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="w-[12px] h-[12px] bg-customOrange rounded-sm" />
                            <p>
                                {oterData.chartTwo.topTrades[2]?.label ??
                                    "No data"}{" "}
                                <span className="text-gray-400 text-[0.7rem]">
                                    {oterData.chartTwo.topTrades[2]?.value ?? 0}
                                </span>
                            </p>
                        </div>
                    </div>
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            position: "relative",

                            "&::after": isMobile
                                ? {
                                      content: '""',
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      zIndex: 10,
                                      pointerEvents: "auto",
                                      cursor: "default",
                                  }
                                : {},
                        }}>
                        <PieChart
                            colors={[
                                "var(--customBlue)",
                                "var(--customYellow)",
                                "var(--customOrange)",
                                "#E3E0DE",
                            ]}
                            series={[
                                {
                                    data: oterData.chartTwo.topTrades ?? [],
                                    innerRadius: 80,
                                    paddingAngle: 2,
                                    cornerRadius: 5,
                                    highlightScope: {
                                        fade: "global",
                                        highlight: "item",
                                    },
                                },
                            ]}
                            margin={{
                                top: 25,
                                bottom: 25,
                                left: 25,
                                right: 25,
                            }}
                            slotProps={{
                                popper: {
                                    sx: {
                                        fontSize: "0.75rem",
                                    },
                                },
                                legend: {
                                    hidden: true,
                                },
                            }}
                        />
                    </Box>
                </div>

                <div className="max-md:h-[350px] col-span-1 md:col-span-5 row-span-1 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-start relative shadow-md">
                    <div className="font-semibold border-[0.5px] border-gray-200 w-full p-2">
                        <p>Days with the Biggest Gains</p>
                    </div>
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            position: "relative",

                            "&::after": isMobile
                                ? {
                                      content: '""',
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      zIndex: 10,
                                      pointerEvents: "auto",
                                      cursor: "default",
                                  }
                                : {},
                        }}>
                        <BarChart
                            xAxis={[
                                {
                                    scaleType: "band",
                                    data: oterData.chartThree.dates ?? [],
                                },
                            ]}
                            borderRadius={5}
                            series={[
                                {
                                    data: oterData.chartThree.results ?? [],
                                    color: "var(--buy)",
                                    label: "Earned on This Day",
                                },
                            ]}
                            slotProps={{ legend: { hidden: true } }}
                        />
                    </Box>
                </div>
                <div className="max-md:h-[350px] col-span-1 md:col-span-7 row-span-1 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-start shadow-md">
                    <div className="font-semibold border-[0.5px] border-gray-200 w-full p-2">
                        <p>Trading Volume by Day of the Week:</p>
                    </div>
                    <div className="flex gap-6 p-2">
                        <div className="flex gap-2 items-center">
                            <div className="w-[12px] h-[12px] bg-customBlue rounded-sm" />
                            <p>
                                {oterData.chartFour.length !== 0
                                    ? oterData.chartFour[0].label
                                    : "No data"}
                            </p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="w-[12px] h-[12px] bg-customYellow rounded-sm" />
                            <p>
                                {oterData.chartFour.length !== 0
                                    ? oterData.chartFour[1].label
                                    : "No data"}
                            </p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="w-[12px] h-[12px] bg-customOrange rounded-sm" />
                            <p>
                                {oterData.chartFour.length !== 0
                                    ? oterData.chartFour[2].label
                                    : "No data"}
                            </p>
                        </div>
                    </div>
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            position: "relative",

                            "&::after": isMobile
                                ? {
                                      content: '""',
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      zIndex: 10,
                                      pointerEvents: "auto",
                                      cursor: "default",
                                  }
                                : {},
                        }}>
                        <BarChart
                            xAxis={[
                                {
                                    scaleType: "band",
                                    data: daysOfTheWeek,
                                },
                            ]}
                            borderRadius={5}
                            series={oterData.chartFour ?? []}
                            slotProps={{
                                legend: {
                                    hidden: true,
                                },
                            }}
                        />
                    </Box>
                </div>
            </div>
        </ThemeProvider>
    );
}

function OdometerConditionalRendering({
    start,
    end,
}: {
    start: string | undefined;
    end: string | undefined;
}) {
    if (start !== undefined && end !== undefined) {
        return (
            <div className="flex-1 flex flex-col gap-6 items-center justify-center">
                <p className="text-gray-400">Current capital</p>
                <Odometer
                    start={Number(start)}
                    end={Number(end)}
                    width={30}
                    height={50}
                    labelText="$"
                    labelSize={40}
                />
                <div className="bg-[#ECF4E7] text-buy px-3 py-[2px] rounded-md flex gap-1 items-center">
                    <ArrowUp size={18} />
                    <p>
                        {(
                            ((Number(end) - Number(start)) * 100) /
                            Number(start)
                        ).toFixed(1)}
                        %
                    </p>
                </div>
            </div>
        );
    } else if (start !== undefined && end === undefined) {
        return (
            <div className="flex-1 flex flex-col gap-1 justify-center items-center">
                <p className="text-gray-400">Current capital</p>
                <span className="text-[50px]">{start}</span>
            </div>
        );
    } else {
        return (
            <div className="flex-1 flex justify-center items-center">
                <AddCapitalDialog />
            </div>
        );
    }
}
