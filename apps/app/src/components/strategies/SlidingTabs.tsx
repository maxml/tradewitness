"use client";
import React, { useRef, useState, useEffect } from "react";
import { GalleryVerticalEnd, ListTodo } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { setActiveTab } from "@/redux/slices/strategySlice";

const SlidingTabs: React.FC = () => {
    const dispatch = useAppDispatch();
    const activeTab = useAppSelector((state) => state.strategies.activeTab);
    const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
    const historyRef = useRef<HTMLButtonElement>(null);
    const rulesRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const updateUnderline = () => {
            const activeRef = activeTab === "history" ? historyRef : rulesRef;
            if (activeRef.current) {
                const rect = activeRef.current.getBoundingClientRect();
                const parentRect =
                    activeRef.current.parentElement?.getBoundingClientRect();
                if (parentRect) {
                    setUnderlineStyle({
                        left: rect.left - parentRect.left,
                        width: rect.width,
                    });
                }
            }
        };

        updateUnderline();
        window.addEventListener("resize", updateUnderline);
        return () => window.removeEventListener("resize", updateUnderline);
    }, [activeTab]);

    return (
        <div className="flex flex-col items-center">
            <div className="relative flex gap-8">
                <button
                    ref={rulesRef}
                    onClick={() => dispatch(setActiveTab("rules"))}
                    className={`py-3 flex gap-2 transition-colors duration-300 ${activeTab === "rules"
                        ? "text-black"
                        : "text-neutral-500 hover:text-black"
                        }`}>
                    <ListTodo />
                    View rules
                </button>
                <button
                    ref={historyRef}
                    onClick={() => dispatch(setActiveTab("history"))}
                    className={`py-3 flex gap-2 transition-colors duration-300 ${activeTab === "history"
                        ? "text-black"
                        : "text-neutral-500 hover:text-black"
                        }`}>
                    <GalleryVerticalEnd />
                    View history
                </button>

                <div
                    className="absolute bottom-0 h-0.5 bg-black transition-all duration-300 ease-in-out"
                    style={{
                        left: `${underlineStyle.left}px`,
                        width: `${underlineStyle.width}px`,
                    }}
                />
            </div>
        </div>
    );
};
export default SlidingTabs;