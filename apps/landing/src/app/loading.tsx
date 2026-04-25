import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div
            role="status"
            aria-live="polite"
            className="flex min-h-[60vh] flex-col items-center justify-center gap-4"
        >
            <Loader2
                className="h-10 w-10 animate-spin text-neutral-700 dark:text-neutral-200"
                aria-hidden="true"
            />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading…</p>
            <span className="sr-only">Loading</span>
        </div>
    );
}
