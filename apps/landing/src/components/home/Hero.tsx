'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/context/LocaleContext';

export function Hero() {
    const { t } = useLocale();

    return (
        <section className="min-h-screen flex items-center justify-center pt-24 md:pt-32 relative overflow-hidden">
            {/* Subtle Background Gradient */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/5 dark:bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
                <div className="text-center space-y-10">

                    {/* Name */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-[4rem] font-bold text-neutral-900 dark:text-white tracking-tight"
                    >
                        {t.hero.greeting}{' '}
                        <span className="bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                            {t.hero.name}
                        </span>
                    </motion.h1>

                    {/* Tagline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                        className="text-xl sm:text-2xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto font-medium"
                    >
                        {t.hero.tagline}
                    </motion.p>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                        className="text-base sm:text-lg text-neutral-500 dark:text-neutral-500 max-w-2xl mx-auto leading-relaxed"
                    >
                        {t.hero.description}
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                    >
                        <Link href="/projects">
                            <Button size="lg" className="shadow-sm">
                                {t.hero.cta.projects}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <Button variant="secondary" size="lg">
                                {t.hero.cta.contact}
                            </Button>
                        </Link>
                        <a
                            href="https://forms.gle/Eo6wiH7xxZmP8wvc9"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="secondary" size="lg">
                                {t.hero.cta.tutor}
                            </Button>
                        </a>
                    </motion.div>

                    {/* Authority Signals */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="pt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-neutral-500 dark:text-neutral-500 font-medium"
                    >
                        <span>Physics Student</span>
                        <span className="hidden sm:inline">•</span>
                        <span>AI & Automation Focus</span>
                        <span className="hidden sm:inline">•</span>
                        <span>5+ Projects Built</span>
                    </motion.div>

                    {/* Scroll Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 1 }}
                        className="pt-16 hidden md:block" // Hidden on mobile to save space
                    >
                        <div className="w-px h-16 bg-gradient-to-b from-neutral-200 to-transparent dark:from-neutral-800 mx-auto" />
                    </motion.div>
                </div>
            </div>
            {/* Divider Line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-neutral-200 dark:bg-neutral-800 opacity-50" />
        </section>
    );
}
