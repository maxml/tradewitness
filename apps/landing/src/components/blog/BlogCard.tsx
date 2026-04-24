'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, ArrowRight, Tag, Eye } from 'lucide-react';
import { BlogPost, BlogCategory, BLOG_CATEGORIES } from '@/types';
import { Card } from '@/components/ui/Card';
import { useLocale } from '@/context/LocaleContext';

interface BlogCardProps {
    post: BlogPost;
    index: number;
}

export function BlogCard({ post, index }: BlogCardProps) {
    const { t } = useLocale();

    const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const categoryLabel = t.blog.categories[post.category] || post.category;

    const categoryColors: Record<BlogCategory, string> = {
        'tech-ai': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
        'reviews': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
        'short-stories': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
        'culture': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
        >
            <Link href={`/blog/${post.slug}`}>
                <Card className="h-full group">
                    <div className="space-y-4">
                        {/* Category & Date */}
                        <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${categoryColors[post.category]}`}>
                                <Tag className="w-3 h-3" />
                                {categoryLabel}
                            </span>
                            <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-500">
                                <div className="flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{post.views || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <time dateTime={post.created_at}>{formattedDate}</time>
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {post.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-neutral-600 dark:text-neutral-400 text-sm line-clamp-3">
                            {post.excerpt}
                        </p>

                        {/* Read More */}
                        <div className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
                            {t.blog.readMore}
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </Card>
            </Link>
        </motion.div>
    );
}
