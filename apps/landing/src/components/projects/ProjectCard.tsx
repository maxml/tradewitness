'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Github, Folder } from 'lucide-react';
import { Project, ProjectCategory, PROJECT_CATEGORIES } from '@/types';
import { Card } from '@/components/ui/Card';
import { useLocale } from '@/context/LocaleContext';

interface ProjectCardProps {
    project: Project;
    index: number;
}

const categoryColors: Record<ProjectCategory, string> = {
    'ai-ml': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    'web-dev': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    'automation': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    'data-analytics': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
};

export function ProjectCard({ project, index }: ProjectCardProps) {
    const { t } = useLocale();

    const categoryLabel = t.projects.categories[project.category] ||
        PROJECT_CATEGORIES.find(c => c.value === project.category)?.label ||
        project.category;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
        >
            <Card className="h-full flex flex-col">
                {/* Project Image Placeholder */}
                {project.image_url && (
                    <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg mb-4 overflow-hidden">
                        <img
                            src={project.image_url}
                            alt={project.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Category Badge */}
                <div className="mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${categoryColors[project.category]}`}>
                        <Folder className="w-3 h-3" />
                        {categoryLabel}
                    </span>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                        {project.title}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                        {project.description}
                    </p>
                </div>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2 mt-4">
                    {project.tech_stack.map((tech) => (
                        <span
                            key={tech}
                            className="px-2 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-md"
                        >
                            {tech}
                        </span>
                    ))}
                </div>

                {/* Links */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    {project.github_url && (
                        <a
                            href={project.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                        >
                            <Github className="w-4 h-4" />
                            {t.projects.viewCode}
                        </a>
                    )}
                    {project.demo_url && (
                        <a
                            href={project.demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            {t.projects.viewDemo}
                        </a>
                    )}
                </div>
            </Card>
        </motion.div>
    );
}
