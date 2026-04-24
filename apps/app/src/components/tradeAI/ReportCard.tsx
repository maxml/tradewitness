import TypingAnimation from "@/features/ai/typingAnimation";
import { dialogWindowType } from "@/types/tradeAI.types";
import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import CustomLoading from "../CustomLoading";

export const ReportCard = ({
    items,
    loading,
}: {
    items: dialogWindowType[];
    loading: boolean;
}) => {
    const prevCountRef = useRef(items.length);

    const [animateFrom, setAnimateFrom] = useState<number>(Infinity);

    useEffect(() => {
        if (items.length > prevCountRef.current) {
            setAnimateFrom(prevCountRef.current);
            prevCountRef.current = items.length;
        }

        if (items.length < prevCountRef.current) {
            prevCountRef.current = items.length;
            setAnimateFrom(Infinity);
        }
    }, [items.length]);
    return (
        <div className="relative mx-auto px-4 md:px-0 flex-col w-full max-w-3xl">
            <AutoScrollDiv height="calc(100% - 50px)" items={items}>
                {items.map((item, index) => {
                    const isNew = index >= animateFrom;

                    if (item.type === "user") {
                        return (
                            <div key={index} className="mb-8 flex justify-end">
                                <div className="flex flex-col gap-6 max-w-full md:max-w-[66%]">
                                    <div className="flex gap-2 bg-neutral-200 rounded-full py-3 px-6 items-end">
                                        {item.content.map((text, i) => (
                                            <p
                                                key={i}
                                                className="text-zinc-600 text-[.9rem]">
                                                {text}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    return (
                        <div key={index} className="mb-8 leading-7">
                            {isNew ? (
                                // only the newly appended message animates
                                <TypingAnimation
                                    items={item.content}
                                    typingSpeed={25}
                                />
                            ) : (
                                // everything else just shows up
                                <>
                                    {item.content.map((text, i) => (
                                        <h1 key={i} className="mb-2">
                                            {text}
                                        </h1>
                                    ))}
                                </>
                            )}
                        </div>
                    );
                })}
                {loading && <CustomLoading />}
            </AutoScrollDiv>
        </div>
    );
};

interface AutoScrollDivProps {
    children: ReactNode;
    height: string;
    className?: string;
    items: dialogWindowType[];
}

const AutoScrollDiv: React.FC<AutoScrollDivProps> = ({
    children,
    height,
    className = "",
    items,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        bottomRef.current?.scrollIntoView({ block: "end" });
    }, [items.length]);

    return (
        <div
            ref={containerRef}
            className={`overflow-y-auto mb-[120px] ${className}`}
            style={{ height }}>
            {children}
            <div ref={bottomRef} />
        </div>
    );
};
