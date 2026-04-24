'use client';

import { motion } from 'framer-motion';
import { Languages } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { LOCALES } from '@/lib/i18n';

export function LanguageToggle() {
    const { locale, setLocale } = useLocale();

    const toggleLocale = () => {
        setLocale(locale === 'en' ? 'id' : 'en');
    };

    const currentLocale = LOCALES.find(l => l.value === locale);

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleLocale}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-sm font-medium"
            aria-label="Toggle language"
        >
            <span>{currentLocale?.flag}</span>
            <span className="hidden sm:inline text-neutral-600 dark:text-neutral-300">
                {currentLocale?.label}
            </span>
        </motion.button>
    );
}
