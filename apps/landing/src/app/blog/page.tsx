import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { BlogPost } from '@/types';
import BlogPageClient, { samplePosts } from '@/components/blog/BlogPageClient';

// Force dynamic rendering for Supabase data
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Blog',
    description: 'Thoughts on AI, machine learning, automation, and physics.',
};

async function getBlogPosts(): Promise<BlogPost[]> {
    try {
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('published', true)
            .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
            return samplePosts;
        }

        return data;
    } catch {
        return samplePosts;
    }
}

export default async function BlogPage() {
    const posts = await getBlogPosts();
    return <BlogPageClient initialPosts={posts} />;
}
