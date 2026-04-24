'use client';

import { motion } from 'framer-motion';
import { Section } from '@/components/ui/Section';
import { Briefcase, GraduationCap, FlaskConical, Rocket, Clock, Building2 } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

interface Experience {
    title: string;
    organization: string;
    period: string;
    description: string;
    type: 'academic' | 'research' | 'freelance' | 'project' | 'part-time' | 'full-time';
}

export default function ExperiencePage() {
    const { t } = useLocale();

    const experiences: Experience[] = [
        {
            title: 'AI Engineer',
            organization: 'Lumora Labs',
            period: 'January 2026 - Present',
            description: 'Developing and maintaining AI models for various applications. Collaborating with cross-functional teams to design and implement AI solutions.',
            type: 'freelance',
        },
        {
            title: 'Teaching Assistant Basic Physics II',
            organization: 'Department of Physics, IPB University',
            period: 'January 2026 - Present',
            description: "Assisted in teaching undergraduate Physics II (Electricity & Magnetism), guiding students through core concepts including electric fields, magnetic fields, Maxwell's equations, and electromagnetic waves. Led discussion sessions, supported problem-solving workshops, and helped evaluate assignments and examinations.",
            type: 'part-time',
        },
        {
            title: 'Digital Electronics Laboratory Assistant',
            organization: 'Department of Physics, IPB University',
            period: 'January 2026 - Present',
            description: 'Supervised and mentored students in implementing digital logic systems, including logic gates, decoders, multiplexers, counters, and flip-flops. Assisted in circuit testing, debugging, and analysis using laboratory instruments and hardware components.',
            type: 'part-time',
        },
        {
            title: 'Sensor and Transducer Laboratory Assistant',
            organization: 'Department of Physics, IPB University',
            period: 'August 2025 - December 2025',
            description: 'Assisting students in sensor and transducer laboratory. Conducting experiments, analyzing data, and providing guidance on experimental design.',
            type: 'part-time',
        },
        {
            title: 'Analog Electronics Laboratory Assistant',
            organization: 'Department of Physics, IPB University',
            period: 'August 2024 - December 2024',
            description: 'Assisting students in analog electronics laboratory. Conducting experiments, analyzing data, and providing guidance on experimental design.',
            type: 'part-time',
        },
        {
            title: 'Physics Student',
            organization: 'IPB University',
            period: 'August 2022 - Present',
            description: 'Pursuing a degree in Physics with a focus on computational methods. Coursework includes quantum mechanics, statistical mechanics, and computational physics.',
            type: 'academic',
        },
    ];

    const typeIcons = {
        academic: GraduationCap,
        research: FlaskConical,
        freelance: Briefcase,
        project: Rocket,
        'part-time': Clock,
        'full-time': Building2,
    };

    const typeColors = {
        academic: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        research: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
        freelance: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        project: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
        'part-time': 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
        'full-time': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    };

    return (
        <div className="pt-16">
            <Section title={t.experience.title} subtitle={t.experience.subtitle}>
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-800 transform md:-translate-x-1/2" />

                    {/* Timeline items */}
                    <div className="space-y-12">
                        {experiences.map((exp, index) => {
                            const Icon = typeIcons[exp.type];
                            const colorClass = typeColors[exp.type];

                            return (
                                <motion.div
                                    key={`${exp.title}-${exp.organization}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-50px' }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className={`relative flex flex-col md:flex-row gap-8 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''
                                        }`}
                                >
                                    {/* Timeline dot */}
                                    <div className="absolute left-0 md:left-1/2 w-4 h-4 bg-neutral-900 dark:bg-white rounded-full transform -translate-x-1/2 md:-translate-x-1/2 border-4 border-white dark:border-neutral-950 z-10" />

                                    {/* Content */}
                                    <div className={`flex-1 pl-8 md:pl-0 ${index % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
                                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
                                            {/* Type badge */}
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${colorClass}`}>
                                                <Icon className="w-4 h-4" />
                                                {t.experience.types[exp.type]}
                                            </div>

                                            {/* Title & Organization */}
                                            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">
                                                {exp.title}
                                            </h3>
                                            <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                                                {exp.organization}
                                            </p>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
                                                {exp.period}
                                            </p>

                                            {/* Description */}
                                            <p className="text-neutral-600 dark:text-neutral-400">
                                                {exp.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Spacer for alternating layout */}
                                    <div className="hidden md:block flex-1" />
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </Section>
        </div>
    );
}
