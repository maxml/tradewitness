'use client';

import Link from 'next/link';
import { Github, Linkedin, Mail } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

// Custom Medium icon since Lucide doesn't have one
function MediumIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
        </svg>
    );
}

const socialLinks = [
    { href: 'https://github.com/pranata-dev', icon: Github, label: 'GitHub' },
    { href: 'https://linkedin.com/in/pranatayudha26', icon: Linkedin, label: 'LinkedIn' },
    { href: 'https://medium.com/@pranata26', icon: MediumIcon, label: 'Medium' },
    { href: 'mailto:dzulfikaryudha@gmail.com', icon: Mail, label: 'Email' },
];

export function Footer() {
    const currentYear = new Date().getFullYear();
    const { t } = useLocale();

    const footerLinks = [
        { href: '/about', label: t.nav.about },
        { href: '/projects', label: t.nav.projects },
        { href: '/blog', label: t.nav.blog },
        { href: '/contact', label: t.nav.contact },
    ];

    return (
        <footer className="bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                            Pranata
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xs">
                            {t.footer.description}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                            {t.footer.quickLinks}
                        </h4>
                        <ul className="space-y-2">
                            {footerLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                            {t.footer.connect}
                        </h4>
                        <div className="flex space-x-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                    aria-label={social.label}
                                >
                                    <social.icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800">
                    <p className="text-sm text-neutral-500 dark:text-neutral-500 text-center">
                        {t.footer.copyright.replace('{year}', currentYear.toString())}
                    </p>
                </div>
            </div>
        </footer>
    );
}
