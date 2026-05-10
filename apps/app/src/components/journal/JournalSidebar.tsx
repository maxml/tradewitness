"use client";

import { cn } from "@/lib/utils";
import { ChevronRight, FileText, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import dayjs from "dayjs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface JournalSidebarProps {
    dates: string[]; // List of dates with entries (YYYY-MM-DD)
}

type TreeStructure = {
    [year: string]: {
        [month: string]: string[]; // Array of days
    };
};

export function JournalSidebar({ dates }: JournalSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [expandedYears, setExpandedYears] = useState<string[]>([]);
    const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Build tree structure from dates
    const tree: TreeStructure = {};
    dates.forEach((date) => {
        const d = dayjs(date);
        const year = d.format("YYYY");
        const month = d.format("MMM"); // Jan, Feb, etc.
        const day = date;

        if (!tree[year]) tree[year] = {};
        if (!tree[year][month]) tree[year][month] = [];
        tree[year][month].push(day);
    });

    // Sort years descending
    const sortedYears = Object.keys(tree).sort((a, b) => Number(b) - Number(a));

    const toggleYear = (year: string) => {
        setExpandedYears((prev) =>
            prev.includes(year)
                ? prev.filter((y) => y !== year)
                : [...prev, year]
        );
    };

    const toggleMonth = (monthKey: string) => {
        setExpandedMonths((prev) =>
            prev.includes(monthKey)
                ? prev.filter((m) => m !== monthKey)
                : [...prev, monthKey]
        );
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            const formattedDate = dayjs(date).format("YYYY/MM/DD");
            router.push(`/private/journal/${formattedDate}`);
            setIsCalendarOpen(false);
        }
    };

    return (
        <div className="w-64 border-r border-border h-full bg-background flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="font-semibold text-sm text-muted mb-4 px-2 tracking-wide uppercase">
                    Journal Entries
                </div>
                <div className="space-y-1">
                    {sortedYears.map((year) => (
                        <div key={year}>
                            <button
                                onClick={() => toggleYear(year)}
                                className="flex items-center w-full px-2 py-2 text-sm font-medium text-foreground hover:bg-card-alt rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <ChevronRight
                                    className={cn(
                                        "h-4 w-4 mr-2 text-muted transition-transform",
                                        expandedYears.includes(year) && "rotate-90"
                                    )}
                                />
                                {year}
                            </button>

                            {expandedYears.includes(year) && (
                                <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
                                    {Object.keys(tree[year]).map((month) => {
                                        const monthKey = `${year}-${month}`;
                                        return (
                                            <div key={monthKey}>
                                                <button
                                                    onClick={() => toggleMonth(monthKey)}
                                                    className="flex items-center w-full px-2 py-1.5 text-sm text-muted hover:text-foreground hover:bg-card-alt rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                >
                                                    <ChevronRight
                                                        className={cn(
                                                            "h-3.5 w-3.5 mr-2 text-muted transition-transform",
                                                            expandedMonths.includes(monthKey) && "rotate-90"
                                                        )}
                                                    />
                                                    {month}
                                                </button>

                                                {expandedMonths.includes(monthKey) && (
                                                    <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-2">
                                                        {tree[year][month].map((date) => {
                                                            const d = dayjs(date);
                                                            const isActive = pathname === `/private/journal/${d.format("YYYY/MM/DD")}`;
                                                            return (
                                                                <Link
                                                                    key={date}
                                                                    href={`/private/journal/${d.format("YYYY/MM/DD")}`}
                                                                    className={cn(
                                                                        "flex items-center w-full px-2 py-1.5 text-sm rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                                        isActive
                                                                            ? "bg-primary/10 text-primary font-medium border border-primary/20"
                                                                            : "text-muted hover:bg-card-alt hover:text-foreground border border-transparent"
                                                                    )}
                                                                >
                                                                    <FileText className="h-3.5 w-3.5 mr-2 opacity-70" />
                                                                    {d.format("D MMM")}
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                    {sortedYears.length === 0 && (
                        <div className="text-sm text-muted px-2 py-8 text-center flex flex-col items-center">
                            <FileText className="h-8 w-8 mb-2 opacity-20" />
                            No entries yet
                        </div>
                    )}
                </div>
            </div>
            
            <div className="p-4 border-t border-border bg-card">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            Select day
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-border bg-card shadow-none" align="start">
                        <Calendar
                            mode="single"
                            onSelect={handleDateSelect}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
