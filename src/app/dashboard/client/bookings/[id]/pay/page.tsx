'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { bookingApi } from '@/services/api';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';
import { CompletionCode } from '@/components/bookings/client-escrow-panel';
import type { PaymentMethod } from '@/types';
import { getApiErrorMessage } from '@/utils/api-error';
import { normalizeCameroonPhone } from '@/utils/phone';
import { useAuthStore } from '@/stores/auth-store';

const paymentMethods: {
  id: PaymentMethod;
  label: string;
  description: string;
}[] = [
  {
    id: 'ORANGE_MONEY',
    label: 'Orange Money',
    description: 'Validation sur votre téléphone avec votre code secret',
  },
  {
    id: 'MTN_MOMO',
    label: 'MTN Mobile Money',
    description: 'Validation sur votre téléphone avec votre code secret',
  },
  {
    id: 'CARD',
    label: 'Carte bancaire',
    description: 'Visa, Mastercard',
  },
];

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const userPhone = useAuthStore((st) => st.user?.phone);
  // Pré-rempli avec le numéro du compte, sans l'indicatif affiché à part
  const [phoneNumber, setPhoneNumber] = useState(() => (userPhone ?? '').replace(/^\+?237/, ''));
  const [finalAmount, setFinalAmount] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.detail(id),
    enabled: !!id,
  });

  const payMutation = useMutation({
    mutationFn: () => {
      const amount = parseInt(finalAmount);
      return bookingApi.initPayment(id, {
        method: selectedMethod!,
        phoneNumber: needsPhone ? normalizedPhone ?? undefined : undefined,
        finalAmount: Number.isNaN(amount) ? undefined : amount,
      });
    },
    onSuccess: (payment) => {
      confirmMutation.mutate(payment.id);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (paymentId: string) => bookingApi.confirmPayment(paymentId),
    onSuccess: () => {
      setPaymentSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
    },
  });

  const needsPhone = selectedMethod === 'ORANGE_MONEY' || selectedMethod === 'MTN_MOMO';
  // Champ vide = prix convenu. Le serveur refuse tout montant inférieur.
  const parsedAmount = finalAmount.trim() === '' ? booking?.price ?? NaN : parseInt(finalAmount);
  const isValidAmount = !isNaN(parsedAmount) && booking != null && parsedAmount >= booking.price;
  const normalizedPhone = normalizeCameroonPhone(phoneNumber);
  const canPay = selectedMethod && isValidAmount && (!needsPhone || !!normalizedPhone);
  const isPaying = payMutation.isPending || confirmMutation.isPending;
  // Séquestre : on paie une fois la réservation acceptée, avant l'intervention
  const canBePaid = (booking?.status === 'ACCEPTED' || booking?.status === 'IN_PROGRESS') && (booking?.escrowStatus ?? 'NONE') === 'NONE';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="py-20 text-center text-gray-500">Réservation introuvable</div>
    );
  }

  if (paymentSuccess) {
    const paidAmount = parsedAmount || booking.price;
    return (
      <div
        className="mx-auto max-w-lg py-16 text-center"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/15">
          <CheckCircle2 className="h-10 w-10 text-brand-600 dark:text-brand-300" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">Paiement sécurisé</h2>
        <p className="mb-6 text-muted-foreground">
          Vos <span className="font-semibold text-foreground">{formatPrice(paidAmount)}</span> sont gardés par Ouvra.{' '}
          {booking.providerName} est prévenu et peut intervenir.
        </p>
        <div className="mb-8 rounded-xl border border-border bg-paper p-5">
          <p className="text-sm font-semibold">Votre code de fin de travail</p>
          <div className="my-3 flex justify-center">
            {booking.completionCode ? <CompletionCode code={booking.completionCode} size="lg" /> : <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
          </div>
          <p className="text-sm text-muted-foreground">
            Donnez-le au prestataire seulement quand le travail est terminé et vérifié : c&apos;est ce qui le paie.
            Vous le retrouvez à tout moment dans vos réservations.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.push('/dashboard/client/bookings')}
            className="inline-flex h-12 items-center rounded-lg bg-sun-400 px-6 text-[15px] font-bold text-gray-950 hover:bg-sun-300"
          >
            Mes réservations
          </button>
          <button
            onClick={() => router.push('/dashboard/client')}
            className="inline-flex h-12 items-center rounded-lg border border-border px-6 text-[15px] font-semibold hover:bg-muted"
          >
            Tableau de bord
          </button>
        </div>
      </div>
    );
  }

  if (!canBePaid) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <button
          onClick={() => router.back()}
          className="mx-auto mb-8 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sun-100 dark:bg-sun-500/15">
          <AlertCircle className="h-10 w-10 text-sun-600 dark:text-sun-400" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">Paiement non disponible</h2>
        <p className="mb-2 text-muted-foreground">
          {(booking.escrowStatus ?? 'NONE') !== 'NONE'
            ? 'Cette réservation est déjà payée.'
            : 'Le paiement est possible dès que le prestataire a accepté la réservation.'}
        </p>
        <p className="text-sm text-gray-400">
          Statut actuel : <span className="font-medium">{booking.status === 'PENDING' ? 'En attente' : booking.status === 'ACCEPTED' ? 'Acceptée' : booking.status === 'IN_PROGRESS' ? 'En cours' : booking.status}</span>
        </p>
      </div>
    );
  }

  const methodBadge = (id: PaymentMethod) =>
    id === 'ORANGE_MONEY' ? (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#ff7900] text-[13px] font-black text-white">OM</span>
    ) : id === 'MTN_MOMO' ? (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#ffcc00] text-[12px] font-black text-gray-950">MTN</span>
    ) : (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-950">
        <CreditCard className="h-5 w-5" />
      </span>
    );

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <div>
        <h1 className="text-3xl font-bold">Payer l’intervention</h1>
        <p className="mt-1.5 max-w-2xl text-[15px] text-muted-foreground">
          L’argent reste chez Ouvra jusqu’à la fin du travail. Vous recevez ensuite un code à donner au prestataire quand tout est bon.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <fieldset className="rounded-xl border border-border bg-card p-5">
            <legend className="float-left mb-3 w-full font-semibold">Moyen de paiement</legend>
            <div role="radiogroup" aria-label="Moyen de paiement" className="clear-both space-y-2">
              {paymentMethods.map((m) => {
                const active = selectedMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelectedMethod(m.id)}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-lg border p-3.5 text-left transition-colors',
                      active ? 'border-brand-700 ring-1 ring-brand-700 dark:border-brand-300 dark:ring-brand-300' : 'border-border hover:border-gray-400 dark:hover:border-gray-600'
                    )}
                  >
                    {methodBadge(m.id)}
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{m.label}</span>
                      <span className="block text-[13px] text-muted-foreground">{m.description}</span>
                    </span>
                    <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', active ? 'border-brand-700 bg-brand-700 dark:border-brand-300 dark:bg-brand-300' : 'border-gray-300 dark:border-gray-600')}>
                      {active && <span className="h-2 w-2 rounded-full bg-white dark:bg-brand-950" />}
                    </span>
                  </button>
                );
              })}
            </div>

            {needsPhone && (
              <div className="mt-5 border-t border-border pt-5">
                <label htmlFor="pay-phone" className="mb-1.5 block text-sm font-semibold">
                  Numéro {selectedMethod === 'ORANGE_MONEY' ? 'Orange Money' : 'MTN MoMo'}
                </label>
                <div className="flex h-12 max-w-sm items-stretch overflow-hidden rounded-lg border border-border bg-card focus-within:border-brand-600 focus-within:ring-[3px] focus-within:ring-brand-600/15">
                  <span className="flex items-center border-r border-border bg-paper px-3 text-[15px] font-semibold text-foreground/80">+237</span>
                  <input
                    id="pay-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s]/g, ''))}
                    placeholder="6 90 00 01 01"
                    className="min-w-0 flex-1 bg-transparent px-3 text-[16px] font-medium tabular outline-none"
                  />
                </div>
                <p className="mt-1.5 text-[13px] text-muted-foreground">Une demande de validation arrive sur ce téléphone : tapez votre code secret pour confirmer.</p>
              </div>
            )}
          </fieldset>

          <div className="rounded-xl border border-border bg-card p-5">
            <label htmlFor="pay-amount" className="font-semibold">
              Montant
            </label>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Prix convenu : {formatPrice(booking.price)}. Augmentez-le seulement si vous avez convenu d’un montant plus élevé.
            </p>
            <div className="mt-3 flex h-12 max-w-xs items-stretch overflow-hidden rounded-lg border border-border bg-card focus-within:border-brand-600 focus-within:ring-[3px] focus-within:ring-brand-600/15">
              <input
                id="pay-amount"
                type="number"
                inputMode="numeric"
                value={finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
                placeholder={String(booking.price)}
                min={booking.price}
                step={500}
                className="min-w-0 flex-1 bg-transparent px-3.5 text-lg font-semibold tabular outline-none"
              />
              <span className="flex items-center border-l border-border bg-paper px-3 text-sm font-semibold text-muted-foreground">FCFA</span>
            </div>
            {!isValidAmount && finalAmount.trim() !== '' && (
              <p role="alert" className="mt-2 text-[13px] text-red-600 dark:text-red-300">
                Le montant ne peut pas être inférieur au prix convenu ({formatPrice(booking.price)}).
              </p>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6">
          <p className="font-semibold">{booking.title}</p>
          <p className="text-sm text-muted-foreground">{booking.providerName}</p>
          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Pour le prestataire</dt>
              <dd className="tabular">{isValidAmount ? formatPrice(Math.round(parsedAmount * 0.9)) : '–'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Frais de service (10 %)</dt>
              <dd className="tabular">{isValidAmount ? formatPrice(Math.round(parsedAmount * 0.1)) : '–'}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <dt className="font-semibold">Total</dt>
              <dd className="font-display text-2xl font-bold tabular">{isValidAmount ? formatPrice(parsedAmount) : '–'}</dd>
            </div>
          </dl>

          {(payMutation.isError || confirmMutation.isError) && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
              {getApiErrorMessage(payMutation.error ?? confirmMutation.error, 'Le paiement n’a pas abouti. Vérifiez votre solde Mobile Money puis réessayez.')}
            </p>
          )}

          <button
            type="button"
            onClick={() => payMutation.mutate()}
            disabled={!canPay || isPaying}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-sun-400 text-[15px] font-bold text-gray-950 shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)] transition-colors hover:bg-sun-300 disabled:opacity-50"
          >
            {isPaying ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {isPaying ? 'Paiement en cours…' : `Payer ${isValidAmount ? formatPrice(parsedAmount) : ''}`}
          </button>
          {!selectedMethod && <p className="mt-2 text-center text-[13px] text-muted-foreground">Choisissez un moyen de paiement.</p>}

          <p className="mt-5 flex gap-2 border-t border-border pt-4 text-[13px] leading-snug text-muted-foreground">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" />
            Si le travail n’est pas fait, vous pouvez signaler un problème : l’argent reste bloqué jusqu’à la décision de notre équipe.
          </p>
        </aside>
      </div>
    </div>
  );
}
