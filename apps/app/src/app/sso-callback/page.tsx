"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Spinner } from "@/components/ui/spinner";

export default function SSOCallbackPage() {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
            <Spinner size={40} label="Signing you in…" />
            <AuthenticateWithRedirectCallback />
        </div>
    );
}
