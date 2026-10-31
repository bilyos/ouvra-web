'use client';

import { useLocale } from 'next-intl';
import { useMemo } from 'react';
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatPrice,
  formatRelativeTime,
} from '@/utils/format';
import type { Locale } from '@/i18n/config';

/**
 * Retourne les formateurs de `utils/format` liés à la locale active.
 * Évite d'avoir à passer la locale à chaque appel dans les composants.
 */
export function useFormatters() {
  const locale = useLocale() as Locale;

  return useMemo(
    () => ({
      locale,
      formatPrice: (price: number) => formatPrice(price, locale),
      formatNumber: (value: number) => formatNumber(value, locale),
      formatDate: (date: string | Date, pattern?: string) =>
        formatDate(date, pattern, locale),
      formatDateTime: (date: string | Date) => formatDateTime(date, locale),
      formatRelativeTime: (date: string | Date) => formatRelativeTime(date, locale),
    }),
    [locale]
  );
}
