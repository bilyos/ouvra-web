import type { PriceKind, QuoteStatus, RequestStatus, RequestTiming } from '@/types';
import { formatPrice } from '@/utils/format';

export const TIMING_LABEL: Record<RequestTiming, string> = {
  NOW: 'Maintenant',
  THIS_WEEK: 'Cette semaine',
  FLEXIBLE: 'Pas pressé',
};

export const TIMING_HINT: Record<RequestTiming, string> = {
  NOW: 'Visible 2 heures, jusqu’à 20 km',
  THIS_WEEK: 'Visible 3 jours, jusqu’à 10 km',
  FLEXIBLE: 'Visible 3 jours, jusqu’à 10 km',
};

export const PRICE_KIND_LABEL: Record<PriceKind, string> = {
  FIXED: 'Prix ferme',
  FROM: 'À partir de',
  AFTER_VISIT: 'Après visite',
};

export const PRICE_KIND_HINT: Record<PriceKind, string> = {
  FIXED: 'Ce prix ne bougera pas.',
  FROM: 'Prix de départ, ajusté sur place selon le travail.',
  AFTER_VISIT: 'Estimation : vous fixerez le prix final après avoir vu le problème.',
};

export function priceText(price: number, kind: PriceKind) {
  const amount = formatPrice(price);
  if (kind === 'FROM') return `À partir de ${amount}`;
  if (kind === 'AFTER_VISIT') return `Environ ${amount}`;
  return amount;
}

export const REQUEST_STATUS: Record<RequestStatus, { label: string; tone: string }> = {
  OPEN: { label: 'En ligne', tone: 'bg-brand-100 text-brand-900 dark:bg-brand-900/60 dark:text-brand-100' },
  ASSIGNED: { label: 'Prestataire choisi', tone: 'bg-sun-200 text-gray-950' },
  EXPIRED: { label: 'Expirée', tone: 'bg-muted text-muted-foreground' },
  CANCELLED: { label: 'Retirée', tone: 'bg-muted text-muted-foreground' },
};

export const QUOTE_STATUS: Record<QuoteStatus, { label: string; tone: string }> = {
  SENT: { label: 'En attente du client', tone: 'bg-brand-100 text-brand-900 dark:bg-brand-900/60 dark:text-brand-100' },
  ACCEPTED: { label: 'Accepté', tone: 'bg-sun-300 text-gray-950' },
  DECLINED: { label: 'Non retenu', tone: 'bg-muted text-muted-foreground' },
  WITHDRAWN: { label: 'Retiré', tone: 'bg-muted text-muted-foreground' },
  EXPIRED: { label: 'Expiré', tone: 'bg-muted text-muted-foreground' },
};

const ZONE = 'Africa/Douala';

/** « demain à 9 h », « jeudi 24 à 14 h 30 » */
export function whenText(iso: string) {
  const d = new Date(iso);
  const day = (x: Date) => x.toLocaleDateString('fr-CA', { timeZone: ZONE });
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86_400_000);
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: ZONE }).replace(/^0/, '').replace(':00', ' h').replace(':', ' h ');
  if (day(d) === day(today)) return `aujourd’hui à ${time}`;
  if (day(d) === day(tomorrow)) return `demain à ${time}`;
  return `${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', timeZone: ZONE })} à ${time}`;
}

/** « il y a 12 min », « il y a 3 h », « il y a 2 j » */
export function agoText(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.round(hours / 24)} j`;
}

/** « encore 2 h », « encore 2 j » ; null si l'échéance est passée */
export function remainingText(iso: string) {
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (minutes <= 0) return null;
  if (minutes < 60) return `encore ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `encore ${hours} h`;
  return `encore ${Math.floor(hours / 24)} j`;
}

export function kmText(km: number | null | undefined) {
  if (km == null) return null;
  return `à ${km.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`;
}
