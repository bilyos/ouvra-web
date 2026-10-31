'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarClock, Loader2, MapPin, MessageSquare, RotateCcw, ShieldCheck, Star } from 'lucide-react';
import { chatApi, requestApi } from '@/services/api';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RequestMedia } from '@/components/requests/request-media';
import { PRICE_KIND_HINT, PRICE_KIND_LABEL, REQUEST_STATUS, TIMING_LABEL, agoText, kmText, priceText, remainingText, whenText } from '@/components/requests/labels';
import { getApiErrorMessage } from '@/utils/api-error';
import { getInitials } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { QuoteItem } from '@/types';

type Sort = 'best' | 'price' | 'soon';

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<Sort>('best');
  const [confirm, setConfirm] = useState<QuoteItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const request = useQuery({ queryKey: ['requests', id], queryFn: () => requestApi.detail(id), refetchInterval: 20_000 });
  const quotes = useQuery({ queryKey: ['requests', id, 'quotes'], queryFn: () => requestApi.quotes(id), refetchInterval: 20_000 });
  const r = request.data;

  const sorted = useMemo(() => {
    const list = [...(quotes.data ?? [])];
    if (sort === 'price') list.sort((a, b) => a.price - b.price);
    if (sort === 'soon') list.sort((a, b) => a.availableAt.localeCompare(b.availableAt));
    return list;
  }, [quotes.data, sort]);
  const cheapest = quotes.data?.length ? Math.min(...quotes.data.filter((q) => q.status === 'SENT').map((q) => q.price)) : null;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['requests'] });
  const accept = useMutation({
    mutationFn: (q: QuoteItem) => requestApi.acceptQuote(q.id),
    onSuccess: (booking) => {
      void refresh();
      router.push(`/dashboard/client/bookings/${booking.id}/pay`);
    },
  });
  const relaunch = useMutation({ mutationFn: () => requestApi.relaunch(id), onSuccess: refresh, onError: (e) => setActionError(getApiErrorMessage(e, 'Relance impossible.')) });
  const cancel = useMutation({ mutationFn: () => requestApi.cancel(id), onSuccess: refresh, onError: (e) => setActionError(getApiErrorMessage(e, 'Retrait impossible.')) });
  const ask = useMutation({
    mutationFn: (q: QuoteItem) => chatApi.startConversation(q.providerId),
    onSuccess: (conv) => router.push(`/dashboard/messages?conv=${conv.id}`),
    onError: (e) => setActionError(getApiErrorMessage(e, 'La conversation n’a pas pu s’ouvrir.')),
  });

  if (request.isLoading) {
    return <div className="mx-auto h-96 max-w-4xl animate-pulse rounded-xl bg-muted" />;
  }
  if (!r) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-lg font-semibold">Demande introuvable</p>
        <Link href="/dashboard/client/requests" className="mt-4 inline-block text-sm font-semibold text-brand-700 underline underline-offset-4 dark:text-brand-300">
          Revenir à mes demandes
        </Link>
      </div>
    );
  }

  const status = REQUEST_STATUS[r.status];
  const left = r.status === 'OPEN' ? remainingText(r.expiresAt) : null;
  const open = r.status === 'OPEN';

  return (
    <div className="mx-auto grid max-w-6xl gap-10 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* La demande */}
      <section aria-labelledby="req-title" className="xl:sticky xl:top-24 xl:self-start">
        <Link href="/dashboard/client/requests" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Mes demandes
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] font-semibold">
          <span className={cn('rounded-md px-2 py-0.5', status.tone)}>{status.label}</span>
          <span className="rounded-md bg-muted px-2 py-0.5">{TIMING_LABEL[r.timing]}</span>
          {left && <span className="text-muted-foreground">{left}</span>}
        </div>
        <h1 id="req-title" className="mt-3 text-[28px] font-bold leading-tight">{r.title}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {r.quarter ? `${r.quarter}, ${r.city}` : r.city}, publiée {agoText(r.createdAt)}
        </p>
        {r.description && <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed">{r.description}</p>}
        <div className="mt-5">
          <RequestMedia request={r} compact />
        </div>

        {actionError && <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">{actionError}</p>}
        <div className="mt-6 flex flex-wrap gap-2">
          {r.status === 'EXPIRED' && (
            <button
              type="button"
              onClick={() => relaunch.mutate()}
              disabled={relaunch.isPending}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white hover:bg-brand-900 disabled:opacity-60 dark:bg-brand-300 dark:text-brand-950"
            >
              <RotateCcw className="h-4 w-4" />
              Relancer pour {r.timing === 'NOW' ? '2 heures' : '3 jours'}
            </button>
          )}
          {r.status === 'ASSIGNED' && r.bookingId && (
            <Link href={`/dashboard/client/bookings/${r.bookingId}`} className="inline-flex h-11 items-center rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white hover:bg-brand-900 dark:bg-brand-300 dark:text-brand-950">
              Voir la réservation
            </Link>
          )}
          {(open || r.status === 'EXPIRED') && (
            <button
              type="button"
              onClick={() => window.confirm('Retirer cette demande ? Les prestataires ne la verront plus.') && cancel.mutate()}
              disabled={cancel.isPending}
              className="inline-flex h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-muted-foreground hover:border-gray-400 hover:text-foreground"
            >
              Retirer la demande
            </button>
          )}
        </div>
      </section>

      {/* Les devis */}
      <section aria-labelledby="quotes-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="quotes-title" className="text-xl font-bold">
              {sorted.length === 0 ? 'Devis' : `${sorted.length} devis`}
              <span className="ml-2 text-base font-medium text-muted-foreground">sur {r.maxQuotes} au plus</span>
            </h2>
          </div>
          {sorted.length > 1 && (
            <div role="tablist" aria-label="Trier les devis" className="flex rounded-lg bg-muted p-1 text-sm font-semibold">
              {([['best', 'Recommandés'], ['price', 'Prix'], ['soon', 'Date']] as const).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={sort === k}
                  onClick={() => setSort(k)}
                  className={cn('h-8 rounded-md px-3 transition-colors', sort === k ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {quotes.isLoading ? (
          <div className="mt-5 space-y-3">
            {[0, 1].map((i) => <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-gray-300 px-6 py-10 dark:border-gray-700">
            <p className="text-[16px] font-semibold">{open ? 'Les prestataires regardent votre demande' : 'Aucun devis reçu'}</p>
            <p className="mt-2 max-w-md text-[15px] text-muted-foreground">
              {open
                ? 'Les premiers devis arrivent en général dans l’heure. Vous êtes prévenu à chaque nouveau devis.'
                : 'Ajoutez une photo ou une note vocale dans une nouvelle demande : les prestataires répondent plus volontiers quand ils voient le problème.'}
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {sorted.map((q) => {
              const chosen = q.status === 'ACCEPTED';
              const inactive = q.status !== 'SENT' && !chosen;
              return (
                <li
                  key={q.id}
                  className={cn(
                    'rounded-xl border bg-card p-5 transition-opacity',
                    chosen ? 'border-sun-500 ring-1 ring-sun-500' : 'border-border',
                    inactive && 'opacity-55'
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    <Avatar className="h-12 w-12">
                      {q.providerAvatarUrl && <AvatarImage src={q.providerAvatarUrl} alt="" />}
                      <AvatarFallback className="bg-brand-100 font-display text-sm font-bold text-brand-900">{getInitials(q.providerName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <Link href={`/providers/${q.providerId}`} className="text-[16px] font-semibold hover:underline">
                        {q.providerName}
                      </Link>
                      <p className="truncate text-[13px] text-muted-foreground">{q.providerTitle}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                        <span className="flex items-center gap-1 font-semibold">
                          <Star className="h-3.5 w-3.5 fill-sun-400 text-sun-500" />
                          {q.reviewCount > 0 ? `${q.ratingAvg.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} (${q.reviewCount} avis)` : 'Nouveau'}
                        </span>
                        {kmText(q.distanceKm) && <span className="text-muted-foreground">{kmText(q.distanceKm)}</span>}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular font-display text-xl font-bold">{priceText(q.price, q.priceKind)}</p>
                      <p className="text-[12px] text-muted-foreground" title={PRICE_KIND_HINT[q.priceKind]}>{PRICE_KIND_LABEL[q.priceKind]}</p>
                      {q.status === 'SENT' && q.price === cheapest && sorted.length > 1 && (
                        <p className="mt-1 text-[12px] font-semibold text-brand-700 dark:text-brand-300">Le moins cher</p>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 flex items-center gap-2 text-[14px] font-semibold">
                    <CalendarClock className="h-4 w-4 text-brand-700 dark:text-brand-300" />
                    Passe {whenText(q.availableAt)}
                  </p>
                  {q.message && <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">« {q.message} »</p>}

                  {open && q.status === 'SENT' && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          accept.reset();
                          setConfirm(q);
                        }}
                        className="inline-flex h-11 items-center rounded-lg bg-sun-400 px-5 text-[15px] font-bold text-gray-950 shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)] hover:bg-sun-300"
                      >
                        Choisir {q.providerName.split(' ')[0]}
                      </button>
                      <button
                        type="button"
                        onClick={() => ask.mutate(q)}
                        disabled={ask.isPending}
                        className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold hover:border-gray-400 dark:hover:border-gray-600"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Poser une question
                      </button>
                    </div>
                  )}
                  {chosen && <p className="mt-3 text-sm font-semibold">Vous avez choisi ce devis.</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && !accept.isPending && setConfirm(null)}>
        <DialogContent className="max-w-md">
          {confirm && (
            <>
              <DialogTitle className="text-xl">Choisir {confirm.providerName} ?</DialogTitle>
              <DialogDescription className="sr-only">Récapitulatif avant paiement</DialogDescription>
              <dl className="mt-2 space-y-2 text-[15px]">
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Prix</dt><dd className="font-semibold">{priceText(confirm.price, confirm.priceKind)}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Passage</dt><dd className="text-right font-semibold">{whenText(confirm.availableAt)}</dd></div>
              </dl>
              <p className="mt-4 flex gap-2.5 rounded-lg bg-brand-50 p-3 text-sm leading-relaxed text-brand-900 dark:bg-brand-900/40 dark:text-brand-100">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                Vous payez maintenant par Mobile Money, Ouvra garde l’argent. Il est payé quand vous lui donnez votre code, une fois le travail fini.
              </p>
              {confirm.priceKind !== 'FIXED' && <p className="mt-3 text-[13px] text-muted-foreground">{PRICE_KIND_HINT[confirm.priceKind]}</p>}
              {accept.isError && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{getApiErrorMessage(accept.error, 'Le choix n’a pas pu être enregistré.')}</p>}
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setConfirm(null)} disabled={accept.isPending} className="h-11 rounded-lg border border-border px-4 text-sm font-semibold">
                  Comparer encore
                </button>
                <button
                  type="button"
                  onClick={() => accept.mutate(confirm)}
                  disabled={accept.isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-sun-400 px-5 text-[15px] font-bold text-gray-950 hover:bg-sun-300 disabled:opacity-60"
                >
                  {accept.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirmer et payer
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
