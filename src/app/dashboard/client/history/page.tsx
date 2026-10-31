'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, MessageSquare, Search } from 'lucide-react';
import { bookingApi, chatApi } from '@/services/api';
import { EmptyState, Figures, PageHeader, StatusDot } from '@/components/dashboard/page-parts';
import { cn } from '@/utils/cn';
import { formatPrice, getInitials } from '@/utils/format';
import type { BookingItem } from '@/types';

type Filter = 'all' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'COMPLETED', label: 'Terminées' },
  { value: 'CANCELLED', label: 'Annulées' },
  { value: 'REJECTED', label: 'Refusées' },
];

function statusOf(b: BookingItem) {
  if (b.status === 'COMPLETED') return <StatusDot tone="green">{b.escrowStatus === 'REFUNDED' ? 'Remboursée' : 'Terminée'}</StatusDot>;
  if (b.status === 'REJECTED') return <StatusDot tone="gray">Refusée</StatusDot>;
  return <StatusDot tone="gray">{b.escrowStatus === 'REFUNDED' ? 'Annulée, remboursée' : 'Annulée'}</StatusDot>;
}

export default function ClientHistoryPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const { data: bookings = [], isLoading } = useQuery({ queryKey: ['bookings', 'mine'], queryFn: bookingApi.mine });

  const contact = useMutation({
    mutationFn: (providerId: string) => chatApi.startConversation(providerId),
    onSuccess: (conv) => router.push(`/dashboard/messages?conv=${conv.id}`),
  });

  const past = useMemo(() => bookings.filter((b) => ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(b.status)), [bookings]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return past
      .filter((b) => filter === 'all' || b.status === filter)
      .filter((b) => !q || [b.title, b.providerName, b.address].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }, [past, filter, query]);

  // Prestataires déjà employés, du plus fréquent au moins fréquent
  const regulars = useMemo(() => {
    const map = new Map<string, { id: string; name: string; profession: string | null; avatarUrl: string | null; count: number; last: string }>();
    for (const b of past) {
      if (b.status !== 'COMPLETED' || !b.providerId || !b.providerName) continue;
      const cur = map.get(b.providerId);
      if (cur) {
        cur.count += 1;
        if (b.scheduledAt > cur.last) cur.last = b.scheduledAt;
      } else {
        map.set(b.providerId, { id: b.providerId, name: b.providerName, profession: b.providerProfession, avatarUrl: b.providerAvatarUrl, count: 1, last: b.scheduledAt });
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 4);
  }, [past]);

  const completed = past.filter((b) => b.status === 'COMPLETED');
  const spent = completed.filter((b) => b.escrowStatus !== 'REFUNDED').reduce((s, b) => s + b.price, 0);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader title="Historique" description="Vos prestations passées, et les prestataires à qui refaire appel." />

      {past.length === 0 ? (
        <EmptyState
          title="Pas encore d’historique"
          description="Vos prestations terminées apparaîtront ici, avec un raccourci pour refaire appel au même prestataire."
          actionLabel="Trouver un prestataire"
          actionHref="/search"
        />
      ) : (
        <>
          <Figures
            items={[
              { label: 'prestations terminées', value: completed.length },
              { label: 'dépensés sur Ouvra', value: formatPrice(spent) },
              { label: 'prestataires différents', value: new Set(completed.map((b) => b.providerId)).size },
            ]}
          />

          {regulars.length > 0 && (
            <section aria-labelledby="regulars-title">
              <h2 id="regulars-title" className="mb-4 text-2xl font-bold">
                Vos prestataires
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {regulars.map((p) => (
                  <li key={p.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-display font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
                      {p.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- avatar servi par l'API
                        <img loading="lazy" decoding="async" src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        getInitials(p.name)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link href={`/providers/${p.id}`} className="block truncate font-semibold hover:underline">
                        {p.name}
                      </Link>
                      <span className="block truncate text-[13px] text-muted-foreground">
                        {p.profession}, {p.count} prestation{p.count > 1 ? 's' : ''}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => contact.mutate(p.id)}
                        disabled={contact.isPending}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-60"
                        aria-label={`Écrire à ${p.name}`}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <Link href={`/providers/${p.id}?demande=1`} className="inline-flex h-10 items-center rounded-lg bg-sun-400 px-3.5 text-sm font-bold text-gray-950 hover:bg-sun-300">
                        Refaire appel
                      </Link>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="past-title">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h2 id="past-title" className="text-2xl font-bold">
                Toutes les prestations
              </h2>
              <div className="relative sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Rechercher dans l’historique"
                  placeholder="Service, prestataire, lieu"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-brand-600 focus:ring-[3px] focus:ring-brand-600/15"
                />
              </div>
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  aria-pressed={filter === f.value}
                  className={cn(
                    'h-9 rounded-full px-4 text-sm font-semibold transition-colors',
                    filter === f.value ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {list.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center text-[15px] text-muted-foreground dark:border-gray-700">Rien ne correspond à cette recherche.</p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {list.map((b) => (
                  <li key={b.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{b.title}</p>
                      <p className="truncate text-[13px] text-muted-foreground">
                        {b.providerName ?? 'Sans prestataire'}, {new Date(b.scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {b.address ? `, ${b.address}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-6 sm:justify-end">
                      {statusOf(b)}
                      <span className="w-28 text-right font-semibold tabular">{formatPrice(b.price)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
