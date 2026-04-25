import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { LocaleProvider } from '@/context/LocaleContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'TradeWitness | The Ultimate Trading Journal',
    template: '%s | TradeWitness',
  },
  description:
    'TradeWitness is an AI-powered trading journal that helps you track, analyze, and improve your trading performance.',
  keywords: ['Trading', 'Journal', 'AI', 'Analytics', 'Finance'],
  authors: [{ name: 'TradeWitness' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Dzulfikar Yudha Pranata',
    title: 'Dzulfikar Yudha Pranata | AI & Automation Engineer',
    description: 'Physics student exploring AI, machine learning, and automation engineering.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dzulfikar Yudha Pranata | AI & Automation Engineer',
    description: 'Physics student exploring AI, machine learning, and automation engineering.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <LocaleProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
