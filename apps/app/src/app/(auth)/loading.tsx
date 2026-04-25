import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
    return (
        <div className="background-class h-screen flex-center overflow-hidden">
            <Spinner size={40} />
        </div>
    );
}
