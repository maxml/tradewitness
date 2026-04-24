import { en } from './en';
import { id } from './id';
import { Locale } from './config';

export const translations = {
    en,
    id,
} as const;

export function getTranslations(locale: Locale) {
    return translations[locale];
}

export * from './config';
export * from './en';
