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
            <div className="grid grid-rows-5 md:grid-rows-2 grid-cols-1 md:grid-cols-12 gap-6 p-4 md:p-8 bg-background w-full">
                <div className="max-md:h-[350px] col-span-1 md:col-span-4 row-span-1 bg-card rounded-lg border border-border flex flex-col items-center justify-start overflow-hidden">
                    <div className="font-semibold border-b border-border w-full p-4 bg-card-alt/50">
                        <p className="text-sm tracking-tight text-muted uppercase">Capital Performance</p>
                    </div>
                    <OdometerConditionalRendering start={start} end={end} />
                </div>
                <div className="max-md:h-[350px] col-span-1 md:col-span-4 row-span-1 bg-card rounded-lg border border-border flex flex-col items-center justify-start overflow-hidden">
                    <div className="font-semibold border-b border-border w-full p-4 bg-card-alt/50">
                        <p className="text-sm tracking-tight text-muted uppercase">Returns vs. S&P 500</p>
                    </div>
                    <div className="flex gap-6 p-4 bg-card-alt/20 w-full justify-center">
                        <div className="flex gap-2 items-center">
                            <div className="w-[10px] h-[10px] bg-accent rounded-sm" />
                            <p className="text-[10px] text-foreground uppercase tracking-tight">Your returns</p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="w-[10px] h-[10px] bg-zinc-600 rounded-sm" />
                            <p className="text-[10px] text-muted uppercase tracking-tight">S&P 500</p>
                        </div>
                    </div>
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
                                    color: "hsl(var(--accent))",
                                    showMark: false,
                                    label: "Your returns",
                                },
                                {
                                    data:
                                        oterData.chartOne.sp500Alternative ??
                                        [],
                                    color: "hsl(var(--muted) / 0.5)",
                                    showMark: false,
                                    label: "S&P500",
                                },
                            ]}
                            slotProps={{
                                legend: {
                                    hidden: true,
                                },
                            }}
                            margin={{ left: 65, top: 10, right: 30 }}
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
                <div className="max-md:h-[350px] col-span-1 md:col-span-4 row-span-1 bg-card rounded-lg border border-border flex flex-col items-center justify-start overflow-hidden">
                    <div className="font-semibold border-b border-border w-full p-4 bg-card-alt/50">
                        <p className="text-sm tracking-tight text-muted uppercase">Popular Instruments</p>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 p-4 bg-card-alt/20 w-full justify-center">
                        {oterData.chartTwo.topTrades.slice(0, 3).map((trade, i) => (
                            <div key={trade.label} className="flex gap-2 items-center">
                                <div className={`w-[8px] h-[8px] rounded-full ${
                                    i === 0 ? 'bg-primary' : i === 1 ? 'bg-accent' : 'bg-success'
                                }`} />
                                <p className="text-[10px] text-foreground uppercase tracking-tight">
                                    {trade.label} <span className="text-muted font-mono ml-1">{trade.value}</span>
                                </p>
                            </div>
                        ))}
                    </div>
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
                        <PieChart
                            colors={[
                                "hsl(var(--primary))",
                                "hsl(var(--accent))",
                                "hsl(var(--success))",
                                "hsl(var(--muted) / 0.3)",
                            ]}
                            series={[
                                {
                                    data: oterData.chartTwo.topTrades ?? [],
                                    innerRadius: 60,
                                    paddingAngle: 4,
                                    cornerRadius: 4,
                                    highlightScope: {
                                        fade: "global",
                                        highlight: "item",
                                    },
                                },
                            ]}
                            margin={{
                                top: 10,
                                bottom: 10,
                                left: 10,
                                right: 10,
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

                <div className="max-md:h-[350px] col-span-1 md:col-span-5 row-span-1 bg-card rounded-lg border border-border flex flex-col items-center justify-start relative overflow-hidden">
                    <div className="font-semibold border-b border-border w-full p-4 bg-card-alt/50">
                        <p className="text-sm tracking-tight text-muted uppercase">Biggest Gains Day</p>
                    </div>
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
                        <BarChart
                            xAxis={[
                                {
                                    scaleType: "band",
                                    data: oterData.chartThree.dates ?? [],
                                },
                            ]}
                            borderRadius={4}
                            series={[
                                {
                                    data: oterData.chartThree.results ?? [],
                                    color: "hsl(var(--success))",
                                    label: "Earned on This Day",
                                },
                            ]}
                            slotProps={{ legend: { hidden: true } }}
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
                <div className="max-md:h-[350px] col-span-1 md:col-span-7 row-span-1 bg-card rounded-lg border border-border flex flex-col items-center justify-start overflow-hidden">
                    <div className="font-semibold border-b border-border w-full p-4 bg-card-alt/50 text-center">
                        <p className="text-sm tracking-tight text-muted uppercase text-left">Trading Volume by Day</p>
                    </div>
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
                        <BarChart
                            xAxis={[
                                {
                                    scaleType: "band",
                                    data: daysOfTheWeek,
                                },
                            ]}
                            borderRadius={4}
                            series={oterData.chartFour ?? []}
                            slotProps={{
                                legend: {
                                    hidden: true,
                                },
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

function OdometerConditionalRendering({
    start,
    end,
}: {
    start: string | undefined;
    end: string | undefined;
}) {
    if (start !== undefined && end !== undefined) {
        return (
            <div className="flex-1 flex flex-col gap-6 items-center justify-center p-8 bg-card w-full">
                <p className="text-xs uppercase tracking-widest text-muted">Current Capital</p>
                <div className="font-mono text-foreground">
                    <Odometer
                        start={Number(start)}
                        end={Number(end)}
                        width={30}
                        height={50}
                        labelText="$"
                        labelSize={40}
                    />
                </div>
                <div className="bg-success/10 text-success px-3 py-1.5 rounded-full border border-success/20 flex gap-2 items-center">
                    <ArrowUp size={16} />
                    <p className="font-mono font-semibold text-sm">
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
            <div className="flex-1 flex flex-col gap-2 justify-center items-center p-8 w-full">
                <p className="text-xs uppercase tracking-widest text-muted">Current Capital</p>
                <span className="text-5xl font-mono font-bold tracking-tight text-foreground">${start}</span>
            </div>
        );
    } else {
        return (
            <div className="flex-1 flex justify-center items-center p-8 w-full">
                <AddCapitalDialog />
            </div>
        );
    }
}
