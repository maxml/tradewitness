import { useAppDispatch } from "@/redux/store";
import { deleteTradeRecord } from "@/server/actions/trades";
import { removeRecordFromListOfTrades } from "@/redux/slices/tradeRecordsSlice";
import { toast } from "sonner";

export const useDeleteOpenTrade = () => {
    const dispatch = useAppDispatch();

    const handleDeleteOpenTrade = async (tradeId: string) => {
        try {
            await deleteTradeRecord(tradeId);
            dispatch(removeRecordFromListOfTrades(tradeId));
            toast.success("Open trade has been deleted!");
        } catch (error) {
            console.log(error);
            toast.error("Failed to delete open trade. Please try again.");
        }
    };

    return { handleDeleteOpenTrade };
};


