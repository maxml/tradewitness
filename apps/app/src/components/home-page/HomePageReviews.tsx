import { userReviews } from "@/data/data";
import Image from "next/image";
import { FaStar } from "react-icons/fa6";

export default function HomePageReviews() {
    return (
        <div className="flex-center max-md:pb-10 md:py-10 px-3 lg:px-48 overflow-hidden">
            <div className="py-10 rounded-xl w-full flex flex-col items-center justify-center ">
                <div className="flex flex-col items-center justify-center gap-4 pb-10">
                    <span className="border border-zinc-200 py-1 px-2 rounded-md text-[.7rem] md:text-[.9rem] shadow-md">
                        Reviews
                    </span>

                    <h1 className="text-[2rem] md:text-[3rem] text-center font-semibold">
                        Join today.
                    </h1>
                    <p className="max-md:px-2 text-[.9rem] md:text-[1rem]">
                        Trusted by thousands of professionals. Become one of
                        them.
                    </p>
                </div>
                <div className="relative overflow-hidden flex flex-col gap-5">
                    <div className="fading-gradient" />
                    <div className="flex items-center gap-3 -translate-x-32 animate-slide-right">
                        {userReviews.slice(0, 5).map((user) => (
                            <ReviewCard
                                key={user.name}
                                name={user.name}
                                review={user.review}
                                image={user.image}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-3 translate-x-32 animate-slide-left">
                        {userReviews.slice(5, 10).map((user) => (
                            <ReviewCard
                                key={user.name}
                                name={user.name}
                                review={user.review}
                                image={user.image}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-3 -translate-x-32 animate-slide-right">
                        {userReviews.slice(10, 15).map((user) => (
                            <ReviewCard
                                key={user.name}
                                name={user.name}
                                review={user.review}
                                image={user.image}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

const ReviewCard = ({
    name,
    review,
    image,
}: {
    name: string;
    review: string;
    image: string;
}) => {
    return (
        <div className="rounded-lg border border-gray-200 p-2 md:p-3 w-[300px] md:w-[400px]">
            <div className="flex items-center gap-3">
                <Image
                    src={image}
                    alt="user image"
                    height={30}
                    width={30}
                    className="w-5 md:w-8 h-5 md:h-8 rounded-full"
                />
                <div>
                    <div className="flex max-md:text-[.6rem]">
                        <FaStar className="text-[var(--customYellow)] " />
                        <FaStar className="text-[var(--customYellow)] " />
                        <FaStar className="text-[var(--customYellow)]" />
                        <FaStar className="text-[var(--customYellow)]" />
                        <FaStar className="text-[var(--customYellow)]" />
                    </div>
                    <p className="text-zinc-400 max-md:text-[.75rem]">{name}</p>
                </div>
            </div>
            <p className="text-[.6rem] md:text-[.9rem]">{review}</p>
        </div>
    );
};
