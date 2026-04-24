import { BarChart, LineChart } from "@mui/x-charts";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { ChartsXAxisProps } from "@mui/x-charts";
import { Box, createTheme, ThemeProvider, useMediaQuery } from "@mui/material";

interface ExtendedChartsXAxisProps extends ChartsXAxisProps {
    categoryGapRatio?: number;
}

interface GetOtherDataForGridPageOneResult {
    chartOne: {
        succesfullPositions: number;
        allPositions: number;
    };
    chartTwo: {
        succesfullBuyPositions: number;
        allBuyPositions: number;
    };
    chartThree: {
        succesfullSellPositions: number;
        allSellPositions: number;
    };
    chartFour: {
        allBuyPositions: number;
        averageBuyPositionsPerMonth: number;
    };
    chartFive: {
        allSellPositions: number;
        averageSellPositionsPerMonth: number;
    };
    chartSix: {
        averageTimeInBuyPosition: number;
        averageTimeInSellPosition: number;
    };
    chartSeven: {
        sequenceProfitable: number;
        sequenceLost: number;
    };
}

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

export function StatsGridPageOne({
    tradingData,
    otherData,
}: {
    tradingData: { date: Date; capital: number }[];
    otherData: GetOtherDataForGridPageOneResult;
}) {
    const isMobile = useMediaQuery("(max-width:768px)");
    return (
        <ThemeProvider theme={theme}>
            <div className="grid grid-rows-10 md:grid-rows-4 grid-cols-1 md:grid-cols-4 gap-4 max-md:py-4 md:p-4 md:h-[78vh] 2xl:h-[80vh] bg-transparent rounded-xl w-full">
                <div className="max-md:h-[500px] col-span-1 md:col-span-3 row-span-3 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-start shadow-md">
                    <div className="font-semibold border-[0.5px] border-gray-200 w-full p-2">
                        <p>Summary:</p>
                    </div>
                    {/* Box to disable interactions with chart on mobile devices */}
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
                            dataset={tradingData ?? []}
                            xAxis={[
                                {
                                    id: "Date",
                                    dataKey: "date",
                                    scaleType: "time",
                                    tickNumber: 6,
                                    valueFormatter: (date) =>
                                        new Intl.DateTimeFormat("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        }).format(date),
                                },
                            ]}
                            yAxis={[
                                {
                                    colorMap: {
                                        type: "piecewise",
                                        thresholds: [0],
                                        colors: ["var(--sell)", "var(--buy)"],
                                    },
                                },
                            ]}
                            series={[
                                {
                                    curve: "linear",
                                    id: "capital",
                                    dataKey: "capital",
                                    showMark: false,
                                    stack: "total",
                                    area: true,
                                    valueFormatter: (value) =>
                                        `Capital: ${value} $`,
                                },
                            ]}
                            margin={{ left: 65, top: 25, right: 30 }}
                            grid={{ horizontal: true }}
                            sx={{
                                "& .MuiAreaElement-series-capital": {
                                    opacity: 0.3,
                                },
                            }}
                        />
                    </Box>
                </div>
                <div className="col-span-1 row-span-1 bg-white rounded-lg border border-gray-200 shadow-md flex flex-col items-center justify-start ">
                    <div className="font-semibold border-[0.5px] border-gray-200 w-full p-2">
                        <p>Succesful positions / All positions:</p>
                    </div>
                    <Gauge
                        value={otherData.chartOne.succesfullPositions ?? 0}
                        startAngle={-90}
                        endAngle={90}
                        cornerRadius="50%"
                        sx={{
                            [`& .${gaugeClasses.valueText}`]: {
                                fontSize: 16,
                                transform: "translate(0px, -30px)",
                            },
                            [`& .${gaugeClasses.valueArc}`]: {
                                fill: "var(--customOrange)",
                            },
                        }}
                        text={({ value }) =>
                            `${value}% / ${
                                otherData.chartOne.allPositions ?? 0
                            }`
                        }
                    />
                </div>
                <div className="col-span-1 row-span-1 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-start shadow-md">
                    <div className="font-semibold border-[0.5px] border-gray-200 w-full p-2">
                        <p>Succesful Buy positions / All Buy positions:</p>
                    </div>
                    <Gauge
                        value={otherData.chartTwo.succesfullBuyPositions ?? 0}
                        startAngle={-90}
                        endAngle={90}
                        cornerRadius="50%"
                        sx={{
                            [`& .${gaugeClasses.valueText}`]: {
                                fontSize: 16,
                                transform: "translate(0px, -30px)",
                            },
                            [`& .${gaugeClasses.valueArc}`]: {
                                fill: "var(--customBlue)",
                            },
                        }}
                        text={({ value }) =>
                            `${value}% / ${
                                otherData.chartTwo.allBuyPositions ?? 0
                            }`
                        }
                    />
                </div>

                <div className="col-span-1 row-span-1 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-start relative shadow-md">
                    <div className="font-semibold border-[0.5px] border-gray-200 w-full p-2">
                        <p>Succesful Sell positions / All Sell positions:</p>
                    </div>
                    <Gauge
                        value={
                            otherData.chartThree.succesfullSellPositions ?? 0
                        }
                        startAngle={-90}
                        endAngle={90}
                        cornerRadius="50%"
                        sx={{
                            [`& .${gaugeClasses.valueText}`]: {
                                fontSize: 16,
                                transform: "translate(0px, -30px)",
                            },
                            [`& .${gaugeClasses.valueArc}`]: {
                                fill: "var(--customYellow)",
                            },
                        }}
                        text={({ value }) =>
                            `${value}% / ${
                                otherData.chartThree.allSellPositions ?? 0
                            }`
                        }
                    />
                </div>
                <div className="col-span-1 row-span-1 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-start shadow-md">
                    <div className="font-semibold border-[0.5px] border-gray-200 w-full p-2">
                        <p>Succesfull positions All / Avg. per month::</p>
                    </div>
                    {/* Box to disable interactions with chart on mobile devices */}
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
                            colors={["var(--customYellow), var(--sell)"]}
                            xAxis={[
                                {
                                    scaleType: "band",
                                    data: ["All", "Avg."],
                                    categoryGapRatio: 0.7,
                                } as ExtendedChartsXAxisProps,
                            ]}
                            series={[
                                {
                                    data: [
                                        otherData.chartFour.allBuyPositions ??
                                            0,
                                        otherData.chartFour
                                            .averageBuyPositionsPerMonth ?? 0,
                                    ],
                                    color: "var(--buy)",
                                    valueFormatter: (value) =>
                                        `${value} positions`,
                                },
                            ]}
                            borderRadius={5}
                            margin={{
                                top: 25,
                                bottom: 25,
                                left: 60,
                                right: 40,
                            }}
                        />
                    </Box>
                </div>
                <div className="col-span-1 row-span-1 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-start shadow-md">
                    <div className="font-semibold border-[0.5px] border-gray-200 w-full p-2">
                        <p>Lost positions All / Avg. per month:</p>
                    </div>
                    {/* Box to disable interactions with chart on mobile devices */}
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
                            colors={["var(--customYellow), var(--sell)"]}
                            xAxis={[
                                {
                                    scaleType: "band",
                                    data: ["All", "Avg."],
                                    categoryGapRatio: 0.7,
                                } as ExtendedChartsXAxisProps,
                            ]}
                            series={[
                                {
                                    data: [
                                        otherData.chartFive.allSellPositions ??
                                            0,
                                        otherData.chartFive
                                            .averageSellPositionsPerMonth ?? 0,
                                    ],
                                    color: "var(--sell)",
                                    valueFormatter: (value) =>
                                        `${value} positions`,
                                },
                            ]}
                            borderRadius={5}
                            margin={{
                                top: 25,
                                bottom: 25,
                                left: 60,
                                right: 40,
                            }}
                        />
                    </Box>
                </div>
                <div className="col-span-1 row-span-1 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-start shadow-md">
                    <div className="font-semibold border-[0.5px] border-gray-200 w-full p-2">
                        <p>Avarege time in position:</p>
                    </div>
                    {/* Box to disable interactions with chart on mobile devices */}
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
                            colors={["var(--customYellow), var(--sell)"]}
                            xAxis={[
                                {
                                    scaleType: "band",
                                    data: ["Buy", "Sell"],
                                    categoryGapRatio: 0.7,
                                } as ExtendedChartsXAxisProps,
                            ]}
                            series={[
                                {
                                    data: [
                                        otherData.chartSix
                                            .averageTimeInBuyPosition ?? 0,
                                        otherData.chartSix
                                            .averageTimeInSellPosition ?? 0,
                                    ],
                                    color: "var(--customBlue)",
                                    valueFormatter: (value) => `${value} hours`,
                                },
                            ]}
                            borderRadius={5}
                            margin={{
                                top: 25,
                                bottom: 25,
                                left: 60,
                                right: 40,
                            }}
                        />
                    </Box>
                </div>
                <div className="col-span-1 row-span-1 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-start shadow-md">
                    <div className="font-semibold border-[0.5px] border-gray-200 w-full p-2">
                        <p>Max seq. of win / loss transactions</p>
                    </div>
                    {/* Box to disable interactions with chart on mobile devices */}
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
                            colors={["var(--customYellow), var(--sell)"]}
                            xAxis={[
                                {
                                    scaleType: "band",
                                    data: ["Buy", "Sell"],
                                    categoryGapRatio: 0.7,
                                } as ExtendedChartsXAxisProps,
                            ]}
                            series={[
                                {
                                    data: [
                                        otherData.chartSeven
                                            .sequenceProfitable ?? 0,
                                        otherData.chartSeven.sequenceLost ?? 0,
                                    ],
                                    color: "var(--customOrange)",
                                    valueFormatter: (value) =>
                                        `${value} in a row`,
                                },
                            ]}
                            borderRadius={5}
                            margin={{
                                top: 25,
                                bottom: 25,
                                left: 60,
                                right: 40,
                            }}
                        />
                    </Box>
                </div>
            </div>
        </ThemeProvider>
    );
}
