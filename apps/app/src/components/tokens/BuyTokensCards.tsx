"use client";

import { Check } from "lucide-react";
import React, { useEffect } from "react";

import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { checkoutCredits } from "@/server/actions/stripe";
import { useUser } from "@clerk/nextjs";

export default function BuyTokensCards() {
    const { user } = useUser();

    useEffect(() => {
        loadStripe(process.env.NEXT_PUBLIC_PUBLISHABLE_STRIPE_API_KEY!);
    }, []);

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        if (query.get("success")) {
            toast.success("Order placed!");
        }

        if (query.get("canceled")) {
            toast.error("Order canceled!");
        }
    }, []);

    const handleGoToCheckout = async (plan: string) => {
        if (!user) {
            return;
        }
        const transaction = {
            plan,
            buyerId: user?.id,
        };

        await checkoutCredits(transaction);
    };
    return (
        <div className="md:min-h-[30rem] px-2 md:px-0 2xl:w-2/3 flex flex-col gap-4 lg:flex-row md:gap-0">
            <div className="border border-zinc-300 md:h-[38rem] flex-1 flex flex-col gap-5 rounded-xl lg:max-w-[400px] px-6 pt-6 pb-10 md:pb-6 mt-[1rem]">
                <div className="flex flex-col gap-1">
                    <p className="flex items-center text-2xl">Stripe</p>
                    <div className="flex gap-1 items-baseline relative ml-4 mt-2">
                        <div className="absolute -left-4 top-0 text-xl text-zinc-500">
                            $
                        </div>
                        <div className="text-5xl">5</div>
                        <div className="relative text-zinc-500">
                            / 20 Tokens
                        </div>
                    </div>
                    <p className="text-[.9rem] mt-2 mr-2">
                        Perfect for testing, our AI-powered reports can help you
                        boost your productivity and fix mistakes.
                    </p>
                </div>
                <div className="flex flex-col">
                    <button
                        onClick={() => handleGoToCheckout("5")}
                        className="bg-black text-white py-[.75rem] px-[1rem] rounded-full">
                        Buy Tokens
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                        <Check size={12} />
                        <p className="text-[.9rem]">Support the project</p>
                    </div>
                    <p className="ml-5">
                        (Your support will help us to make this project better
                        and add new features in the future)
                    </p>
                    <div className="flex gap-2 items-center">
                        <Check size={12} />
                        <p className="text-[.9rem]">20 tokens</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Check size={12} />
                        <p className="text-[.9rem]">
                            Free access to Calendar, History and Statistics
                        </p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Check size={12} />
                        <p className="text-[.9rem]">
                            Access to latest Claude AI model - Sonet 3.7
                        </p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Check size={12} />
                        <p className="text-[.9rem]">
                            History page for your AI reports.
                        </p>
                    </div>
                </div>
            </div>
            <div className="border border-claude bg-claudeBackground md:h-[40rem] flex-1 rounded-xl lg:max-w-[400px] flex flex-col gap-6 px-6 pt-6 pb-10 md:pb-6">
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <p className="flex items-center text-2xl">Crypto</p>
                        <span className="ml-1 rounded-md border border-claude px-2 py-1 text-claude">
                            Coming soon
                        </span>
                    </div>
                    <div className="flex gap-1 items-baseline relative ml-4 mt-2">
                        <div className="absolute -left-4 top-0 text-xl text-zinc-500">
                            $
                        </div>
                        <div className="text-5xl">Custom</div>
                        <div className="relative text-zinc-500">
                            / 100 Tokens
                        </div>
                    </div>
                    <p className="text-[.9rem] mt-2 mr-2">
                        Perfect for busy traders, our AI reports help you stay
                        ahead in a fast-changing trading environment.
                    </p>
                </div>
                <div className="flex flex-col">
                    <button
                        className="bg-claude opacity-50 text-white py-[.75rem] px-[1rem] rounded-full"
                        disabled>
                        Buy Tokens
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                        <Check size={12} />
                        <p className="text-[.9rem]">Support the project</p>
                    </div>
                    <p className="ml-5">
                        (Your support will help us to make this project better
                        and add new features in the future)
                    </p>
                    <div className="flex gap-2 items-center">
                        <Check size={12} />
                        <p className="text-[.9rem]">100 tokens</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Check size={12} />
                        <p className="text-[.9rem]">
                            Secure transactions using smart contracts.
                        </p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Check size={12} />
                        <p className="text-[.9rem]">
                            Supports Etherium, BNB, USDC, USDT and DAI.
                        </p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Check size={12} />
                        <p className="text-[.9rem]">
                            Free access to Calendar, History and Statistics
                        </p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Check size={12} />
                        <p className="text-[.9rem]">
                            Access to latest Claude AI model - Sonet 3.7
                        </p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Check size={12} />
                        <p className="text-[.9rem]">
                            History page for your AI reports.
                        </p>
                    </div>
                </div>
            </div>
            <div className="border border-zinc-300 md:h-[38rem] flex-1 flex flex-col gap-6 rounded-xl lg:max-w-[400px] px-6 pt-6 pb-10 md:pb-6 mt-[1rem]">
                <div className="flex flex-col gap-1">
                    <p className="flex items-center text-2xl">Stripe</p>
                    <div className="flex gap-1 items-baseline relative ml-4 mt-2">
                        <div className="absolute -left-4 top-0 text-xl text-zinc-500">
                            $
                        </div>
                        <div className="text-5xl">10</div>
                        <div className="relative text-zinc-500">
                            / 60 Tokens
                        </div>
                    </div>
                    <p className="text-[.9rem] mt-2 mr-2">
                        Perfect for busy traders, our AI reports help you stay
                        ahead in a fast-changing trading environment.
                    </p>
                </div>
                <div className="flex flex-col">
                    <button
                        onClick={() => handleGoToCheckout("10")}
                        className="bg-black text-white py-[.75rem] px-[1rem] rounded-full">
                        Buy Tokens
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                        <Check size={12} />
                        <p className="text-[.9rem]">Support the project</p>
                    </div>
                    <p className="ml-5">
                        (Your support will help us to make this project better
                        and add new features in the future)
                    </p>
                    <div className="flex gap-2 items-center">
                        <Check size={12} />
                        <p className="text-[.9rem]">60 tokens</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Check size={12} />
                        <p className="text-[.9rem]">
                            Free access to Calendar, History and Statistics
                        </p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Check size={12} />
                        <p className="text-[.9rem]">
                            Access to latest Claude AI model - Sonet 3.7
                        </p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Check size={12} />
                        <p className="text-[.9rem]">
                            History page for your AI reports.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
