'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Camera, MapPin, Mic } from 'lucide-react';
import { requestApi } from '@/services/api';
import { QuoteSheet } from '@/components/requests/quote-sheet';
import { QUOTE_STATUS, TIMING_LABEL, agoText, kmText, priceText } from '@/components/requests/labels';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { JobRequestItem, RequestTiming } from '@/types';

function RequestCard({ r, onOpen }: { r: JobRequestItem; onOpen: () => void }) {
  const photo = r.media.find((m) => m.kind === 'PHOTO');
  const mine = r.myQuote && r.myQuote.status !== 'WITHDRAWN' ? r.myQuote : null;
  const full = r.quoteCount >= r.maxQuotes;
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-colors hover:border-gray-400 dark:hover:border-gray-600"
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.thumbnailUrl ?? photo.url} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
        ) : (
          <span className="flex aspect-[16/9] w-full items-center justify-center gap-2 bg-muted text-sm text-muted-foreground">
            {r.voiceUrl ? <Mic className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
            {r.voiceUrl ? `Note vocale, ${r.voiceSeconds ?? ''} s` : 'Sans photo'}
          </span>
        )}
        <span className="flex flex-1 flex-col p-4">
          <span className="flex flex-wrap items-center gap-2 text-[12px] font-semibold">
            <span className={cn('rounded-md px-2 py-0.5', r.timing === 'NOW' ? 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-200' : 'bg-muted')}>{TIMING_LABEL[r.timing]}</span>
            <span className="text-muted-foreground">{agoText(r.createdAt)}</span>
            {r.voiceUrl && photo && <Mic className="h-3.5 w-3.5 text-muted-foreground" aria-label="avec note vocale" />}
          </span>
          <span className="mt-2 text-[17px] font-semibold leading-snug">{r.title}</span>
          {r.description && <span className="mt-1 line-clamp-2 text-sm text-foreground/75">{r.description}</span>}
          <span className="mt-auto flex items-center justify-between gap-3 pt-4 text-[13px]">
            <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{r.quarter ?? r.city}{kmText(r.distanceKm) ? `, ${kmText(r.distanceKm)}` : ''}</span>
            </span>
            {r.budgetMax ? <span className="shrink-0 font-semibold">{formatPrice(r.budgetMax)} max</span> : null}
          </span>
          <span className="mt-3 border-t border-border pt-3 text-[13px] font-semibold">
            {mine ? (
              <span className={cn('rounded-md px-2 py-0.5', QUOTE_STATUS[mine.status].tone)}>Votre devis : {priceText(mine.price, mine.priceKind)}</span>
            ) : full ? (
              <span className="text-muted-foreground">Complet</span>
            ) : (
              <span className="text-brand-700 dark:text-brand-300">
                Faire un devis
                <span className="ml-1.5 font-normal text-muted-foreground">{r.quoteCount} sur {r.maxQuotes}</span>
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  );
}

export default function ProviderRequestsPage() {
  const [timing, setTiming] = useState<RequestTiming | undefined>(undefined);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['requests', 'feed', timing],
    queryFn: () => requestApi.feed(timing),
    refetchInterval: 30_000,
  });
  const opened = data.find((r) => r.id === openId) ?? null;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Demandes près de moi</h1>
          <p className="mt-1.5 max-w-xl text-[15px] text-muted-foreground">
            Des clients de votre métier, dans votre secteur. Envoyez un prix et une date : le client choisit parmi 5 devis au plus.
          </p>
        </div>
        <div role="tablist" aria-label="Filtrer" className="flex rounded-lg bg-muted p-1 text-sm font-semibold">
          {([[undefined, 'Toutes'], ['NOW', 'Maintenant']] as const).map(([k, label]) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={timing === k}
              onClick={() => setTiming(k)}
              className={cn('h-9 rounded-md px-4 transition-colors', timing === k ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <li key={i} className="h-80 animate-pulse rounded-xl bg-muted" />)}
        </ul>
      ) : isError ? (
        <p className="mt-8 text-[15px] text-muted-foreground">Le fil ne s’est pas chargé. Vérifiez votre connexion.</p>
      ) : data.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-gray-300 px-6 py-12 dark:border-gray-700">
          <p className="text-lg font-semibold">{timing === 'NOW' ? 'Aucune demande urgente en ce moment' : 'Aucune demande ouverte dans votre secteur'}</p>
          <p className="mt-2 max-w-md text-[15px] text-muted-foreground">
            Vous êtes prévenu dès qu’un client de votre métier publie près de vous. Restez « en ligne » pour être parmi les premiers.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((r) => (
            <RequestCard key={r.id} r={r} onOpen={() => setOpenId(r.id)} />
          ))}
        </ul>
      )}

      <QuoteSheet request={opened} onOpenChange={(o) => !o && setOpenId(null)} />
    </div>
  );
}
