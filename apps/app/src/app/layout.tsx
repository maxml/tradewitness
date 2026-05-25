import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ReduxProvider from "@/components/ReduxProvider";

export const metadata: Metadata = {
    title: "TradeWitness App",
    description: "AI-Powered Trading Journal",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning className="dark">
            <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`} suppressHydrationWarning>
                <ReduxProvider>
                    <ClerkProvider>{children}</ClerkProvider>
                </ReduxProvider>
            </body>
        </html>
    );
}
