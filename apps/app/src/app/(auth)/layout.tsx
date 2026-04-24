import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function AuthLayout({
    children,
}: {
    children: ReactNode;
}) {
    const { userId } = await auth();
    if (userId != null) redirect("/");
    return (
        <div className="background-class h-screen flex-center overflow-hidden">
            {children}
        </div>
    );
}
