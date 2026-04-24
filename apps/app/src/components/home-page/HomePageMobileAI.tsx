import { Quote } from "lucide-react";
import Image from "next/image";
import React from "react";

export default function HomePageMobileAiPage() {
    return (
        <div className="md:hidden flex flex-col items-center justify-center">
            <span className="border border-zinc-200 py-1 px-2 rounded-md text-[.7rem] md:text-[.9rem] shadow-md">
                Trade AI
            </span>
            <h1 className="text-[2rem] text-center mt-6">
                The Best AI Trading Journal
            </h1>
            <p className="px-4 md:px-2 text-[.9rem] mt-6 md:text-center text-zinc-500">
                Stop guessing why some trades succeed while others fail. Trade
                Journal&apos;s advanced AI pattern recognition can identify
                hidden factors affecting your performance that might otherwise
                go unnoticed.
            </p>
            <div className="mt-8 flex gap-6 items-center px-4">
                <Quote size={42} className="shrink-0" />
                <h1 className="text-2xl">
                    IMPROVE YOUR TRADING RESULTS IN 3 EASY STEPS
                </h1>
            </div>
            <ul className="w-full px-8 mt-8 flex flex-col gap-4">
                <li>
                    <h1 className="mb-1">
                        <span className="text-claude mr-4">01.</span>Log All
                        Your Trades.
                    </h1>
                    <p className="text-zinc-500 ml-[2.2rem]">
                        Use our simple, intuitive calendar to log all your
                        trades—the more data you add, the better your reports
                        will be.
                    </p>
                </li>
                <li>
                    <h1 className="mb-1">
                        <span className="text-claude mr-4">02.</span>Get Your
                        Report.
                    </h1>
                    <p className="text-zinc-500 ml-[2.2rem]">
                        We use the latest Claude AI to deliver the best possible
                        report tailored for you.
                    </p>
                </li>
                <li>
                    <h1 className="mb-1">
                        <span className="text-claude mr-4">03.</span>Follow Up
                        with a Question
                    </h1>
                    <p className="text-zinc-500 ml-[2.2rem]">
                        Ask any question to better understand your trading
                        mistakes and strengths.
                    </p>
                </li>
            </ul>
            <Image src="/mobile-ai.png" width={400} height={600} alt="test" />
        </div>
    );
}
