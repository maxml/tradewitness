"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { setSearchQuery } from "@/redux/slices/strategySlice";

export default function SearchStrategy() {
    const dispatch = useAppDispatch();
    const searchQuery = useAppSelector((state) => state.strategies.searchQuery);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (inputRef.current === null) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            console.log(
                "Key pressed:",
                e.key,
                "Meta:",
                e.metaKey,
                "Ctrl:",
                e.ctrlKey
            );
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setSearchQuery(e.target.value));
    };

    return (
        <div className="relative w-full max-w-md">
            <input
                ref={inputRef}
                type="text"
                placeholder="Search strategies..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-4 pr-14 text-sm shadow-sm focus:outline-none"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-xs text-gray-500">
                <kbd className="rounded border border-gray-300 px-1.5 py-0.5">
                    ⌘
                </kbd>
                <kbd className="rounded border border-gray-300 px-1.5 py-0.5">
                    K
                </kbd>
            </div>
        </div>
    );
}
