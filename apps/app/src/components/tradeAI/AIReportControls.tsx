"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { MoveUpRight } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { checkIfUserHasTokens } from "@/server/actions/user";

export default function AIReportControls() {
    const router = useRouter();
    const trades = useAppSelector((state) => state.tradeRecords.listOfTrades);
    const [loading, setLoading] = useState(false);

    const handleNavigate = async () => {
        if (loading) return;
        setLoading(true);

        if (!trades || trades.length < 3) {
            toast.error(
                "You need at least 3 trades to get the report. Keep trading and try again!"
            );
            setLoading(false);
            return;
        }

        const tokens = await checkIfUserHasTokens();
        if (!tokens.success) {
            toast.error("Could not verify token balance.");
            setLoading(false);
            return;
        }
        if (!tokens.tokens) {
            toast.error(
                "You don't have enough tokens. Visit the tokens page to top up."
            );
            setLoading(false);
            return;
        }

        router.push("/private/tradeAI/report");
    };

    return (
        <div className="flex gap-8 md:gap-12">
            <div onClick={handleNavigate} className="cursor-pointer">
                <div className="relative group inline-block">
                    <div className="flex gap-2 mb-2 text-[#3D3929]">
                        Get report <MoveUpRight className="w-[1rem]" />
                    </div>
                    <span className="absolute left-0 bottom-0 block h-[0.3px] w-0 bg-emerald-400 transition-all duration-300 group-hover:w-full" />
                </div>
            </div>

            <Link href="/private/reports-history" className="cursor-pointer">
                <div className="relative group inline-block">
                    <div className="flex gap-2 mb-2 text-[#3D3929]">
                        Report Archive <MoveUpRight className="w-[1rem]" />
                    </div>
                    <span className="absolute left-0 bottom-0 block h-[0.3px] w-0 bg-emerald-400 transition-all duration-300 group-hover:w-full" />
                </div>
            </Link>
        </div>
    );
}
