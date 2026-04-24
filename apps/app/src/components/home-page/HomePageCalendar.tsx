import Image from "next/image";

const HomePageCalendar = () => {
    return (
        <div className="flex-center md:py-10 px-3 md:px-12 2xl:px-48">
            <div className="md:py-10 md:bg-primary rounded-xl w-full flex flex-col items-center justify-center background-class">
                <div className="flex flex-col items-center justify-center gap-4 pb-10">
                    <span className="border border-zinc-200 py-1 px-2 rounded-md text-[.7rem] md:text-[.9rem] shadow-md">
                        Calendar
                    </span>

                    <h1 className="text-[2rem] md:text-[3rem] text-center font-semibold">
                        Visual Calendar. <br /> Simple. Powerful.
                    </h1>
                    <p className="max-md:px-2 text-[.9rem] md:text-[1rem]">
                        Simple and intuitive way to collect and visualise your
                        trades.
                    </p>
                </div>
                <div className="rounded-lg max-md:hidden">
                    <Image
                        src="/calendar.png"
                        alt="calendar"
                        width={1200}
                        height={900}
                    />
                </div>
                <div className="md:hidden">
                    <Image
                        src="/mobile-calendar.png"
                        width={400}
                        height={600}
                        alt="iphone-mokup"
                    />
                </div>
            </div>
        </div>
    );
};

export default HomePageCalendar;
