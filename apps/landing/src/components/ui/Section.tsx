'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface SectionProps {
    children: ReactNode;
    className?: string;
    id?: string;
    title?: string;
    subtitle?: string;
}

export function Section({ children, className = '', id, title, subtitle }: SectionProps) {
    return (
        <section id={id} className={`py-24 md:py-32 ${className}`}>
            <div className={`max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8`}>
                {(title || subtitle) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.5 }}
                        className="mb-12"
                    >
                        {title && (
                            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl">
                                {subtitle}
                            </p>
                        )}
                    </motion.div>
                )}
                {children}
            </div>
        </section>
    );
}
