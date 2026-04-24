import Image from "next/image";
import { CustomButton } from "../CustomButton";
import { SignUpButton } from "@clerk/nextjs";
import TypingAnimation from "@/features/typing-text/TypingAnimation";
import { StatsGridPageTwo } from "../StatsGridPageTwo";
import { fakeDataChartTwo } from "@/data/data";

const HomePageStart = () => {
    return (
        <>
            <div
                id="nav-trigger-section"
                className="flex flex-col items-center px-3 lg:px-48">
                <div className="mt-10 md:mt-20 font-thin border-[.25px] border-zinc-300 py-2 px-4 rounded-full text-[.7rem] md:text-[.9rem] text-zinc-500 flex-center gap-2">
                    <div className="flex w-[78px]">
                        <Image
                            src="/fake-user-images/fake-user-1.jpeg"
                            height={25}
                            width={25}
                            alt="fake user"
                            className="rounded-full border-2 border-white"
                        />
                        <Image
                            src="/fake-user-images/fake-user-2.jpeg"
                            height={25}
                            width={25}
                            alt="fake user"
                            className="rounded-full border-2 border-white -translate-x-2"
                        />
                        <Image
                            src="/fake-user-images/fake-user-4.jpeg"
                            height={25}
                            width={25}
                            alt="fake user"
                            className="rounded-full border-2 border-white -translate-x-4"
                        />
                        <Image
                            src="/fake-user-images/fake-user-3.jpeg"
                            height={25}
                            width={25}
                            alt="fake user"
                            className="rounded-full border-2 border-white -translate-x-6"
                        />
                    </div>
                    <div className="h-[20px] w-[0.5px] bg-zinc-300" />
                    Trusted by over 1,000 traders worldwide!
                </div>
                <h1 className="main-text text-[3rem] md:text-[6rem] max-md:my-1">
                    AI Trade Journal
                </h1>
                <div className="mb-6 md:mb-10 flex flex-col items-center">
                    <h2 className="main-text text-[2rem] md:text-[3rem] flex items-center justify-center gap-2">
                        {/* <mark /> */}
                        {/* <span className="text-[var(--customOrange)]">Free</span> and
                    <span className="text-[var(--customBlue)]"> Easy</span> way */}
                        <span className="!opacity-0">X</span>
                        <TypingAnimation />
                        <span className="!opacity-0">X</span>
                    </h2>
                    <h2 className="main-text text-[2rem] md:text-[2rem] text-center">
                        tool to track your trading achievements.
                    </h2>
                </div>
                <CustomButton isBlack>
                    <SignUpButton>
                        <span>Get start - for free</span>
                    </SignUpButton>
                </CustomButton>
            </div>
            <div className="flex-center py-12 px-12 2xl:px-48 max-md:hidden">
                <StatsGridPageTwo
                    start={"20000"}
                    end={"27560"}
                    oterData={fakeDataChartTwo}
                />
            </div>
            <div className="md:hidden py-10">
                <Image
                    src="/start-page-mobile-view.png"
                    width={400}
                    height={300}
                    alt="chart-with-details"
                    className="w-full"
                />
            </div>
        </>
    );
};

export default HomePageStart;
