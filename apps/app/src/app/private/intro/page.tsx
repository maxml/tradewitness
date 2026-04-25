"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Handshake, MessageCircle, Star } from "lucide-react";
import { completeOnboarding } from "@/server/actions/user";
import { useRouter } from "next/navigation";

const STEPS = [
    {
        title: "Welcome to TradeWitness",
        body: "A quick tour of our main features. Let's get started!",
        image: "/main-logo.png",
    },
    {
        title: "Step 1: Calendar",
        body: "See you trade history in a visual calendar.",
        image: "/intro/intro-calendar.svg",
    },
    {
        title: "Step 2: Add open and closed positions",
        body: "You can add open trades and close them later.",
        video: "/intro/intro-open-close-position.webm",
    },
    {
        title: "Step 3: Add a strategy",
        body: "Add your strategies so you can stay consistent.",
        image: "/intro/intro-strategies.png",
    },
    {
        title: "Step 4: Track how you follow your rules",
        body: "Attach a strategy to your trade and check off open/close rules.",
        image: "/intro/intro-trade-with-strategy.png",
    },
    {
        title: "Step 5: History page",
        body: "Switch between open and closed trades. Filter by instrument, column, and time. Edit or delete trades.",
        image: "/intro/intro-history.png",
    },
    {
        title: "Step 6: Journal page",
        body: "Journal your thoughts and insights.",
        image: "/intro/intro-journal.svg",
    },
    {
        title: "Step 7: Get your AI report",
        body: "Get your AI report and improve your trading. Currently it's paid, but we're working on a free version.",
        video: "/intro/intro-ai-report.webm",
    },
    {
        title: "Support & Feedback",
        body: "Give us feedback, for you its a few seconds, for us its a big help. Also give us a ⭐ on GitHub if you like the app. More stars - more features.",
        last: true,
    },
];

export default function Page() {
    const [step, setStep] = useState(0);
    const router = useRouter();
    const [finishing, startFinish] = useTransition();
    const total = STEPS.length;
    const isFirst = step === 0;
    const isLast = step === total - 1;

    const finishOnboarding = () => {
        startFinish(async () => {
            await completeOnboarding();
            router.push("/private/calendar");
        });
    };

    // Optional: arrow-key navigation
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" && !isLast) setStep((s) => Math.min(total - 1, s + 1));
            if (e.key === "ArrowLeft" && !isFirst) setStep((s) => Math.max(0, s - 1));
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isFirst, isLast, total]);

    return (
        <div className="mx-auto flex h-full w-full flex-col p-12 absolute top-0 left-0 right-0 bottom-0 bg-white z-[9999]">
            <div className="text-center mb-8">
                <h2 className="mb-2 text-3xl font-bold">{STEPS[step].title}</h2>
                <p className="text-zinc-500 text-lg">{STEPS[step].body}</p>
            </div>
            
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                {STEPS[step].image && (
                    <Image 
                        src={STEPS[step].image} 
                        alt={STEPS[step].title} 
                        width={800} 
                        height={600} 
                        className="object-contain max-h-full transition-all duration-500 shadow-2xl rounded-2xl border border-zinc-100" 
                    />
                )}
                {STEPS[step].video && (
                    <video 
                        src={STEPS[step].video} 
                        width={900} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="rounded-2xl shadow-2xl border border-zinc-100 max-h-full"
                    />
                )}
                {STEPS[step].last && (
                    <div className="w-full h-full flex items-center justify-center gap-6 flex-wrap">
                        <div className="flex flex-col gap-2 p-6 border border-zinc-200 rounded-xl w-[280px] hover:bg-zinc-50 transition-colors">
                            <MessageCircle size={32} className="text-blue-500" />
                            <h1 className="text-xl font-bold">Feedback</h1>
                            <p className="text-sm text-zinc-500">Every message is valuable and can spark real change.</p>
                        </div>
                        <div className="flex flex-col gap-2 p-6 border border-zinc-200 rounded-xl w-[280px] hover:bg-zinc-50 transition-colors">
                            <Star size={32} className="text-yellow-500" />
                            <h1 className="text-xl font-bold">GitHub</h1>
                            <p className="text-sm text-zinc-500">Stars help us prioritize and build new features.</p>
                        </div>
                        <div className="flex flex-col gap-2 p-6 border border-zinc-200 rounded-xl w-[280px] hover:bg-zinc-50 transition-colors">
                            <Handshake size={32} className="text-green-500" />
                            <h1 className="text-xl font-bold">Collab</h1>
                            <p className="text-sm text-zinc-500">We love working with passionate people.</p>
                        </div>
                    </div>
                )}
            </div>

            <footer className="flex items-center justify-between">
                {!isLast ? (
                    <Button variant="ghost" onClick={finishOnboarding} disabled={finishing}>
                        {finishing ? "Skipping…" : "Skip"}
                    </Button>
                ) : (
                    <span />
                )}
                <div className="flex items-center gap-2">
                    {!isFirst && (
                        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))}>
                            Back
                        </Button>
                    )}
                    {!isLast ? (
                        <Button onClick={() => setStep((s) => Math.min(total - 1, s + 1))}>Next</Button>
                    ) : (
                        <Button onClick={finishOnboarding} disabled={finishing}>
                            {finishing ? "Starting…" : "Start Journal"}
                        </Button>
                    )}
                </div>
            </footer>
            {/* Non-interactive progress dots */}
            <ol
                className="my-6 flex items-center justify-center gap-2 absolute bottom-10 left-1/2 -translate-x-1/2"
                aria-label={`Step ${step + 1} of ${total}`}
            >
                {Array.from({ length: total }).map((_, i) => {
                    const active = i === step;
                    return (

                        <span
                            key={i}
                            className={[
                                "block h-1.5 rounded-full",
                                // smooth animation
                                "transition-all duration-400 ease-in-out motion-safe:transition-all",
                                "will-change-[width,background-color]",
                                active ? "w-4 bg-black/90" : "w-1.5 bg-black/30",
                            ].join(" ")}
                        />

                    );
                })}
            </ol>
        </div>
    );
}
