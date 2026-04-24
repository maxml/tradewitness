import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ReduxProvider from "@/components/ReduxProvider";

const mainFont = localFont({
    src: "./fonts/main.woff2",
    variable: "--main",
    weight: "100 900",
});

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
        <html lang="en">
            <body className={`${mainFont.className} antialiased`}>
                <ReduxProvider>
                    <ClerkProvider>{children}</ClerkProvider>
                </ReduxProvider>
            </body>
        </html>
    );
}
