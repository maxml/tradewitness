"use client";

import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { CustomButton } from "../CustomButton";

type DeleteTradeDialogProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    message: string;
    onConfirm: () => Promise<void> | void;
};

export default function DeleteTradeDialog({ isOpen, onOpenChange, message, onConfirm }: DeleteTradeDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <div className="sm:max-w-[380px] flex flex-col justify-between min-h-[120px]">
                    <DialogHeader className="mb-2">
                        <DialogTitle className="text-lg">
                            Delete Trade
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-zinc-600">{message}</p>
                    <div className="flex gap-6 justify-end mt-6">
                        <DialogClose asChild>
                            <CustomButton isBlack={false}>
                                Cancel
                            </CustomButton>
                        </DialogClose>
                        <CustomButton
                            isBlack
                            onClick={async () => {
                                await onConfirm();
                                onOpenChange(false);
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


