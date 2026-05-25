"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import dayjs from "dayjs";

export default function JournalPage() {
    const today = dayjs().format("YYYY/MM/DD");

    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-background">
            <div className="p-4 bg-card border border-border rounded-lg mb-6 flex items-center justify-center">
                <Image
                    src="/main-logo.png"
                    width={48}
                    height={48}
                    alt="Logo"
                    className="w-12 h-12"
                />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
                Your Trading Journal
            </h1>
            <p className="text-muted max-w-md mb-8 text-base leading-relaxed">
                Document your trading journey, write down your thoughts, and review your performance.
            </p>
            <Button asChild size="lg">
                <Link href={`/private/journal/${today}`}>
                    Write Today&apos;s Entry
                </Link>
            </Button>
        </div>
    );
}
