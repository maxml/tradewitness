// Type definitions for Portfolio Website

export type ProjectCategory = 'ai-ml' | 'web-dev' | 'automation' | 'data-analytics';

export const PROJECT_CATEGORIES: { value: ProjectCategory; label: string }[] = [
    { value: 'ai-ml', label: 'AI & Machine Learning' },
    { value: 'web-dev', label: 'Web Development' },
    { value: 'automation', label: 'Automation & Tools' },
    { value: 'data-analytics', label: 'Data Analytics' },
];

export interface Project {
    id: string;
    title: string;
    description: string | null;
    tech_stack: string[];
    category: ProjectCategory;
    github_url: string | null;
    demo_url: string | null;
    image_url: string | null;
    featured: boolean;
    created_at: string;
    updated_at: string;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    category: BlogCategory;
    views: number;
    published: boolean;
    created_at: string;
    updated_at: string;
}

export type BlogCategory = 'tech-ai' | 'reviews' | 'short-stories' | 'culture';

export const BLOG_CATEGORIES: { value: BlogCategory; label: string }[] = [
    { value: 'tech-ai', label: 'Tech/AI' },
    { value: 'reviews', label: 'Reviews' },
    { value: 'short-stories', label: 'Short Stories' },
    { value: 'culture', label: 'Culture' },
];

export interface ContactSubmission {
    id?: string;
    name: string;
    email: string;
    message: string;
    created_at?: string;
}

export interface NavLink {
    href: string;
    label: string;
}

export interface Skill {
    name: string;
    icon?: string;
}

export interface SkillCategory {
    title: string;
    skills: Skill[];
}

export interface Experience {
    title: string;
    organization: string;
    period: string;
    description: string;
    type: 'academic' | 'research' | 'freelance' | 'project';
}
