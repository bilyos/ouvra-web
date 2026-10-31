'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { availabilityApi, bookingApi } from '@/services/api';
import { SlotPicker } from '@/components/availability/slot-picker';
import { getApiErrorMessage } from '@/utils/api-error';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import { PlacePicker, loadSavedPlace, type PickedPlace } from '@/components/location/place-picker';

const SLOTS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

function isoDay(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const field =
  'w-full rounded-lg border border-border bg-card px-3.5 text-[15px] transition-[border-color,box-shadow] placeholder:text-gray-400 hover:border-gray-300 focus:border-brand-600 focus:outline-none focus:ring-[3px] focus:ring-brand-600/15 dark:hover:border-gray-700';

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-10 rounded-lg border px-3.5 text-sm font-semibold transition-colors',
        active
          ? 'border-brand-800 bg-brand-800 text-white dark:border-brand-300 dark:bg-brand-300 dark:text-brand-950'
          : 'border-border bg-card hover:border-gray-400 dark:hover:border-gray-600'
      )}
    >
      {children}
    </button>
  );
}

/** Demande d'intervention : quoi, quand, où, quel budget. Le paiement vient après l'acceptation. */
export function RequestSheet({
  open,
  onOpenChange,
  providerId,
  providerName,
  startingPrice,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  providerName: string;
  startingPrice: number;
}) {
  const t = useTranslations('provider.request');
  const queryClient = useQueryClient();
  const [what, setWhat] = useState('');
  const [details, setDetails] = useState('');
  const [dayChoice, setDayChoice] = useState<'today' | 'tomorrow' | 'other'>('tomorrow');
  const [otherDay, setOtherDay] = useState('');
  const [time, setTime] = useState('10:00');
  const [where, setWhere] = useState('');
  const [place, setPlace] = useState<PickedPlace | null>(null);
  useEffect(() => {
    const saved = loadSavedPlace();
    if (saved) queueMicrotask(() => setPlace(saved));
  }, []);
  const [budget, setBudget] = useState(String(startingPrice));
  const [formError, setFormError] = useState<string | null>(null);

  // Créneaux réellement libres si le prestataire a indiqué ses horaires ; sinon, date libre
  const slotsQuery = useQuery({
    queryKey: ['slots', providerId],
    queryFn: () => availabilityApi.slots(providerId, 7),
    enabled: open,
    refetchInterval: open ? 60_000 : false,
  });
  const hasSchedule = slotsQuery.data?.hasSchedule ?? false;
  const [slot, setSlot] = useState<string | null>(null);

  const day = dayChoice === 'today' ? isoDay(0) : dayChoice === 'tomorrow' ? isoDay(1) : otherDay;
  const freeDate = useMemo(() => (day && time ? new Date(`${day}T${time}`) : null), [day, time]);
  const scheduledAt = hasSchedule ? (slot ? new Date(slot) : null) : freeDate;

  const mutation = useMutation({
    mutationFn: () =>
      bookingApi.create({
        providerId,
        title: what.trim(),
        description: details.trim() || undefined,
        scheduledAt: scheduledAt!.toISOString(),
        address: [place?.source === 'list' ? place.label : null, where.trim()].filter(Boolean).join(', ') || undefined,
        lat: place?.lat,
        lng: place?.lng,
        price: Number(budget) || startingPrice,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
    // Créneau pris entre-temps : on recharge l'agenda pour en choisir un autre
    onError: () => {
      if (hasSchedule) {
        setSlot(null);
        void slotsQuery.refetch();
      }
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!what.trim() || !scheduledAt) {
      setFormError(t('required'));
      return;
    }
    if (scheduledAt.getTime() < Date.now()) {
      setFormError(t('pastTime'));
      return;
    }
    setFormError(null);
    mutation.mutate();
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next && mutation.isSuccess) {
      mutation.reset();
      setWhat('');
      setDetails('');
      setWhere('');
    }
  };

  const steps = t.raw('nextSteps') as string[];

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent side="right" className="sheet-panel flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-[460px]">
        {mutation.isSuccess ? (
          <div className="flex flex-1 flex-col items-start justify-center px-6 py-10 sm:px-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200">
              <Check className="h-6 w-6" strokeWidth={3} />
            </span>
            <SheetTitle className="mt-5 font-display text-2xl font-bold">{t('successTitle')}</SheetTitle>
            <SheetDescription className="mt-2 text-[15px] text-muted-foreground">
              {t('successBody', { name: providerName })}
            </SheetDescription>
            <Link
              href="/dashboard/client/bookings"
              className="mt-8 inline-flex h-12 items-center rounded-lg bg-brand-800 px-5 text-[15px] font-semibold text-white hover:bg-brand-900 dark:bg-brand-300 dark:text-brand-950"
            >
              {t('seeBookings')}
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-1 flex-col" noValidate>
            <div className="border-b border-border px-6 pb-5 pt-6 sm:px-8">
              <SheetTitle className="font-display text-2xl font-bold">{t('title')}</SheetTitle>
              <SheetDescription className="mt-1 text-[15px] text-muted-foreground">{t('subtitle', { name: providerName })}</SheetDescription>
            </div>

            <div className="flex-1 space-y-6 px-6 py-6 sm:px-8">
              <div>
                <label htmlFor="req-what" className="mb-1.5 block text-sm font-semibold">
                  {t('what')}
                </label>
                <input id="req-what" value={what} onChange={(e) => setWhat(e.target.value)} placeholder={t('whatPlaceholder')} className={cn(field, 'h-12')} />
              </div>

              <div>
                <label htmlFor="req-details" className="mb-1.5 block text-sm font-semibold">
                  {t('details')} <span className="font-normal text-muted-foreground">({t('detailsOptional')})</span>
                </label>
                <textarea
                  id="req-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={t('detailsPlaceholder')}
                  rows={3}
                  className={cn(field, 'resize-none py-3')}
                />
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-semibold">{t('when')}</legend>
                {slotsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement de l’agenda…</p>
                ) : hasSchedule && slotsQuery.data ? (
                  <SlotPicker data={slotsQuery.data} value={slot} onChange={setSlot} />
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <Chip active={dayChoice === 'today'} onClick={() => setDayChoice('today')}>
                        {t('today')}
                      </Chip>
                      <Chip active={dayChoice === 'tomorrow'} onClick={() => setDayChoice('tomorrow')}>
                        {t('tomorrow')}
                      </Chip>
                      <Chip active={dayChoice === 'other'} onClick={() => setDayChoice('other')}>
                        {t('otherDay')}
                      </Chip>
                    </div>
                    {dayChoice === 'other' && (
                      <input
                        type="date"
                        aria-label={t('otherDay')}
                        value={otherDay}
                        min={isoDay(0)}
                        onChange={(e) => setOtherDay(e.target.value)}
                        className={cn(field, 'mt-3 h-11')}
                      />
                    )}
                    <p className="mb-2 mt-4 text-sm font-semibold">{t('time')}</p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {SLOTS.map((s) => (
                        <Chip key={s} active={time === s} onClick={() => setTime(s)}>
                          {s.replace(':00', 'h')}
                        </Chip>
                      ))}
                    </div>
                      </>
                )}
              </fieldset>

              <div>
                <p className="mb-1.5 block text-sm font-semibold">
                  {t('where')}
                </p>
                <PlacePicker value={place} onChange={setPlace} className="mb-2" />
                <input id="req-where" aria-label={t('wherePlaceholder')} value={where} onChange={(e) => setWhere(e.target.value)} placeholder={t('wherePlaceholder')} className={cn(field, 'h-12')} />
              </div>

              <div>
                <label htmlFor="req-budget" className="mb-1.5 block text-sm font-semibold">
                  {t('budget')}
                </label>
                <div className="flex h-12 items-stretch overflow-hidden rounded-lg border border-border bg-card focus-within:border-brand-600 focus-within:ring-[3px] focus-within:ring-brand-600/15">
                  <input
                    id="req-budget"
                    type="number"
                    inputMode="numeric"
                    min={500}
                    step={500}
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent px-3.5 text-[17px] font-semibold tabular outline-none"
                  />
                  <span className="flex items-center border-l border-border bg-paper px-3.5 text-sm font-semibold text-muted-foreground">FCFA</span>
                </div>
                <p className="mt-1.5 text-[13px] text-muted-foreground">{t('budgetHint', { price: formatPrice(startingPrice) })}</p>
              </div>

              <div className="rounded-xl bg-paper p-4">
                <p className="text-sm font-semibold">{t('next')}</p>
                <ol className="mt-3 space-y-2.5">
                  {steps.map((s, i) => (
                    <li key={i} className="flex gap-3 text-[14px] leading-snug text-foreground/80">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sun-400 font-display text-[12px] font-bold text-gray-950">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-border bg-card px-6 py-4 sm:px-8">
              {(formError || mutation.isError) && (
                <p role="alert" className="mb-3 text-sm text-red-700 dark:text-red-300">
                  {formError ?? getApiErrorMessage(mutation.error, t('error'))}
                </p>
              )}
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-sun-400 text-[15px] font-bold text-gray-950 shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)] transition-colors hover:bg-sun-300 disabled:opacity-60"
              >
                {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {mutation.isPending ? t('sending') : t('submit')}
              </button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
