import { Trades } from "@/types";
import { createSlice } from "@reduxjs/toolkit";

type documentState = {
    listOfTrades: Trades[] | null;
    monthViewSummary: Record<string, number>;
    yearViewSummary: Record<string, number>;
    totalOfParticularYearSummary: Record<string, number>;
    tradeDetailsForEachDay: Record<
        string,
        {
            result: number;
            win: number;
            lost: number;
        }
    >;
};

const initialState: documentState = {
    listOfTrades: null,
    monthViewSummary: {},
    yearViewSummary: {},
    totalOfParticularYearSummary: {},
    tradeDetailsForEachDay: {},
};

const tradeRecordsSlice = createSlice({
    name: "tradeRecords",
    initialState,
    reducers: {
        setListOfTrades: (state, action) => {
            // Normalize incoming trades from server to avoid Number(undefined) -> NaN on frontend
            state.listOfTrades = (action.payload ?? []).map((trade: Trades) => ({
                ...trade,
                // Ensure result is at least an empty string (Number("") -> 0), never undefined
                result: trade.result === null ? 0 : trade.result,
            }));
        },
        updateListOfTrades: (state, action) => {
            if (state.listOfTrades === null) {
                state.listOfTrades = [];
            }
            const newRecord = action.payload;

            // If this is an open trade (no closeDate), just push to the end
            if (!newRecord.closeDate || newRecord.closeDate === "") {
                state.listOfTrades.push(newRecord);
                return;
            }

            // For closed trades, use binary search to maintain chronological order by closeDate
            const newRecordTime = new Date(newRecord.closeDate).getTime();

            let left = 0;
            let right = state.listOfTrades.length - 1;
            let insertionIndex = state.listOfTrades.length;

            while (left <= right) {
                const mid = Math.floor((left + right) / 2);
                const midRecord = state.listOfTrades[mid];

                // Skip open trades in binary search (they don't have closeDate for comparison)
                if (!midRecord.closeDate || midRecord.closeDate === "") {
                    // If we hit an open trade, just insert before it
                    insertionIndex = mid;
                    break;
                }

                const midTime = new Date(midRecord.closeDate).getTime();

                if (midTime < newRecordTime) {
                    left = mid + 1;
                } else {
                    insertionIndex = mid;
                    right = mid - 1;
                }
            }
            state.listOfTrades.splice(insertionIndex, 0, newRecord);
        },
        removeRecordFromListOfTrades: (state, action) => {
            if (state.listOfTrades !== null) {
                state.listOfTrades = state.listOfTrades.filter(
                    (trade) => trade.id !== action.payload
                );
            }
        },
        updateTradeInList: (state, action) => {
            if (state.listOfTrades !== null) {
                const index = state.listOfTrades.findIndex(
                    (trade) => trade.id === action.payload.id
                );
                if (index !== -1) {
                    state.listOfTrades[index] = action.payload;
                }
            }
        },
        setInitialMonthViewSummary: (state, action) => {
            state.monthViewSummary = action.payload;
        },
        setMonthViewSummary: (state, action) => {
            const { month, value } = action.payload;
            // Guard against undefined/null values from optional result
            if (value === undefined || value === null) return;

            if (state.monthViewSummary[month] !== undefined) {
                state.monthViewSummary[month] += value;
            } else {
                state.monthViewSummary[month] = value;
            }
            if (state.monthViewSummary[month] === 0) {
                delete state.monthViewSummary[month];
            }
        },
        setInitialYearViewSummary: (state, action) => {
            state.yearViewSummary = action.payload;
        },
        setYearViewSummary: (state, action) => {
            const { year, value } = action.payload;
            // Guard against undefined/null values from optional result
            if (value === undefined || value === null) return;

            if (
                state.yearViewSummary[year] !== undefined &&
                state.yearViewSummary[year] !== null
            ) {
                state.yearViewSummary[year] += value;
            } else {
                state.yearViewSummary[year] = value;
            }
            if (state.yearViewSummary[year] === 0) {
                delete state.yearViewSummary[year];
            }
        },
        setInitialTotalOfParticularYearSummary: (state, action) => {
            state.totalOfParticularYearSummary = action.payload;
        },
        setTotalOfParticularYearSummary: (state, action) => {
            const { year, value } = action.payload;
            // Guard against undefined/null values from optional result
            if (value === undefined || value === null) return;

            if (
                state.totalOfParticularYearSummary[year] !== undefined &&
                state.totalOfParticularYearSummary[year] !== null
            ) {
                state.totalOfParticularYearSummary[year] += value;
            } else {
                state.totalOfParticularYearSummary[year] = value;
            }
            if (state.totalOfParticularYearSummary[year] === 0) {
                delete state.totalOfParticularYearSummary[year];
            }
        },
        setTradeDetailsForEachDay: (state, action) => {
            state.tradeDetailsForEachDay = action.payload;
        },
        updateTradeDetailsForEachDay: (state, action) => {
            const { result, date, value } = action.payload;
            // Guard against undefined/null values from optional result
            if (result === undefined || result === null) return;

            if (state.tradeDetailsForEachDay[date]) {
                state.tradeDetailsForEachDay[date] = {
                    result: (state.tradeDetailsForEachDay[date].result +=
                        value),
                    win:
                        result >= 0
                            ? (state.tradeDetailsForEachDay[date].win += value)
                            : state.tradeDetailsForEachDay[date].win,
                    lost:
                        result < 0
                            ? (state.tradeDetailsForEachDay[date].lost += value)
                            : state.tradeDetailsForEachDay[date].lost,
                };
            } else {
                state.tradeDetailsForEachDay[date] = {
                    result: 1,
                    win: result >= 0 ? 1 : 0,
                    lost: result < 0 ? 1 : 0,
                };
            }
        },
    },
});

export const {
    setListOfTrades,
    updateListOfTrades,
    removeRecordFromListOfTrades,
    updateTradeInList,
    setInitialMonthViewSummary,
    setMonthViewSummary,
    setInitialYearViewSummary,
    setYearViewSummary,
    setInitialTotalOfParticularYearSummary,
    setTotalOfParticularYearSummary,
    setTradeDetailsForEachDay,
    updateTradeDetailsForEachDay,
} = tradeRecordsSlice.actions;

export default tradeRecordsSlice.reducer;
