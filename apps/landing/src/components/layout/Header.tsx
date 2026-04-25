'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useLocale } from '@/context/LocaleContext';

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [navigatingToApp, setNavigatingToApp] = useState(false);
    const pathname = usePathname();
    const { t } = useLocale();

    const handleGoToApp = (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Let the browser handle middle-click / cmd+click / ctrl+click (open in new tab).
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        setNavigatingToApp(true);
    };

    const navLinks = [
        { href: '/', label: t.nav.home },
        { href: '/about', label: t.nav.about },
        { href: '/projects', label: t.nav.projects },
        { href: '/experience', label: t.nav.experience },
        { href: '/skills', label: t.nav.skills },
        { href: '/blog', label: t.nav.blog },
        { href: '/contact', label: t.nav.contact },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-800/50 supports-[backdrop-filter]:bg-white/50 supports-[backdrop-filter]:dark:bg-neutral-950/50">
            <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <motion.span
                            whileHover={{ scale: 1.02 }}
                            className="text-xl font-bold text-neutral-900 dark:text-white"
                        >
                            Pranata
                        </motion.span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === link.href
                                    ? 'text-neutral-900 dark:text-white'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                    }`}
                            >
                                {link.label}
                                {pathname === link.href && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 rounded-lg -z-10"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center space-x-2">
                        <a
                            href={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}
                            onClick={handleGoToApp}
                            className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
                        >
                            Go to App
                        </a>
                        <LanguageToggle />
                        <ThemeToggle />
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? (
                                <X className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                            ) : (
                                <Menu className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden overflow-hidden"
                        >
                            <div className="py-4 space-y-1">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`block px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === link.href
                                            ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            <AnimatePresence>
                {navigatingToApp && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-white/90 backdrop-blur-sm dark:bg-neutral-950/90"
                        role="status"
                        aria-live="polite"
                    >
                        <Loader2 className="h-10 w-10 animate-spin text-neutral-700 dark:text-neutral-200" aria-hidden="true" />
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Opening the app…</p>
                        <span className="sr-only">Loading the app</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
