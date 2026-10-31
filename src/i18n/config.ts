export const locales = ['fr', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const COOKIE_NAME = 'alloservice-locale';

export const localeLabels: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
};
