"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { CustomButton } from "../CustomButton";
import { CirclePlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { addCapitalFormSchema } from "@/zodSchema/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addCapitalOrUpdate } from "@/server/actions/user";
import { toast } from "sonner";
import { useAppDispatch } from "@/redux/store";
import { changeLocalCapital } from "@/redux/slices/statisticsSlice";

export default function AddCapitalDialog() {
    const [capital, setCapital] = useState("");
    const [open, setOpen] = useState(false);

    const dispatch = useAppDispatch();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof addCapitalFormSchema>>({
        resolver: zodResolver(addCapitalFormSchema),
        defaultValues: {
            capital: "",
        },
    });

    const onSubmit = async ({ capital }: { capital: string }) => {
        const data = await addCapitalOrUpdate(capital);
        if (data?.error) {
            toast.error("An error occurred. Please try again.");
        } else {
            toast.success("Capital added successfully.");
            dispatch(changeLocalCapital(capital));
            setOpen(false);
        }
    };
    return (
        <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
            <DialogTrigger asChild>
                <CustomButton isBlack={false}>
                    <div className="flex items-center gap-2">
                        <CirclePlus size={16} />
                        Capital
                    </div>
                </CustomButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle className="text-lg">
                            Add / Change capital.
                        </DialogTitle>
                        <DialogDescription>
                            If you add capital you will be able to track your
                            results and get AI reports.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 py-4">
                        {errors.capital && (
                            <span className="text-[.75rem] text-red-500 mb-1">
                                {errors.capital.message}
                            </span>
                        )}
                        <Input
                            id="capital"
                            value={capital}
                            {...register("capital")}
                            onChange={(e) => setCapital(e.target.value)}
                            className="col-span-3"
                            placeholder="Enter capital"
                        />
                    </div>
                    <DialogFooter>
                        <CustomButton isBlack type="submit" className="w-full">
                            Save changes
                        </CustomButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
