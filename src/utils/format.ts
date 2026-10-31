import { formatDistanceToNow, format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

type SupportedLocale = 'fr' | 'en';

const DEFAULT_LOCALE: SupportedLocale = 'fr';

function dateFnsLocale(locale: SupportedLocale) {
  return locale === 'en' ? enUS : fr;
}

/** Locale BCP-47 utilisée par Intl (le Cameroun reste la région de référence). */
function intlLocale(locale: SupportedLocale) {
  return locale === 'en' ? 'en-CM' : 'fr-CM';
}

export function formatRelativeTime(
  date: string | Date,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: dateFnsLocale(locale),
  });
}

export function formatDate(
  date: string | Date,
  pattern = 'dd MMM yyyy',
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  return format(new Date(date), pattern, { locale: dateFnsLocale(locale) });
}

export function formatDateTime(
  date: string | Date,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  const pattern = locale === 'en' ? "dd MMM yyyy 'at' HH:mm" : "dd MMM yyyy 'à' HH:mm";
  return format(new Date(date), pattern, { locale: dateFnsLocale(locale) });
}

export function formatPrice(
  price: number,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatNumber(
  value: number,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(value);
}

export function formatDistance(km: number | null | undefined): string {
  if (km == null || typeof km !== 'number' || isNaN(km)) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatRating(rating: number | null | undefined): string {
  if (rating == null) return '0.0';
  return rating.toFixed(1);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
