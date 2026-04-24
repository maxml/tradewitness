'use client';

import { motion } from 'framer-motion';
import { Section } from '@/components/ui/Section';
import { GraduationCap, Brain, Cog, Code2 } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

export default function AboutPage() {
    const { t } = useLocale();

    const interests = [
        {
            icon: Brain,
            title: t.about.interests.ml.title,
            description: t.about.interests.ml.description,
        },
        {
            icon: Cog,
            title: t.about.interests.automation.title,
            description: t.about.interests.automation.description,
        },
        {
            icon: Code2,
            title: t.about.interests.ai.title,
            description: t.about.interests.ai.description,
        },
        {
            icon: GraduationCap,
            title: t.about.interests.research.title,
            description: t.about.interests.research.description,
        },
    ];

    return (
        <div className="pt-16">
            <Section title={t.about.title} subtitle={t.about.subtitle}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Story */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="space-y-6"
                    >
                        <div className="prose dark:prose-invert">
                            <p className="text-lg text-neutral-600 dark:text-neutral-400">
                                {t.about.intro}
                            </p>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                {t.about.story1}
                            </p>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                {t.about.story2}
                            </p>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                {t.about.story3}
                            </p>
                        </div>
                    </motion.div>

                    {/* Stats & Interests */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="space-y-8"
                    >
                        {/* Interests Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {interests.map((interest, index) => (
                                <motion.div
                                    key={interest.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800"
                                >
                                    <interest.icon className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                                        {interest.title}
                                    </h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        {interest.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Quick Facts */}
                        <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
                            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
                                {t.about.quickFacts.title}
                            </h3>
                            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                                <li>{t.about.quickFacts.location}</li>
                                <li>{t.about.quickFacts.education}</li>
                                <li>{t.about.quickFacts.status}</li>
                                <li>{t.about.quickFacts.learning}</li>
                            </ul>
                        </div>
                    </motion.div>
                </div>
            </Section>
        </div>
    );
}
