import { useAppDispatch } from "@/redux/store";
import { deleteTradeRecord } from "@/server/actions/trades";
import {
    removeRecordFromListOfTrades,
    setMonthViewSummary,
    setYearViewSummary,
    setTotalOfParticularYearSummary,
    updateTradeDetailsForEachDay,
} from "@/redux/slices/tradeRecordsSlice";
import { toast } from "sonner";

export const useDeleteTrade = () => {
    const dispatch = useAppDispatch();

    const handleDeleteTradeRecord = async (
        tradeId: string,
        result: string,
        closeDate: string
    ) => {
        try {
            const [stringDay, month, year] = new Date(closeDate)
                .toLocaleDateString("en-GB")
                .split("/");
            const numericMonth = parseInt(month, 10);
            const convertedMonthView = `${stringDay}-${month}-${year}`;
            const convertedYearView = `${numericMonth}-${year}`;

            await deleteTradeRecord(tradeId);

            dispatch(removeRecordFromListOfTrades(tradeId));
            dispatch(
                setMonthViewSummary({
                    month: convertedMonthView,
                    value: -Number(result),
                })
            );
            dispatch(
                setYearViewSummary({
                    year: convertedYearView,
                    value: -Number(result),
                })
            );
            dispatch(
                setTotalOfParticularYearSummary({
                    year: year,
                    value: -Number(result),
                })
            );
            dispatch(
                updateTradeDetailsForEachDay({
                    date: convertedMonthView,
                    result: Number(result),
                    value: -1,
                })
            );

            toast.success("Record has been deleted!");
        } catch (error) {
            console.log(error);
            toast.error("Failed to delete record. Please try again.");
        }
    };

    return { handleDeleteTradeRecord };
};