'use client';

import { motion } from 'framer-motion';
import { Section } from '@/components/ui/Section';
import { useLocale } from '@/context/LocaleContext';

interface Skill {
    name: string;
}

interface SkillCategory {
    key: string;
    skills: Skill[];
}

export default function SkillsPage() {
    const { t } = useLocale();

    const skillCategories: SkillCategory[] = [
        {
            key: 'languages',
            skills: [
                { name: 'Python' },
                { name: 'TypeScript' },
                { name: 'JavaScript' },
                { name: 'C++' },
                { name: 'SQL' },
                { name: 'Rust' },
            ],
        },
        {
            key: 'aiml',
            skills: [
                { name: 'TensorFlow' },
                { name: 'PyTorch' },
                { name: 'Scikit-learn' },
                { name: 'OpenAI API' },
                { name: 'LangChain' },
                { name: 'Hugging Face' },
            ],
        },
        {
            key: 'web',
            skills: [
                { name: 'React' },
                { name: 'Next.js' },
                { name: 'Node.js' },
                { name: 'Tailwind CSS' },
                { name: 'FastAPI' },
                { name: 'PostgreSQL' },
            ],
        },
        {
            key: 'automation',
            skills: [
                { name: 'Docker' },
                { name: 'Kubernetes' },
                { name: 'Apache Airflow' },
                { name: 'GitHub Actions' },
                { name: 'n8n' },
                { name: 'Selenium' },
            ],
        },
        {
            key: 'data',
            skills: [
                { name: 'Pandas' },
                { name: 'NumPy' },
                { name: 'Matplotlib' },
                { name: 'Jupyter' },
                { name: 'Supabase' },
                { name: 'Redis' },
            ],
        },
        {
            key: 'tools',
            skills: [
                { name: 'Git' },
                { name: 'VS Code' },
                { name: 'Linux' },
                { name: 'Vercel' },
                { name: 'AWS' },
                { name: 'Figma' },
            ],
        },
    ];

    const getCategoryTitle = (key: string) => {
        const titles: Record<string, string> = {
            languages: t.skills.categories.languages,
            aiml: t.skills.categories.aiml,
            web: t.skills.categories.web,
            automation: t.skills.categories.automation,
            data: t.skills.categories.data,
            tools: t.skills.categories.tools,
        };
        return titles[key] || key;
    };

    return (
        <div className="pt-16">
            <Section title={t.skills.title} subtitle={t.skills.subtitle}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {skillCategories.map((category, categoryIndex) => (
                        <motion.div
                            key={category.key}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6"
                        >
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                                {getCategoryTitle(category.key)}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {category.skills.map((skill, skillIndex) => (
                                    <motion.span
                                        key={skill.name}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            duration: 0.3,
                                            delay: categoryIndex * 0.1 + skillIndex * 0.05,
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        className="px-3 py-1.5 text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg"
                                    >
                                        {skill.name}
                                    </motion.span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Proficiency Note */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="mt-12 p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 text-center"
                >
                    <p className="text-neutral-600 dark:text-neutral-400">
                        {t.skills.currentlyLearning}{' '}
                        <span className="font-medium text-neutral-900 dark:text-white">
                            {t.skills.learningTopics}
                        </span>
                    </p>
                </motion.div>
            </Section>
        </div>
    );
}
