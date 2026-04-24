import BuyTokensCards from "@/components/tokens/BuyTokensCards";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { getPlural } from "@/lib/utils";
import { checkIfUserHasTokens } from "@/server/actions/user";
import { RiCoinsLine } from "react-icons/ri";
import React from "react";

export default async function Page() {
    const tokens = await checkIfUserHasTokens();

    return (
        <div className="flex lg:gap-4 2xl:gap-8 md:items-center justify-center flex-col md:h-full relative">
            <h1 className="md:text-center text-[2rem] pl-4">Buy Tokens</h1>
            <div className="top-7 md:top-12 absolute right-4 md:right-12 flex gap-6">
                {!tokens.success ? (
                    <HoverCard>
                        <HoverCardTrigger className="cursor-pointer duration-100 text-[.9rem] flex gap-1 items-center">
                            <div className="rounded-lg border border-gray-200 p-2 flex items-center gap-2 cursor-pointer">
                                No tokens
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="">
                            <p className="text-[.9rem] text-sell">
                                {tokens.message}
                            </p>
                        </HoverCardContent>
                    </HoverCard>
                ) : tokens.tokens ? (
                    <div className="p-2 flex items-center gap-2">
                        <RiCoinsLine size={20} className="text-[#da7756]" />
                        {tokens.tokens}{" "}
                        {getPlural(tokens.tokens, "Token", "Tokens")}
                    </div>
                ) : (
                    <div className="p-2 flex items-center gap-2">
                        <RiCoinsLine size={20} className="text-[#da7756]" />0
                        Tokens
                    </div>
                )}
            </div>
            <BuyTokensCards />
            {/* <p className="text-zinc-400 text-center max-md:py-2">
                If you have any issues. Please contact support:
                tradejournal@gmail.com
            </p> */}
        </div>
    );
}
