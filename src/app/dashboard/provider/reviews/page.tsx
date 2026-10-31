'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Star } from 'lucide-react';
import { providerApi } from '@/services/api';
import { EmptyState, PageHeader } from '@/components/dashboard/page-parts';
import { cn } from '@/utils/cn';
import { formatRating, formatRelativeTime, getInitials } from '@/utils/format';

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex gap-0.5', className)} aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn('h-4 w-4', s <= Math.round(value) ? 'fill-sun-400 text-sun-400' : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700')} aria-hidden="true" />
      ))}
    </span>
  );
}

type Filter = 'all' | 'comment' | 5 | 4 | 3 | 2 | 1;

export default function ProviderReviewsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const { data: profile, isLoading } = useQuery({ queryKey: ['my-provider-profile'], queryFn: providerApi.myProfile });

  const reviews = useMemo(() => [...(profile?.reviews ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [profile]);
  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, n: reviews.filter((r) => Math.round(r.rating) === star).length }));
  const withComment = reviews.filter((r) => r.comment?.trim()).length;

  const list = reviews.filter((r) => (filter === 'all' ? true : filter === 'comment' ? !!r.comment?.trim() : Math.round(r.rating) === filter));

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Avis clients" description="Ce que vos clients disent de vous, tel qu’il apparaît sur votre profil." />

      {count === 0 ? (
        <EmptyState
          icon={<Star className="h-5 w-5" />}
          title="Pas encore d’avis"
          description="Le client peut laisser un avis une fois la prestation terminée. À la fin du travail, rappelez-lui simplement qu’il peut le faire depuis ses réservations."
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit lg:sticky lg:top-6">
            <p className="font-display text-6xl font-bold leading-none tabular">{formatRating(avg)}</p>
            <Stars value={avg} className="mt-3" />
            <p className="mt-2 text-sm text-muted-foreground">
              {count} avis, dont {withComment} avec un commentaire
            </p>

            <ul className="mt-6 space-y-1">
              {dist.map(({ star, n }) => (
                <li key={star}>
                  <button
                    type="button"
                    onClick={() => setFilter(filter === star ? 'all' : (star as Filter))}
                    aria-pressed={filter === star}
                    disabled={n === 0}
                    className={cn('flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors disabled:opacity-40', filter === star ? 'bg-muted' : 'hover:bg-muted/60')}
                  >
                    <span className="w-8 text-left font-medium tabular">{star} ★</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-sun-400" style={{ width: `${(n / count) * 100}%` }} />
                    </span>
                    <span className="w-6 text-right tabular text-muted-foreground">{n}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section aria-label="Liste des avis">
            <div className="mb-4 flex flex-wrap gap-1.5">
              {(
                [
                  { v: 'all', l: `Tous (${count})` },
                  { v: 'comment', l: `Avec commentaire (${withComment})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.v}
                  type="button"
                  onClick={() => setFilter(f.v)}
                  aria-pressed={filter === f.v}
                  className={cn('h-9 rounded-full px-4 text-sm font-semibold transition-colors', filter === f.v ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground')}
                >
                  {f.l}
                </button>
              ))}
              {typeof filter === 'number' && (
                <button type="button" onClick={() => setFilter('all')} className="h-9 rounded-full bg-foreground px-4 text-sm font-semibold text-background">
                  {filter} étoile{filter > 1 ? 's' : ''} ×
                </button>
              )}
            </div>

            {list.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center text-[15px] text-muted-foreground dark:border-gray-700">Aucun avis dans cette sélection.</p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                {list.map((r, i) => (
                  <li key={`${r.createdAt}-${i}`} className="flex gap-4 p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-200">{getInitials(r.authorName)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <p className="font-semibold">{r.authorName}</p>
                        <p className="text-[13px] text-muted-foreground">{formatRelativeTime(r.createdAt)}</p>
                      </div>
                      <Stars value={r.rating} className="mt-1" />
                      {r.comment?.trim() ? <p className="mt-2.5 text-[15px] leading-relaxed">{r.comment}</p> : <p className="mt-2 text-[13px] italic text-muted-foreground">Note sans commentaire</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
