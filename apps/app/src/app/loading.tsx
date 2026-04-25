export default function Loading() {
    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
        >
            <div className="running-algorithm">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
            </div>
            <span className="sr-only">Loading</span>
        </div>
    );
}
