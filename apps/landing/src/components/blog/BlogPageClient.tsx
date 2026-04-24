'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Section } from '@/components/ui/Section';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogPost, BlogCategory, BLOG_CATEGORIES } from '@/types';
import { useLocale } from '@/context/LocaleContext';

// Empty sample posts - add your articles here or use Supabase
const samplePosts: BlogPost[] = [
    {
        id: '1',
        title: 'Neo-Tokyo Cyberpunk in 1988: Menyusuri Distopia, Delusi dan Detonasi Diri dalam Akira (1988)',
        slug: 'review-akira-1988',
        excerpt: 'Apakah lo termasuk orang-orang yang gemar menonton film-film sci-fi, dystopia, cyberpunk semacam The Matrix, Inception atau mungkin main game Cyberpunk 2077? Kalo iya, lo bakal suka dan terkesima dengan film anime yang satu ini, Akira.',
        content: '', // Content is loaded in [slug]/page.tsx
        category: 'reviews',
        views: 0,
        published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

interface BlogPageClientProps {
    initialPosts: BlogPost[];
}

export default function BlogPageClient({ initialPosts }: BlogPageClientProps) {
    const { t } = useLocale();
    const [selectedCategory, setSelectedCategory] = useState<BlogCategory | 'all'>('all');

    const filteredPosts = useMemo(() => {
        if (selectedCategory === 'all') return initialPosts;
        return initialPosts.filter(post => post.category === selectedCategory);
    }, [initialPosts, selectedCategory]);

    const getCategoryLabel = (category: BlogCategory) => {
        return t.blog.categories[category] || category;
    };

    return (
        <div className="pt-16">
            <Section title={t.blog.title} subtitle={t.blog.subtitle}>
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === 'all'
                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                            }`}
                    >
                        {t.blog.allCategories}
                    </button>
                    {BLOG_CATEGORIES.map((category) => (
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

                {/* Blog Grid */}
                {filteredPosts.length > 0 ? (
                    <motion.div
                        key={selectedCategory}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredPosts.map((post, index) => (
                            <BlogCard key={post.id} post={post} index={index} />
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-neutral-500 dark:text-neutral-500">
                            {t.blog.noPosts}
                        </p>
                    </div>
                )}
            </Section>
        </div>
    );
}

// Export sample posts for use in page.tsx
export { samplePosts };
