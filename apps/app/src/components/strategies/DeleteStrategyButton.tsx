"use client";

import {
    addStrategyToTheState,
    deleteLocalStrategy,
} from "@/redux/slices/strategySlice";
import { useAppDispatch } from "@/redux/store";
import { deleteStrategyFromDB } from "@/server/actions/strategies";
import { Strategy } from "@/types/strategies.types";
import { Trash2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { CustomButton } from "../CustomButton";

export default function DeleteStrategyButton({
    strategy,
}: {
    strategy: Strategy;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const dispatch = useAppDispatch();
    const handleDeleteStrategy = async (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();

        const originalStrategy = strategy;

        setIsLoading(true);
        try {
            dispatch(deleteLocalStrategy({ id: strategy.id }));
            await deleteStrategyFromDB(strategy.id);
            toast.success("Strategy deleted successfully!");
        } catch (error) {
            console.error("Failed to delete strategy:", error);
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("Unknown error occurred!");
            }
            dispatch(addStrategyToTheState(originalStrategy));
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <button
                    disabled={isLoading}
                    onClick={(e) => {
                        e?.preventDefault();
                        e?.stopPropagation();
                        setIsDialogOpen(true);
                    }}
                    className="p-1 rounded-md md:hover:bg-neutral-200 disabled:hover:bg-transparent disabled:text-neutral-400">
                    <Trash2 size={18} />
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <div className="sm:max-w-[380px] flex flex-col justify-between min-h-[120px]">
                    <DialogHeader className="mb-2">
                        <DialogTitle className="text-lg">
                            Delete Strategy
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-zinc-600">
                        Do you want to delete the strategy &quot;{strategy.strategyName}&quot;?
                    </p>
                    <div className="flex gap-6 justify-end mt-6">
                        <DialogClose asChild>
                            <CustomButton isBlack={false}>
                                Cancel
                            </CustomButton>
                        </DialogClose>
                        <CustomButton
                            isBlack
                            disabled={isLoading}
                            onClick={async (e) => {
                                await handleDeleteStrategy(e);
                                setIsDialogOpen(false);
                            }}
                        >
                            Delete
                        </CustomButton>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
