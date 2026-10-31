'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { requestApi } from '@/services/api';
import { QUOTE_STATUS, agoText, priceText, whenText } from '@/components/requests/labels';
import { cn } from '@/utils/cn';
import type { QuoteItem } from '@/types';

type Tab = 'sent' | 'accepted' | 'closed';

const TABS: [Tab, string, (q: QuoteItem) => boolean][] = [
  ['sent', 'En attente', (q) => q.status === 'SENT'],
  ['accepted', 'Acceptés', (q) => q.status === 'ACCEPTED'],
  ['closed', 'Non retenus', (q) => q.status === 'DECLINED' || q.status === 'EXPIRED' || q.status === 'WITHDRAWN'],
];

export default function ProviderQuotesPage() {
  const [tab, setTab] = useState<Tab>('sent');
  const { data = [], isLoading } = useQuery({ queryKey: ['quotes', 'mine'], queryFn: requestApi.myQuotes, refetchInterval: 30_000 });
  const filter = TABS.find(([k]) => k === tab)![2];
  const list = data.filter(filter);
  const accepted = data.filter((q) => q.status === 'ACCEPTED').length;
  const decided = data.filter((q) => q.status === 'ACCEPTED' || q.status === 'DECLINED').length;

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="text-3xl font-bold">Mes devis</h1>
        <p className="mt-1.5 text-[15px] text-muted-foreground">
          {decided > 0 ? `${accepted} accepté${accepted > 1 ? 's' : ''} sur ${decided} décidé${decided > 1 ? 's' : ''} par les clients.` : 'Les devis que vous avez envoyés.'}
        </p>
      </header>

      <div role="tablist" aria-label="Statut" className="mt-6 flex gap-1 border-b border-border">
        {TABS.map(([k, label, f]) => {
          const count = data.filter(f).length;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={cn(
                '-mb-px h-11 border-b-2 px-3 text-sm font-semibold transition-colors',
                tab === k ? 'border-brand-700 text-foreground dark:border-brand-300' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
              {count > 0 && <span className="tabular ml-1.5 text-muted-foreground">{count}</span>}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-3">{[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : list.length === 0 ? (
        <p className="mt-8 text-[15px] text-muted-foreground">
          {tab === 'sent' ? (
            <>
              Aucun devis en attente.{' '}
              <Link href="/dashboard/provider/requests" className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 dark:text-brand-300">
                Voir les demandes près de moi
              </Link>
            </>
          ) : tab === 'accepted' ? (
            'Aucun devis accepté pour l’instant.'
          ) : (
            'Rien ici.'
          )}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {list.map((q) => {
            const s = QUOTE_STATUS[q.status];
            return (
              <li key={q.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold">{q.request?.title ?? 'Demande'}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[q.request?.quarter, q.request?.city].filter(Boolean).join(', ')}, envoyé {agoText(q.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="tabular font-semibold">{priceText(q.price, q.priceKind)}</p>
                  <p className="text-[13px] text-muted-foreground">{whenText(q.availableAt)}</p>
                </div>
                <span className={cn('rounded-md px-2 py-0.5 text-[12px] font-semibold', s.tone)}>{s.label}</span>
                {q.status === 'ACCEPTED' && (
                  <Link href="/dashboard/provider/bookings" className="w-full text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 sm:w-auto dark:text-brand-300">
                    Voir la réservation
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
