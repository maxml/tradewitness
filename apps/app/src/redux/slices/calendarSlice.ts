import { createSlice } from "@reduxjs/toolkit";

type documentState = {
    calendarType: "Month" | "Year";
    monthView: {
        month: number | undefined;
        year: number | undefined;
    };
    yearView: number | undefined;
    isDialogOpen: { [key: string]: boolean };
};

const initialState: documentState = {
    calendarType: "Month",
    monthView: { month: undefined, year: undefined },
    yearView: undefined,
    isDialogOpen: {},
};

const calendarSlice = createSlice({
    name: "calendar",
    initialState,
    reducers: {
        setCalendarType: (state, action) => {
            state.calendarType = action.payload;
        },
        setMonthView: (state, action) => {
            const { month, year } = action.payload;
            state.monthView.month = month;
            state.monthView.year = year;
        },
        setYearView: (state, action) => {
            state.yearView = action.payload;
        },
        setIsDialogOpen: (state, action) => {
            const { key, value } = action.payload;
            state.isDialogOpen[key] = value;
        },
    },
});

export const { setCalendarType, setMonthView, setYearView, setIsDialogOpen } =
    calendarSlice.actions;

export default calendarSlice.reducer;
