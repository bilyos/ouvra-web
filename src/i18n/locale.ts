'use server';

import { cookies } from 'next/headers';
import { COOKIE_NAME, defaultLocale, locales, type Locale } from './config';

export async function getUserLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}

export async function setUserLocale(locale: Locale) {
  const store = await cookies();
  store.set(COOKIE_NAME, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
}
