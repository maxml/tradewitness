// Locale types and configuration

export type Locale = 'en' | 'id';

export const LOCALES: { value: Locale; label: string; flag: string }[] = [
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'id', label: 'Indonesia', flag: '🇮🇩' },
];

export const DEFAULT_LOCALE: Locale = 'en';
