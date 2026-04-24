import { SiClaude } from "react-icons/si";
import AIReportControls from "@/components/tradeAI/AIReportControls";

export default function Page() {
    return (
        <div className="flex flex-col items-center justify-between h-full">
            <div className="h-[500px] overflow-hidden w-full">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover object-bottom">
                    <source src="/ai-video.webm" type="video/webm" />
                    Your browser does not support the video tag.
                </video>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center duration-500">
                <h1 className="relative text-4xl md:text-5xl text-center mb-12 mt-8 text-[#3D3929]">
                    Get your AI report
                </h1>

                <h2 className="md:text-xl text-center text-[#3D3929] px-8 md:px-0">
                    Get a personalized report based on your trading activity.
                </h2>
                <h2 className="md:text-xl text-center mb-12 text-[#3D3929] px-8 md:px-0">
                    Use all power of AI to fix mistakes and improve your
                    results.
                </h2>
                <AIReportControls />
            </div>
            <div className="w-full flex gap-2 items-center justify-center pb-8 md:pb-12">
                <h2 className="md:text-xl text-[#3D3929]">Powered by Claude</h2>
                <SiClaude size={24} className="text-[#da7756]" />
            </div>
        </div>
    );
}
