"use client";

import FeedbackCard from "@/components/feedback/FeedbackCard";
import AutoResizeTextarea from "@/features/archive/AutoResizeTextarea";
import { ArrowUp } from "lucide-react";
import { useState } from "react";
import { createFeedback } from "@/server/actions/feedback";
import { toast } from "sonner";
import { feedbacks } from "@/data/data";

export default function FeedbackPage() {
    const [feedbackInput, setFeedbackInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!feedbackInput.trim() || isSubmitting) return;
        try {
            setIsSubmitting(true);
            const res = await createFeedback({ message: feedbackInput.trim() });
            if (res.success) {
                toast.success("Thanks for your feedback!");
                setFeedbackInput("");
            } else {
                toast.error(res.message ?? "Could not submit feedback");
            }
        } catch {
            toast.error("Unexpected error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className="relative h-full w-full flex flex-col gap-6 items-center justify-center px-4 xl:px-0">
            {feedbacks.map((feedback) => (
                <FeedbackCard
                    key={feedback.avatar}
                    {...feedback}
                    className={feedback.position}
                />
            ))}
            <h1 className="text-6xl font-bold">Feedback</h1>

            <div className="relative backdrop-blur-2xl rounded-2xl border border-gray-200 shadow-sm w-full max-w-3xl overflow-hidden min-h-[120px] flex justify-between flex-col ">
                <AutoResizeTextarea
                    value={feedbackInput}
                    placeholder="Write your feedback here..."
                    onChange={(e) =>
                        setFeedbackInput(e.target.value)
                    }
                />

                {feedbackInput.length > 0 && (
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="absolute top-3 right-3 bg-[#da7756] p-2 rounded-xl disabled:opacity-50">
                        <ArrowUp className="h-[18px] w-[18px] text-white" />
                    </button>
                )}
            </div>
        </div>

    );
}