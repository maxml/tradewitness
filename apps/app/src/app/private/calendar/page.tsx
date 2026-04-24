"use client";

import MonthView from "@/components/calendar/MonthView";
import YearView from "@/components/calendar/YearView";
import { useAppSelector } from "@/redux/store";

export default function CalendarPage() {
    const calendarView = useAppSelector((state) => state.calendar.calendarType);

    const isMonthView = calendarView === "Month";
    return isMonthView ? <MonthView /> : <YearView />;
}
