export const locales = ['de', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'de';
export const localeCookie = 'vt-locale';

export function isLocale(value: string | undefined): value is Locale {
  return value === 'de' || value === 'en';
}
