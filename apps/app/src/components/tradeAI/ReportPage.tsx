"use client";

import React, { useState } from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { ArrowUpLeft, Coins } from "lucide-react";
import { CustomButton } from "../CustomButton";
import GeneratedReport from "./GeneratedReport";
import CustomLoading from "../CustomLoading";
import { getPlural } from "@/lib/utils";
import { Category, ReportType } from "@/types/tradeAI.types";
import { useUser } from "@clerk/nextjs";
import { saveReport } from "@/server/actions/archive";
import { toast } from "sonner";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "../ui/hover-card";

interface ReportPageProps {
    goBackButton: string;
    tokens: number | undefined;
    report: ReportType | null;
    setReport: React.Dispatch<React.SetStateAction<ReportType | null>>;
    setTokens: React.Dispatch<React.SetStateAction<number | undefined>>;
}

export default function ReportPage({
    goBackButton,
    tokens,
    report,
    setReport,
    setTokens,
}: ReportPageProps) {
    const { user } = useUser();

    const [selectCategory, setSelectCategory] =
        useState<Category>("moneyManagement");

    const handleSaveReport = async () => {
        if (user && report) {
            const response = await saveReport(report, user.id);
            toast.success("The report has been saved successfully!");
            console.log(response);
        } else {
            toast.error("Try again later!");
        }
    };

    if (report) {
        return (
            <div className="flex flex-col justify-between h-full pb-2">
                <div className="relative flex max-md:flex-col md:items-center justify-between px-4 py-4 md:px-8">
                    <Link
                        href={`/private/${
                            goBackButton === "Archive"
                                ? "reports-history"
                                : "tradeAI"
                        }`}
                        className="relative group hidden md:inline-block cursor-pointer">
                        <div className="flex items-center gap-2 mb-2 text-[#3D3929]">
                            <ArrowUpLeft size={16} />
                            {goBackButton}
                        </div>
                        <span className="absolute left-0 bottom-0 block h-[0.3px] w-0 bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
                    </Link>

                    <div className="flex gap-2 md:gap-6">
                        <Select
                            value={selectCategory}
                            onValueChange={(value: Category) =>
                                setSelectCategory(value)
                            }>
                            <SelectTrigger className="w-[180px] hover:bg-[#f1efe8] rounded-lg duration-300 text-zinc-500">
                                <SelectValue placeholder="Choose category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="moneyManagement">
                                        Money management
                                    </SelectItem>
                                    <SelectItem value="instruments">
                                        Instruments
                                    </SelectItem>
                                    <SelectItem value="timeManagement">
                                        Time management
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <CustomButton
                            onClick={handleSaveReport}
                            isBlack={false}>
                            Save report
                        </CustomButton>
                        <HoverCard>
                            <HoverCardTrigger className="cursor-pointer duration-100 text-[.9rem] flex gap-1 items-center">
                                <div className="p-2 flex items-center gap-2 cursor-pointer relative">
                                    <Coins className="text-[#da7756]" />
                                    {tokens}{" "}
                                    <span className="hidden md:block">
                                        {getPlural(
                                            tokens ?? 0,
                                            "Token",
                                            "Tokens"
                                        )}
                                    </span>
                                    <div className="absolute border border-gray-500 w-[14px] h-[14px] text-[.6rem] rounded-full hidden md:flex items-center justify-center top-1 -right-2">
                                        i
                                    </div>
                                </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="">
                                <div className="border-b border-gray-300 flex justify-between items-center py-3">
                                    <p>Report</p>
                                    <p>1 token</p>
                                </div>
                                <div className="border-b border-gray-300 flex justify-between items-center py-3">
                                    <p>Follow up question</p>
                                    <p>2 tokens</p>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <p>
                                        Every new user receives 5 free tokens to
                                        test all AI features.
                                    </p>
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    </div>
                </div>
                <GeneratedReport
                    report={report}
                    setReport={setReport}
                    setTokens={setTokens}
                    selectCategory={selectCategory}
                />
            </div>
        );
    } else {
        return (
            <div className="h-screen flex items-center justify-center">
                <CustomLoading />
            </div>
        );
    }
}
