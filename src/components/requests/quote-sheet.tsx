'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, MapPin, ShieldAlert } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { availabilityApi, providerApi, requestApi } from '@/services/api';
import { SlotPicker } from '@/components/availability/slot-picker';
import { RequestMedia } from '@/components/requests/request-media';
import { PRICE_KIND_HINT, PRICE_KIND_LABEL, QUOTE_STATUS, TIMING_LABEL, agoText, kmText, priceText, whenText } from '@/components/requests/labels';
import { getApiErrorMessage } from '@/utils/api-error';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { JobRequestItem, PriceKind } from '@/types';

const field =
  'w-full rounded-lg border border-border bg-card px-3.5 text-[15px] transition-[border-color,box-shadow] placeholder:text-gray-400 hover:border-gray-300 focus:border-brand-600 focus:outline-none focus:ring-[3px] focus:ring-brand-600/15 dark:hover:border-gray-700';

const TIMES = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

// Même repérage que le serveur : on prévient avant l'envoi plutôt que d'attendre le refus
const CONTACT = /(?:(?:\+|00)\s*)?(?:237[\s.-]*)?[62](?:[\s.-]?\d){8}|wh?ats?\s*app?|wa\.me|@[\w-]+\.[a-z]{2,}|appel+e?z?[\s-]*moi/i;

function isoDay(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** La demande en entier, puis le devis : un prix, un créneau, un mot. */
export function QuoteSheet({ request, onOpenChange }: { request: JobRequestItem | null; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const open = !!request;
  const [price, setPrice] = useState('');
  const [kind, setKind] = useState<PriceKind>('FIXED');
  const [message, setMessage] = useState('');
  const [slot, setSlot] = useState<string | null>(null);
  const [day, setDay] = useState(isoDay(1));
  const [time, setTime] = useState('10:00');
  const [formError, setFormError] = useState<string | null>(null);

  const profile = useQuery({ queryKey: ['provider', 'me'], queryFn: providerApi.myProfile, enabled: open, staleTime: 5 * 60_000 });
  const slots = useQuery({
    queryKey: ['slots', profile.data?.id],
    queryFn: () => availabilityApi.slots(profile.data!.id, 7),
    enabled: open && !!profile.data?.id,
  });
  const hasSchedule = slots.data?.hasSchedule ?? false;
  const freeDate = useMemo(() => (day && time ? new Date(`${day}T${time}`) : null), [day, time]);
  const availableAt = hasSchedule ? (slot ? new Date(slot) : null) : freeDate;

  const send = useMutation({
    mutationFn: () => requestApi.sendQuote(request!.id, { price: Number(price), priceKind: kind, message: message.trim() || undefined, availableAt: availableAt!.toISOString() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['requests', 'feed'] });
      void queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: () => {
      if (hasSchedule) {
        setSlot(null);
        void slots.refetch();
      }
    },
  });
  const withdraw = useMutation({
    mutationFn: (quoteId: string) => requestApi.withdrawQuote(quoteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['requests', 'feed'] });
      void queryClient.invalidateQueries({ queryKey: ['quotes'] });
      onOpenChange(false);
    },
  });

  const leak = CONTACT.test(message);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(Number(price) >= 500)) return setFormError('Indiquez un prix d’au moins 500 FCFA.');
    if (!availableAt) return setFormError('Choisissez quand vous pouvez passer.');
    if (availableAt.getTime() < Date.now()) return setFormError('Ce créneau est déjà passé.');
    if (leak) return setFormError('Retirez le numéro ou le contact : il sera donné au client une fois la réservation confirmée.');
    setFormError(null);
    send.mutate();
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      send.reset();
      setPrice('');
      setMessage('');
      setSlot(null);
      setFormError(null);
    }
  };

  const r = request;
  const mine = r?.myQuote && r.myQuote.status !== 'WITHDRAWN' && r.myQuote.status !== 'EXPIRED' ? r.myQuote : null;
  const full = r ? r.quoteCount >= r.maxQuotes : false;

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent side="right" className="sheet-panel flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-[500px]">
        {r && (
          <>
            <div className="border-b border-border px-6 pb-5 pt-6">
              <div className="flex flex-wrap items-center gap-2 pr-8 text-[12px] font-semibold">
                <span className={cn('rounded-md px-2 py-0.5', r.timing === 'NOW' ? 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-200' : 'bg-muted')}>{TIMING_LABEL[r.timing]}</span>
                <span className="text-muted-foreground">{agoText(r.createdAt)}</span>
              </div>
              <SheetTitle className="mt-2 text-2xl font-bold leading-tight">{r.title}</SheetTitle>
              <SheetDescription className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                {[r.quarter, r.city].filter(Boolean).join(', ')}
                {kmText(r.distanceKm) ? `, ${kmText(r.distanceKm)}` : ''}. Demande de {r.clientName}
              </SheetDescription>
              {r.description && <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed">{r.description}</p>}
              <div className="mt-4">
                <RequestMedia request={r} compact />
              </div>
              {r.budgetMax ? <p className="mt-4 text-sm">Budget du client : <span className="font-semibold">{formatPrice(r.budgetMax)} au plus</span></p> : null}
            </div>

            {send.isSuccess ? (
              <div className="px-6 py-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sun-300 text-gray-950">
                  <Check className="h-6 w-6" strokeWidth={3} />
                </span>
                <p className="mt-4 text-xl font-bold">Devis envoyé</p>
                <p className="mt-2 text-[15px] text-muted-foreground">Le client est prévenu. Si vous êtes choisi, la réservation apparaît dans vos réservations avec l’adresse.</p>
                <button type="button" onClick={() => close(false)} className="mt-6 h-11 rounded-lg border border-border px-4 text-sm font-semibold">
                  Retour aux demandes
                </button>
              </div>
            ) : mine ? (
              <div className="px-6 py-6">
                <p className="text-sm font-semibold text-muted-foreground">Votre devis</p>
                <p className="mt-1 font-display text-2xl font-bold">{priceText(mine.price, mine.priceKind)}</p>
                <p className="mt-1 text-[15px]">Passage {whenText(mine.availableAt)}</p>
                {mine.message && <p className="mt-3 text-[15px] text-foreground/85">« {mine.message} »</p>}
                <p className={cn('mt-4 inline-block rounded-md px-2 py-0.5 text-[12px] font-semibold', QUOTE_STATUS[mine.status].tone)}>{QUOTE_STATUS[mine.status].label}</p>
                {mine.status === 'SENT' && (
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => withdraw.mutate(mine.id)}
                      disabled={withdraw.isPending}
                      className="h-11 rounded-lg border border-border px-4 text-sm font-semibold hover:border-gray-400"
                    >
                      Retirer pour en proposer un autre
                    </button>
                    {withdraw.isError && <p className="mt-2 text-sm text-red-700 dark:text-red-300">{getApiErrorMessage(withdraw.error, 'Retrait impossible.')}</p>}
                  </div>
                )}
              </div>
            ) : full ? (
              <p className="px-6 py-8 text-[15px] text-muted-foreground">Le client a déjà reçu {r.maxQuotes} devis : cette demande est complète.</p>
            ) : (
              <form onSubmit={submit} noValidate className="flex flex-1 flex-col gap-6 px-6 py-6">
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold">Votre prix</legend>
                  <div className="grid grid-cols-3 gap-1.5" role="radiogroup">
                    {(['FIXED', 'FROM', 'AFTER_VISIT'] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        role="radio"
                        aria-checked={kind === k}
                        onClick={() => setKind(k)}
                        className={cn(
                          'h-10 rounded-lg border px-2 text-[13px] font-semibold transition-colors',
                          kind === k ? 'border-brand-800 bg-brand-800 text-white dark:border-brand-300 dark:bg-brand-300 dark:text-brand-950' : 'border-border bg-card hover:border-gray-400'
                        )}
                      >
                        {PRICE_KIND_LABEL[k]}
                      </button>
                    ))}
                  </div>
                  <div className="relative mt-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={500}
                      step={500}
                      aria-label="Prix en FCFA"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="15 000"
                      className={cn(field, 'h-12 pr-16 text-lg font-semibold')}
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">FCFA</span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-muted-foreground">{PRICE_KIND_HINT[kind]}</p>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 text-sm font-semibold">Quand pouvez-vous passer ?</legend>
                  {slots.isLoading || profile.isLoading ? (
                    <div className="h-24 animate-pulse rounded-lg bg-muted" />
                  ) : hasSchedule && slots.data ? (
                    <SlotPicker data={slots.data} value={slot} onChange={setSlot} />
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-1.5">
                        {[
                          [isoDay(0), 'Aujourd’hui'],
                          [isoDay(1), 'Demain'],
                          [isoDay(2), 'Après-demain'],
                        ].map(([d, label]) => (
                          <button
                            key={d}
                            type="button"
                            aria-pressed={day === d}
                            onClick={() => setDay(d)}
                            className={cn('h-10 flex-1 rounded-lg border text-[13px] font-semibold', day === d ? 'border-brand-800 bg-brand-800 text-white dark:border-brand-300 dark:bg-brand-300 dark:text-brand-950' : 'border-border bg-card')}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-6 gap-1.5">
                        {TIMES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            aria-pressed={time === t}
                            onClick={() => setTime(t)}
                            className={cn('tabular h-9 rounded-md border text-[13px] font-semibold', time === t ? 'border-brand-800 ring-1 ring-brand-800 dark:border-brand-300 dark:ring-brand-300' : 'border-border bg-card')}
                          >
                            {t.replace(':00', ' h').replace(/^0/, '')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </fieldset>

                <div>
                  <label htmlFor="q-msg" className="mb-1.5 block text-sm font-semibold">
                    Un mot au client <span className="font-normal text-muted-foreground">(facultatif)</span>
                  </label>
                  <textarea
                    id="q-msg"
                    rows={3}
                    maxLength={500}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ce que vous ferez, le matériel compris, votre expérience sur ce genre de panne"
                    className={cn(field, 'resize-none py-3', leak && 'border-red-400 focus:border-red-500 focus:ring-red-500/15')}
                  />
                  {leak && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-[13px] text-red-700 dark:text-red-300">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      Pas de numéro ni de WhatsApp ici : le client vous les donnera une fois la réservation confirmée. C’est ce qui garantit votre paiement.
                    </p>
                  )}
                </div>

                {(formError || send.isError) && (
                  <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                    {formError ?? getApiErrorMessage(send.error, 'Le devis n’a pas pu être envoyé.')}
                  </p>
                )}

                <div className="mt-auto border-t border-border pt-5">
                  <button
                    type="submit"
                    disabled={send.isPending}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sun-400 text-[15px] font-bold text-gray-950 shadow-[inset_0_-3px_0_rgb(0_0_0/0.14)] hover:bg-sun-300 disabled:opacity-60"
                  >
                    {send.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Envoyer mon devis{Number(price) >= 500 ? ` de ${formatPrice(Number(price))}` : ''}
                  </button>
                  <p className="mt-2 text-center text-[12px] text-muted-foreground">{r.quoteCount} devis déjà envoyé{r.quoteCount > 1 ? 's' : ''} sur {r.maxQuotes}</p>
                </div>
              </form>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
