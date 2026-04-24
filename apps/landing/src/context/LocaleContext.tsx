'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, DEFAULT_LOCALE, getTranslations, Translations } from '@/lib/i18n';

interface LocaleContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: Translations;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'portfolio-locale';

export function LocaleProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load saved locale from localStorage
        const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
        if (savedLocale && (savedLocale === 'en' || savedLocale === 'id')) {
            setLocaleState(savedLocale);
        }
        setMounted(true);
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    };

    const t = getTranslations(locale);

    // Prevent hydration mismatch
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <LocaleContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LocaleContext.Provider>
    );
}

export function useLocale() {
    const context = useContext(LocaleContext);
    // Return default English translations if context is not available (SSR/static pages)
    if (context === undefined) {
        return {
            locale: DEFAULT_LOCALE,
            setLocale: () => { },
            t: getTranslations(DEFAULT_LOCALE),
        };
    }
    return context;
}
