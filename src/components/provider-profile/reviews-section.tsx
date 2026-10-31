'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { providerApi } from '@/services/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { formatRelativeTime, getInitials } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { Review } from '@/types';

const VISIBLE = 4;

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex gap-0.5', className)} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn('h-4 w-4', s <= Math.round(value) ? 'fill-sun-400 text-sun-400' : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700')} />
      ))}
    </span>
  );
}

function ReviewForm({ providerId, onDone }: { providerId: string; onDone: () => void }) {
  const t = useTranslations('provider');
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const mutation = useMutation({
    mutationFn: () => providerApi.addReview(providerId, { rating, comment: comment.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', providerId] });
      onDone();
    },
  });

  return (
    <form
      className="mt-6 rounded-xl border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (rating > 0) mutation.mutate();
      }}
    >
      <fieldset>
        <legend className="text-sm font-semibold">{t('leaveReview')}</legend>
        <div className="mt-2 flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHover(s)}
              aria-pressed={rating === s}
              aria-label={t('profile.stars', { count: s })}
              className="rounded-md p-1"
            >
              <Star className={cn('h-7 w-7 transition-colors', s <= (hover || rating) ? 'fill-sun-400 text-sun-400' : 'text-gray-300 dark:text-gray-600')} />
            </button>
          ))}
        </div>
      </fieldset>
      <label htmlFor="review-comment" className="sr-only">
        {t('reviewPlaceholder')}
      </label>
      <textarea
        id="review-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t('reviewPlaceholder')}
        rows={3}
        className="mt-3 w-full resize-none rounded-lg border border-border bg-card px-3.5 py-3 text-[15px] focus:border-brand-600 focus:outline-none focus:ring-[3px] focus:ring-brand-600/15"
      />
      {mutation.isError && (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">
          {getApiErrorMessage(mutation.error, 'Votre avis n’a pas pu être publié.')}
        </p>
      )}
      <button
        type="submit"
        disabled={rating === 0 || mutation.isPending}
        className="mt-3 inline-flex h-11 items-center gap-2 rounded-lg bg-brand-800 px-5 text-sm font-semibold text-white hover:bg-brand-900 disabled:opacity-50 dark:bg-brand-300 dark:text-brand-950"
      >
        {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {t('publishReview')}
      </button>
    </form>
  );
}

export function ReviewsSection({
  providerId,
  rating,
  reviewCount,
  reviews,
  canReview,
}: {
  providerId: string;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  canReview: boolean;
}) {
  const t = useTranslations('provider.profile');
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [writing, setWriting] = useState(false);

  // Répartition par nombre d'étoiles, calculée sur les avis reçus
  const buckets = [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: reviews.filter((r) => Math.round(r.rating) === s).length }));
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const shown = expanded ? reviews : reviews.slice(0, VISIBLE);
  const fmt = (n: number) => n.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <section aria-labelledby="reviews-title" id="avis" className="scroll-mt-24">
      <h2 id="reviews-title" className="text-2xl font-bold">
        {t('reviewsTitle')}
      </h2>

      {reviews.length === 0 ? (
        <p className="mt-4 text-[15px] text-muted-foreground">{t('reviewsEmpty')}</p>
      ) : (
        <div className="mt-6 grid gap-8 sm:grid-cols-[200px_1fr]">
          <div>
            <p className="font-display text-5xl font-bold tracking-[-0.03em] tabular">{fmt(rating)}</p>
            <Stars value={rating} className="mt-2" />
            <p className="mt-1 text-sm text-muted-foreground">{t('reviewsCount', { count: reviewCount })}</p>
          </div>
          <ul className="space-y-1.5 self-center" aria-label={t('reviewsTitle')}>
            {buckets.map((b) => (
              <li key={b.stars} className="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-3 text-sm">
                <span className="flex items-center gap-1 tabular text-muted-foreground">
                  {b.stars} <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                </span>
                <span className="h-2 rounded-full bg-muted" aria-hidden="true">
                  <span className="block h-full rounded-full bg-sun-400" style={{ width: `${(b.count / max) * 100}%` }} />
                </span>
                <span className="text-right tabular text-muted-foreground">{b.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reviews.length > 0 && (
        <ul className="mt-8 divide-y divide-border border-y border-border">
          {shown.map((r, i) => (
            <li key={`${r.authorName}-${r.createdAt}-${i}`} className="py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-display text-sm font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
                  {getInitials(r.authorName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{r.authorName}</p>
                  <p className="text-[13px] text-muted-foreground">{formatRelativeTime(r.createdAt)}</p>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold tabular">
                  <Star className="h-4 w-4 fill-sun-400 text-sun-400" aria-hidden="true" />
                  {fmt(r.rating)}
                </span>
              </div>
              {r.comment && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-foreground/85">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        {reviews.length > VISIBLE && (
          <button type="button" onClick={() => setExpanded((v) => !v)} className="text-sm font-semibold underline underline-offset-4">
            {expanded ? t('showLess') : t('showAll', { count: reviews.length })}
          </button>
        )}
        {canReview && !writing && (
          <button type="button" onClick={() => setWriting(true)} className="text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 dark:text-brand-300">
            {t('leaveReview')}
          </button>
        )}
      </div>
      <p className="mt-2 text-[13px] text-muted-foreground">{t('reviewRule')}</p>
      {writing && <ReviewForm providerId={providerId} onDone={() => setWriting(false)} />}
    </section>
  );
}
