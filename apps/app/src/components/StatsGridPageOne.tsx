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
            <div className="grid grid-rows-10 md:grid-rows-4 grid-cols-1 md:grid-cols-4 gap-6 p-4 md:p-8 bg-background w-full">
                <div className="max-md:h-[500px] col-span-1 md:col-span-3 row-span-3 bg-card rounded-lg border border-border flex flex-col items-center justify-start overflow-hidden">
                    <div className="font-semibold border-b border-border w-full p-4 bg-card-alt/50">
                        <p className="text-sm tracking-tight text-muted uppercase">Equity Curve Summary</p>
                    </div>
                    {/* Box to disable interactions with chart on mobile devices */}
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            p: 2,
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
                                        colors: ["hsl(var(--destructive))", "hsl(var(--success))"],
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
                                    opacity: 0.1,
                                },
                                "& .MuiChartsGrid-line": {
                                    stroke: "hsl(var(--border) / 0.5)",
                                },
                                "& .MuiChartsAxis-tick, & .MuiChartsAxis-line": {
                                    stroke: "hsl(var(--muted))",
                                },
                                "& .MuiChartsAxis-tickLabel": {
                                    fill: "hsl(var(--muted))",
                                    fontFamily: "var(--font-geist-mono)",
                                },
                            }}
                        />
                    </Box>
                </div>
                <div className="col-span-1 row-span-1 bg-card rounded-lg border border-border flex flex-col items-center justify-start overflow-hidden">
                    <div className="font-semibold border-b border-border w-full p-3 bg-card-alt/50 text-center">
                        <p className="text-[10px] tracking-widest text-muted uppercase">Win Rate (Total)</p>
                    </div>
                    <Gauge
                        value={otherData.chartOne.succesfullPositions ?? 0}
                        startAngle={-90}
                        endAngle={90}
                        cornerRadius="50%"
                        sx={{
                            p: 2,
                            [`& .${gaugeClasses.valueText}`]: {
                                fontSize: 14,
                                transform: "translate(0px, -20px)",
                                fill: "hsl(var(--foreground))",
                                fontFamily: "var(--font-geist-mono)",
                            },
                            [`& .${gaugeClasses.valueArc}`]: {
                                fill: "hsl(var(--accent))",
                            },
                            [`& .${gaugeClasses.referenceArc}`]: {
                                fill: "hsl(var(--border))",
                            },
                        }}
                        text={({ value }) =>
                            `${value}% / ${
                                otherData.chartOne.allPositions ?? 0
                            }`
                        }
                    />
                </div>
                <div className="col-span-1 row-span-1 bg-card rounded-lg border border-border flex flex-col items-center justify-start overflow-hidden">
                    <div className="font-semibold border-b border-border w-full p-3 bg-card-alt/50 text-center">
                        <p className="text-[10px] tracking-widest text-muted uppercase">Win Rate (Buy)</p>
                    </div>
                    <Gauge
                        value={otherData.chartTwo.succesfullBuyPositions ?? 0}
                        startAngle={-90}
                        endAngle={90}
                        cornerRadius="50%"
                        sx={{
                            p: 2,
                            [`& .${gaugeClasses.valueText}`]: {
                                fontSize: 14,
                                transform: "translate(0px, -20px)",
                                fill: "hsl(var(--foreground))",
                                fontFamily: "var(--font-geist-mono)",
                            },
                            [`& .${gaugeClasses.valueArc}`]: {
                                fill: "hsl(var(--primary))",
                            },
                            [`& .${gaugeClasses.referenceArc}`]: {
                                fill: "hsl(var(--border))",
                            },
                        }}
                        text={({ value }) =>
                            `${value}% / ${
                                otherData.chartTwo.allBuyPositions ?? 0
                            }`
                        }
                    />
                </div>

                <div className="col-span-1 row-span-1 bg-card rounded-lg border border-border flex flex-col items-center justify-start overflow-hidden">
                    <div className="font-semibold border-b border-border w-full p-3 bg-card-alt/50 text-center">
                        <p className="text-[10px] tracking-widest text-muted uppercase">Win Rate (Sell)</p>
                    </div>
                    <Gauge
                        value={
                            otherData.chartThree.succesfullSellPositions ?? 0
                        }
                        startAngle={-90}
                        endAngle={90}
                        cornerRadius="50%"
                        sx={{
                            p: 2,
                            [`& .${gaugeClasses.valueText}`]: {
                                fontSize: 14,
                                transform: "translate(0px, -20px)",
                                fill: "hsl(var(--foreground))",
                                fontFamily: "var(--font-geist-mono)",
                            },
                            [`& .${gaugeClasses.valueArc}`]: {
                                fill: "hsl(var(--success))",
                            },
                            [`& .${gaugeClasses.referenceArc}`]: {
                                fill: "hsl(var(--border))",
                            },
                        }}
                        text={({ value }) =>
                            `${value}% / ${
                                otherData.chartThree.allSellPositions ?? 0
                            }`
                        }
                    />
                </div>
                <div className="col-span-1 row-span-1 bg-card rounded-lg border border-border flex flex-col items-center justify-start overflow-hidden">
                    <div className="font-semibold border-b border-border w-full p-3 bg-card-alt/50 text-center">
                        <p className="text-[10px] tracking-widest text-muted uppercase">Monthly Accuracy (Win)</p>
                    </div>
                    {/* Box to disable interactions with chart on mobile devices */}
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            p: 1,
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
                                    data: ["All", "Avg."],
                                    categoryGapRatio: 0.6,
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
                                    color: "hsl(var(--success))",
                                    valueFormatter: (value) =>
                                        `${value} positions`,
                                },
                            ]}
                            borderRadius={4}
                            margin={{
                                top: 20,
                                bottom: 20,
                                left: 45,
                                right: 20,
                            }}
                            sx={{
                                "& .MuiChartsAxis-tickLabel": {
                                    fill: "hsl(var(--muted))",
                                    fontSize: 10,
                                    fontFamily: "var(--font-geist-mono)",
                                },
                                "& .MuiChartsAxis-line": {
                                    stroke: "hsl(var(--border))",
                                }
                            }}
                        />
                    </Box>
                </div>
                <div className="col-span-1 row-span-1 bg-card rounded-lg border border-border flex flex-col items-center justify-start overflow-hidden">
                    <div className="font-semibold border-b border-border w-full p-3 bg-card-alt/50 text-center">
                        <p className="text-[10px] tracking-widest text-muted uppercase">Monthly Accuracy (Loss)</p>
                    </div>
                    {/* Box to disable interactions with chart on mobile devices */}
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            p: 1,
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
                                    data: ["All", "Avg."],
                                    categoryGapRatio: 0.6,
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
                                    color: "hsl(var(--destructive))",
                                    valueFormatter: (value) =>
                                        `${value} positions`,
                                },
                            ]}
                            borderRadius={4}
                            margin={{
                                top: 20,
                                bottom: 20,
                                left: 45,
                                right: 20,
                            }}
                            sx={{
                                "& .MuiChartsAxis-tickLabel": {
                                    fill: "hsl(var(--muted))",
                                    fontSize: 10,
                                    fontFamily: "var(--font-geist-mono)",
                                },
                                "& .MuiChartsAxis-line": {
                                    stroke: "hsl(var(--border))",
                                }
                            }}
                        />
                    </Box>
                </div>
                <div className="col-span-1 row-span-1 bg-card rounded-lg border border-border flex flex-col items-center justify-start overflow-hidden">
                    <div className="font-semibold border-b border-border w-full p-3 bg-card-alt/50 text-center">
                        <p className="text-[10px] tracking-widest text-muted uppercase">Avg. Time in Position</p>
                    </div>
                    {/* Box to disable interactions with chart on mobile devices */}
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            p: 1,
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
                                    data: ["Buy", "Sell"],
                                    categoryGapRatio: 0.6,
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
                                    color: "hsl(var(--primary))",
                                    valueFormatter: (value) => `${value} hours`,
                                },
                            ]}
                            borderRadius={4}
                            margin={{
                                top: 20,
                                bottom: 20,
                                left: 45,
                                right: 20,
                            }}
                            sx={{
                                "& .MuiChartsAxis-tickLabel": {
                                    fill: "hsl(var(--muted))",
                                    fontSize: 10,
                                    fontFamily: "var(--font-geist-mono)",
                                },
                                "& .MuiChartsAxis-line": {
                                    stroke: "hsl(var(--border))",
                                }
                            }}
                        />
                    </Box>
                </div>
                <div className="col-span-1 row-span-1 bg-card rounded-lg border border-border flex flex-col items-center justify-start overflow-hidden">
                    <div className="font-semibold border-b border-border w-full p-3 bg-card-alt/50 text-center">
                        <p className="text-[10px] tracking-widest text-muted uppercase">Max Sequence (Wins/Loss)</p>
                    </div>
                    {/* Box to disable interactions with chart on mobile devices */}
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            p: 1,
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
                                    data: ["Win", "Loss"],
                                    categoryGapRatio: 0.6,
                                } as ExtendedChartsXAxisProps,
                            ]}
                            series={[
                                {
                                    data: [
                                        otherData.chartSeven
                                            .sequenceProfitable ?? 0,
                                        otherData.chartSeven.sequenceLost ?? 0,
                                    ],
                                    color: "hsl(var(--accent))",
                                    valueFormatter: (value) =>
                                        `${value} in a row`,
                                },
                            ]}
                            borderRadius={4}
                            margin={{
                                top: 20,
                                bottom: 20,
                                left: 45,
                                right: 20,
                            }}
                            sx={{
                                "& .MuiChartsAxis-tickLabel": {
                                    fill: "hsl(var(--muted))",
                                    fontSize: 10,
                                    fontFamily: "var(--font-geist-mono)",
                                },
                                "& .MuiChartsAxis-line": {
                                    stroke: "hsl(var(--border))",
                                }
                            }}
                        />
                    </Box>
                </div>
            </div>
        </ThemeProvider>
    );
}
