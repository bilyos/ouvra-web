'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Loader2, LockKeyhole, RotateCcw } from 'lucide-react';
import { bookingApi } from '@/services/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { BookingItem } from '@/types';

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

/** Le code se lit chiffre par chiffre, comme on le dicte au téléphone. */
export function CompletionCode({ code, size = 'md' }: { code: string; size?: 'md' | 'lg' }) {
  return (
    <span className="inline-flex gap-1.5" aria-label={`Code ${code.split('').join(' ')}`}>
      {code.split('').map((d, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(
            'flex items-center justify-center rounded-lg bg-gray-950 font-display font-bold tabular text-sun-300 dark:bg-white dark:text-gray-950',
            size === 'lg' ? 'h-14 w-12 text-3xl' : 'h-10 w-9 text-xl'
          )}
        >
          {d}
        </span>
      ))}
    </span>
  );
}

/**
 * Ce que le client doit savoir et faire sur l'argent d'une réservation :
 * payer, remettre le code, confirmer ou signaler un problème.
 */
export function ClientEscrowPanel({ booking }: { booking: BookingItem }) {
  const queryClient = useQueryClient();
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    queryClient.invalidateQueries({ queryKey: ['booking', booking.id] });
  };

  const confirmMutation = useMutation({ mutationFn: () => bookingApi.confirmCompletion(booking.id), onSuccess: refresh });
  const disputeMutation = useMutation({
    mutationFn: () => bookingApi.dispute(booking.id, reason.trim()),
    onSuccess: () => {
      setReporting(false);
      refresh();
    },
  });
  const error = confirmMutation.error ?? disputeMutation.error;

  const escrow = booking.escrowStatus ?? 'NONE';
  const workStarted = booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED';

  // Réservation acceptée, pas encore payée
  if (escrow === 'NONE') {
    if (booking.status !== 'ACCEPTED' && booking.status !== 'IN_PROGRESS') return null;
    return (
      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-sun-200 bg-sun-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-sun-500/25 dark:bg-sun-500/[0.07]">
        <p className="flex items-start gap-2.5 text-sm">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-sun-700 dark:text-sun-300" />
          <span>
            <span className="font-semibold">Payez pour confirmer l&apos;intervention.</span>{' '}
            <span className="text-foreground/70">L&apos;argent reste chez Ouvra jusqu&apos;à la fin du travail.</span>
          </span>
        </p>
        <Link
          href={`/dashboard/client/bookings/${booking.id}/pay`}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-sun-400 px-4 text-sm font-bold text-gray-950 transition-colors hover:bg-sun-300"
        >
          Payer {formatPrice(booking.price)}
        </Link>
      </div>
    );
  }

  if (escrow === 'RELEASED') {
    return (
      <p className="mt-4 flex items-center gap-2 text-sm text-brand-800 dark:text-brand-200">
        <Check className="h-4 w-4" strokeWidth={3} />
        Prestataire payé. Merci d&apos;avoir confirmé.
        {booking.providerId && (
          <Link href={`/providers/${booking.providerId}`} className="font-semibold underline underline-offset-4">
            Laisser un avis
          </Link>
        )}
      </p>
    );
  }

  if (escrow === 'REFUNDED') {
    return (
      <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <RotateCcw className="h-4 w-4" />
        {formatPrice(booking.price)} vous ont été remboursés.
      </p>
    );
  }

  if (escrow === 'DISPUTED') {
    return (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm dark:border-red-500/25 dark:bg-red-500/[0.07]">
        <p className="flex items-center gap-2 font-semibold text-red-800 dark:text-red-200">
          <AlertTriangle className="h-4 w-4" />
          Problème signalé, paiement bloqué
        </p>
        <p className="mt-1 text-foreground/75">
          Notre équipe examine la situation et revient vers vous. Votre message : « {booking.disputeReason} »
        </p>
      </div>
    );
  }

  // HELD : l'argent est bloqué, le client détient le code
  return (
    <div className="mt-4 rounded-lg border border-border bg-paper p-4">
      {booking.status === 'COMPLETED' && booking.releaseAt ? (
        <p className="text-sm">
          <span className="font-semibold">Le prestataire indique avoir terminé.</span>{' '}
          <span className="text-foreground/75">
            Sans réponse de votre part, il sera payé {formatDeadline(booking.releaseAt)}.
          </span>
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            <span className="font-semibold">Paiement sécurisé.</span>{' '}
            <span className="text-foreground/75">
              Une fois le travail terminé et vérifié, donnez ce code au prestataire : c&apos;est ce qui le paie.
            </span>
          </p>
          {booking.completionCode && <CompletionCode code={booking.completionCode} />}
        </div>
      )}

      {workStarted && !reporting && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => confirmMutation.mutate()}
            disabled={confirmMutation.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-900 disabled:opacity-60 dark:bg-brand-300 dark:text-brand-950"
          >
            {confirmMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Le travail est bien fait, payer le prestataire
          </button>
          <button
            type="button"
            onClick={() => setReporting(true)}
            className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold transition-colors hover:border-red-300 hover:text-red-700 dark:hover:text-red-300"
          >
            Signaler un problème
          </button>
        </div>
      )}

      {reporting && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            disputeMutation.mutate();
          }}
        >
          <label htmlFor={`dispute-${booking.id}`} className="block text-sm font-medium">
            Qu&apos;est-ce qui ne va pas ?
          </label>
          <textarea
            id={`dispute-${booking.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
            placeholder="Ex : le robinet fuit toujours, travail non terminé…"
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-[15px] focus:border-brand-600 focus:outline-none focus:ring-[3px] focus:ring-brand-600/15"
          />
          <p className="text-[13px] text-muted-foreground">Le paiement reste bloqué le temps que notre équipe examine la situation.</p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={disputeMutation.isPending || reason.trim().length < 5}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {disputeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Envoyer le signalement
            </button>
            <button type="button" onClick={() => setReporting(false)} className="h-10 rounded-lg px-4 text-sm font-medium text-muted-foreground hover:text-foreground">
              Annuler
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
          {getApiErrorMessage(error, 'L’action n’a pas abouti. Réessayez.')}
        </p>
      )}
    </div>
  );
}
