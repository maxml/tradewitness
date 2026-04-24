'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Section } from '@/components/ui/Section';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { supabase } from '@/lib/supabase';
import { Project, ProjectCategory, PROJECT_CATEGORIES } from '@/types';
import { useLocale } from '@/context/LocaleContext';

// Sample projects organized by category
const sampleProjects: Project[] = [
    {
        id: '0',
        title: 'AI Personal Assistant',
        description: 'A stateless, privacy-first AI personal assistant for desktop, built using Next.js, Tailwind CSS, and OpenRouter with a focus on UX and clean architecture.',
        tech_stack: ['Next.js', 'React', 'Tailwind CSS', 'TypeScript', 'OpenRouter'],
        category: 'ai-ml',
        github_url: 'https://github.com/pranata-dev/ai-personal-assistant',
        demo_url: null,
        image_url: null,
        featured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '1',
        title: 'Neural Network for Astrophysics Research',
        description: 'Final Year Project: Stellar age prediction and phase classification using Transformer and MLP Models on Gaia Data Release 3.',
        tech_stack: ['Python', 'PyTorch', 'Transformer', 'Pandas'],
        category: 'ai-ml',
        github_url: 'https://github.com/pranata-dev/stellar-evolution',
        demo_url: null,
        image_url: null,
        featured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '2',
        title: 'N8N Job Vacancy Automation',
        description: 'Automated Job Vacancy Tracker using n8n, Jina AI, & Telegram Bot. Features duplicate checking, CAPTCHA fallback, and AI-powered parsing.',
        tech_stack: ['n8n', 'Jina AI', 'Telegram API', 'JavaScript'],
        category: 'automation',
        github_url: 'https://github.com/pranata-dev/n8n-job-vacancy-automation',
        demo_url: null,
        image_url: null,
        featured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '3',
        title: 'N8N Receipt Scanner',
        description: 'An automated receipt scanning workflow built with n8n that extracts structured data from receipt images using AI-powered OCR and document understanding.',
        tech_stack: ['n8n', 'OCR', 'AI', 'JSON'],
        category: 'automation',
        github_url: 'https://github.com/pranata-dev/n8n-receipt-scanning',
        demo_url: null,
        image_url: null,
        featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '4',
        title: 'Smartband Health Monitoring',
        description: 'ESP32-based IoT system monitoring Heart Rate, SpO2, and Temp via Blynk. Integrates Hugging Face AI to provide automated medical advice when vitals are abnormal.',
        tech_stack: ['C++', 'ESP32', 'Blynk', 'Hugging Face'],
        category: 'automation',
        github_url: 'https://github.com/pranata-dev/smartband-healt-monitoring-iot',
        demo_url: null,
        image_url: null,
        featured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '5',
        title: 'Personal Website Branding',
        description: 'Modern Personal Portfolio built with Next.js 16 (App Router), React 19, & Tailwind CSS v4. Features bilingual support (i18n), dark mode, and a hybrid blog system.',
        tech_stack: ['Next.js 16', 'React 19', 'Tailwind CSS v4', 'Supabase'],
        category: 'web-dev',
        github_url: 'https://github.com/pranata-dev/personal-website',
        demo_url: null,
        image_url: null,
        featured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

export default function ProjectsPage() {
    const { t, locale } = useLocale();
    const [projects, setProjects] = useState<Project[]>(sampleProjects);
    const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'all'>('all');

    useEffect(() => {
        async function fetchProjects() {
            try {
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data && data.length > 0) {
                    setProjects(data);
                }
            } catch {
                // Keep using sample projects
            }
        }

        fetchProjects();
    }, []);

    const filteredProjects = useMemo(() => {
        if (selectedCategory === 'all') return projects;
        return projects.filter(project => project.category === selectedCategory);
    }, [projects, selectedCategory]);

    const getCategoryLabel = (category: ProjectCategory) => {
        return t.projects.categories[category] || PROJECT_CATEGORIES.find(c => c.value === category)?.label || category;
    };

    return (
        <div className="pt-16">
            <Section title={t.projects.title} subtitle={t.projects.subtitle}>
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === 'all'
                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                            }`}
                    >
                        {locale === 'id' ? 'Semua' : 'All'}
                    </button>
                    {PROJECT_CATEGORIES.map((category) => (
                        <button
                            key={category.value}
                            onClick={() => setSelectedCategory(category.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === category.value
                                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                }`}
                        >
                            {getCategoryLabel(category.value)}
                        </button>
                    ))}
                </div>

                {/* Projects Grid */}
                <motion.div
                    key={selectedCategory}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    {filteredProjects.map((project, index) => (
                        <ProjectCard key={project.id} project={project} index={index} />
                    ))}
                </motion.div>

                {filteredProjects.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-neutral-500 dark:text-neutral-500">
                            {locale === 'id' ? 'Belum ada proyek di kategori ini.' : 'No projects in this category yet.'}
                        </p>
                    </div>
                )}
            </Section>
        </div>
    );
}
