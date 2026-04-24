import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import calendarReducer from "./slices/calendarSlice";
import tradeRecordsReducer from "./slices/tradeRecordsSlice";
import historyPageReducer from "./slices/historyPageSlice";
import statisticsReducer from "./slices/statisticsSlice";
import strategyReducer from "./slices/strategySlice";

const store = configureStore({
    reducer: {
        calendar: calendarReducer,
        tradeRecords: tradeRecordsReducer,
        history: historyPageReducer,
        statistics: statisticsReducer,
        strategies: strategyReducer,
    },
    devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
