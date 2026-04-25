"use client";

import { useSignUp } from "@clerk/nextjs";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
    const { signUp, isLoaded, setActive } = useSignUp();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [code, setCode] = useState("");
    const [step, setStep] = useState<"form" | "verify">("form");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const signUpWithGoogle = () => {
        if (!isLoaded) return;
        setError(null);
        return signUp.authenticateWithRedirect({
            strategy: "oauth_google",
            redirectUrl: "/sso-callback",
            redirectUrlComplete: "/",
        });
    };

    const submitEmail = async (e: FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;
        setError(null);
        setSubmitting(true);
        try {
            await signUp.create({
                emailAddress: email,
                password,
                phoneNumber: phone,
            });
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            await signUp.preparePhoneNumberVerification({ strategy: "phone_code" });
            setStep("verify");
        } catch (err: unknown) {
            setError(extractClerkError(err));
        } finally {
            setSubmitting(false);
        }
    };

    const submitCode = async (e: FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;
        setError(null);
        setSubmitting(true);
        try {
            const res = await signUp.attemptPhoneNumberVerification({ code });
            if (res.status === "complete") {
                await setActive({ session: res.createdSessionId });
                router.push("/");
            } else {
                setError("Verification incomplete. Please check your code.");
            }
        } catch (err: unknown) {
            setError(extractClerkError(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl bg-white/5 p-8 shadow-xl backdrop-blur">
            <h1 className="text-center text-2xl font-semibold text-white">Create account</h1>

            <button
                type="button"
                onClick={signUpWithGoogle}
                disabled={!isLoaded || submitting}
                className="flex items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 font-medium text-gray-800 transition hover:bg-gray-100 disabled:opacity-50"
            >
                <GoogleIcon />
                Continue with Google
            </button>

            <div className="flex items-center gap-3 text-xs text-white/60">
                <div className="h-px flex-1 bg-white/20" />
                or
                <div className="h-px flex-1 bg-white/20" />
            </div>

            {step === "form" ? (
                <form onSubmit={submitEmail} className="flex flex-col gap-3">
                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                    />
                    <Input
                        type="tel"
                        placeholder="Phone (e.g. +380...)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        pattern="^\+[1-9]\d{6,14}$"
                        title="Use E.164 format, e.g. +380501234567"
                    />
                    <button
                        type="submit"
                        disabled={!isLoaded || submitting}
                        className="rounded-lg bg-white px-4 py-3 font-medium text-gray-900 transition hover:bg-gray-100 disabled:opacity-50"
                    >
                        {submitting ? "Creating..." : "Sign up"}
                    </button>
                    <div id="clerk-captcha" />
                </form>
            ) : (
                <form onSubmit={submitCode} className="flex flex-col gap-3">
                    <p className="text-sm text-white/70">
                        We sent a verification code to {phone}. Enter it below.
                    </p>
                    <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="Verification code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                    />
                    <button
                        type="submit"
                        disabled={!isLoaded || submitting}
                        className="rounded-lg bg-white px-4 py-3 font-medium text-gray-900 transition hover:bg-gray-100 disabled:opacity-50"
                    >
                        {submitting ? "Verifying..." : "Verify & continue"}
                    </button>
                </form>
            )}

            {error && <p className="text-sm text-red-300">{error}</p>}

            <p className="text-center text-sm text-white/70">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-white underline">
                    Sign in
                </Link>
            </p>
        </div>
    );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className="rounded-lg bg-white/10 px-4 py-3 text-white placeholder-white/50 outline-none ring-1 ring-white/20 focus:ring-white/60"
        />
    );
}

function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8L6.2 33C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.4 35.5 44 30.2 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
    );
}

function extractClerkError(err: unknown): string {
    if (
        typeof err === "object" &&
        err !== null &&
        "errors" in err &&
        Array.isArray((err as { errors: unknown }).errors)
    ) {
        const first = (err as { errors: { longMessage?: string; message?: string }[] }).errors[0];
        return first?.longMessage ?? first?.message ?? "Something went wrong.";
    }
    return "Something went wrong.";
}
