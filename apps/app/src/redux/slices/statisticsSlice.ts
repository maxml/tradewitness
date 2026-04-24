import { createSlice } from "@reduxjs/toolkit";

type documentState = {
    capital: string | undefined;
};

const initialState: documentState = {
    capital: undefined,
};

const statisticsSlice = createSlice({
    name: "statistics",
    initialState,
    reducers: {
        changeLocalCapital: (state, action) => {
            state.capital = action.payload;
        },
    },
});

export const { changeLocalCapital } = statisticsSlice.actions;

export default statisticsSlice.reducer;
