'use client';

import Link from 'next/link';
import { Star, MapPin, BadgeCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatDistance, formatRating, getInitials } from '@/utils/format';
import { useFormatters } from '@/hooks/use-formatters';
import { cn } from '@/utils/cn';
import type { ProviderCard as ProviderCardType } from '@/types';

interface ProviderCardProps {
  provider: ProviderCardType;
  view?: 'grid' | 'list';
  index?: number;
}

function ProviderAvatar({ provider, size }: { provider: ProviderCardType; size: 'md' | 'lg' }) {
  const t = useTranslations('search.card');
  const dims = size === 'lg' ? 'h-16 w-16 text-xl' : 'h-14 w-14 text-lg';
  return (
    <span className={cn('relative shrink-0', dims)}>
      {provider.avatarUrl ? (
        <img loading="lazy" decoding="async" src={provider.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-brand-100 font-display font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
          {getInitials(provider.name)}
        </span>
      )}
      {provider.online && (
        <span
          className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[2.5px] border-card bg-brand-500"
          title={t('online')}
        >
          <span className="sr-only">{t('online')}</span>
        </span>
      )}
    </span>
  );
}

export function ProviderCard({ provider, view = 'grid' }: ProviderCardProps) {
  const t = useTranslations('search.card');
  const { formatPrice } = useFormatters();
  const verified = provider.reviewCount > 20;

  const rating = (
    <span className="flex shrink-0 items-center gap-1 text-sm font-semibold tabular">
      <Star className="h-4 w-4 fill-sun-400 text-sun-400" aria-hidden="true" />
      {provider.reviewCount > 0 ? formatRating(provider.rating) : null}
      <span className="font-normal text-muted-foreground">
        {provider.reviewCount > 0 ? `(${provider.reviewCount})` : t('new')}
      </span>
    </span>
  );

  const location = (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">
        {provider.city}
        {provider.distanceKm != null && `, ${formatDistance(provider.distanceKm)}`}
      </span>
    </span>
  );

  if (view === 'list') {
    return (
      <Link
        href={`/providers/${provider.id}`}
        className="group flex items-center gap-5 rounded-xl border border-border bg-card p-4 transition-colors hover:border-gray-400 sm:p-5 dark:hover:border-gray-600"
      >
        <ProviderAvatar provider={provider} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="flex min-w-0 items-center gap-1.5 font-display text-lg font-semibold leading-tight">
              <span className="truncate group-hover:underline group-hover:decoration-sun-400 group-hover:decoration-2 group-hover:underline-offset-4">
                {provider.name}
              </span>
              {verified && <BadgeCheck className="h-[18px] w-[18px] shrink-0 text-brand-600 dark:text-brand-300" aria-label={t('verified')} />}
            </h3>
            {rating}
          </div>
          <p className="mt-0.5 truncate text-[15px] text-foreground/75">{provider.profession}</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            {location}
            <span className="text-sm">
              <span className="text-muted-foreground">{t('from')} </span>
              <span className="font-semibold tabular">{formatPrice(provider.startingPrice)}</span>
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/providers/${provider.id}`}
      className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-gray-400 dark:hover:border-gray-600"
    >
      <div className="flex items-start justify-between gap-3">
        <ProviderAvatar provider={provider} size="md" />
        {rating}
      </div>

      <h3 className="mt-4 flex items-center gap-1.5 font-display text-lg font-semibold leading-tight">
        <span className="truncate group-hover:underline group-hover:decoration-sun-400 group-hover:decoration-2 group-hover:underline-offset-4">
          {provider.name}
        </span>
        {verified && <BadgeCheck className="h-[18px] w-[18px] shrink-0 text-brand-600 dark:text-brand-300" aria-label={t('verified')} />}
      </h3>
      <p className="mt-0.5 truncate text-[15px] text-foreground/75">{provider.profession}</p>
      <div className="mt-2 mb-5">{location}</div>

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-4">
        <span>
          <span className="block text-[12px] text-muted-foreground">{t('from')}</span>
          <span className="font-display text-[17px] font-bold tabular">{formatPrice(provider.startingPrice)}</span>
        </span>
        {provider.available && <span className="text-[13px] font-semibold text-brand-700 dark:text-brand-300">{t('available')}</span>}
      </div>
    </Link>
  );
}
