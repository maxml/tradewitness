import Image from "next/image";

export default function FeedbackCard({ avatar, name, feedback, color, className }: { avatar: string, name: string, feedback: string, color: string, className: string }) {
    return (
        <div className={`hidden md:flex absolute rounded-2xl border border-gray-200 shadow bg-white w-[320px] overflow-hidden gap-4 px-4 py-2 ${className}`}>
            <div className={`rounded-full ${color} w-12 h-12 flex items-center justify-center`}>
                <Image src={avatar} alt="Feedback" width={42} height={42} />
            </div>
            <div>
                <h1>{name}</h1>
                <p>{feedback}</p>
            </div>
        </div>
    );
}  