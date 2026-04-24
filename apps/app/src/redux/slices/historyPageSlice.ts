import { SortByType, TimeframeType, Trades } from "@/types";
import { createSlice } from "@reduxjs/toolkit";

type documentState = {
    filteredTrades: Trades[] | undefined;
    sortBy: SortByType | undefined;
    timeframe: TimeframeType | undefined;
    activeTab: "openTrades" | "closedTrades";
};

const initialState: documentState = {
    filteredTrades: undefined,
    sortBy: undefined,
    timeframe: undefined,
    activeTab: "openTrades",
};

const historyPageSlice = createSlice({
    name: "historyPage",
    initialState,
    reducers: {
        setFilteredTrades: (state, action) => {
            state.filteredTrades = action.payload;
        },
        setSortBy: (state, action) => {
            state.sortBy = action.payload;
        },
        setTimeframe: (state, action) => {
            state.timeframe = action.payload;
        },
        setActiveTab: (state, action) => {
            state.activeTab = action.payload;
        },
    },
});

export const { setFilteredTrades, setSortBy, setTimeframe, setActiveTab } =
    historyPageSlice.actions;

export default historyPageSlice.reducer;
