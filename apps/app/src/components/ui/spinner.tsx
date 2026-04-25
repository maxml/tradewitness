import { Loader2 } from "lucide-react";

type Props = {
    size?: number;
    label?: string;
    className?: string;
};

export function Spinner({ size = 32, label, className }: Props) {
    return (
        <div
            role="status"
            aria-live="polite"
            className={`flex h-full w-full flex-col items-center justify-center gap-3 ${className ?? ""}`}
        >
            <Loader2 className="animate-spin text-zinc-500" size={size} aria-hidden="true" />
            {label ? <span className="text-sm text-zinc-500">{label}</span> : null}
            <span className="sr-only">Loading…</span>
        </div>
    );
}
