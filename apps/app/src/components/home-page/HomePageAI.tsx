import { MoveUpRight } from "lucide-react";
import Link from "next/link";
import { SiClaude } from "react-icons/si";

const HomePageAi = () => {
    return (
        <div className="max-md:hidden flex-center h-screen p-3">
            <div className="bg-white relative rounded-xl w-full flex flex-col items-center justify-between overflow-hidden h-full">
                <div className="h-[500px] w-full overflow-hidden">
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

                <div className="absolute top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-4">
                    <h1 className="text-[2rem] md:text-[3rem] text-center font-semibold max-md:mb-4">
                        The Best AI Trading Journal
                    </h1>
                    <p className="px-2 md:px-0 w-full md:w-1/2 text-[.9rem] md:text-[1rem] text-center">
                        Stop guessing why some trades succeed while others fail.
                        Trade Journal&apos;s advanced AI pattern recognition can
                        identify hidden factors affecting your performance that
                        might otherwise go unnoticed.
                    </p>
                    <Link
                        href="/sign-in"
                        className="w-full flex justify-center cursor-pointer mt-10">
                        <div className="relative group inline-block">
                            <div className="flex gap-2 mb-2 text-[#3D3929]">
                                Get report <MoveUpRight className="w-[1rem]" />
                            </div>
                            <span className="absolute left-0 bottom-0 block h-[0.3px] w-0 bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
                        </div>
                    </Link>
                    <div className="w-full flex gap-2 items-center justify-center pt-20 md:pt-24">
                        <h2 className="text-xl text-[#3D3929] max-md:text-[1rem]">
                            Powered by Claude
                        </h2>
                        <SiClaude size={24} className="text-[#da7756]" />
                    </div>
                </div>
                <div className="h-[500px] w-full overflow-hidden rotate-180">
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
            </div>
        </div>
    );
};

export default HomePageAi;
