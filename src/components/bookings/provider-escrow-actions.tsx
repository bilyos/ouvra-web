'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Clock, Loader2, Navigation, Play, RotateCcw } from 'lucide-react';
import { bookingApi } from '@/services/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { formatPrice } from '@/utils/format';
import type { BookingItem } from '@/types';

const COMMISSION = 0.1;

/**
 * Actions du prestataire autour du paiement : attendre le paiement, démarrer,
 * saisir le code du client pour être payé, ou déclarer le travail terminé.
 */
export function ProviderEscrowActions({ booking }: { booking: BookingItem }) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['bookings'] });

  const startMutation = useMutation({ mutationFn: () => bookingApi.updateStatus(booking.id, 'IN_PROGRESS'), onSuccess: refresh });
  const completeMutation = useMutation({
    mutationFn: () => bookingApi.complete(booking.id, code),
    onSuccess: () => {
      setCode('');
      refresh();
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
  const markDoneMutation = useMutation({ mutationFn: () => bookingApi.markDone(booking.id), onSuccess: refresh });
  const onTheWayMutation = useMutation({ mutationFn: () => bookingApi.onTheWay(booking.id), onSuccess: refresh });
  const error = startMutation.error ?? completeMutation.error ?? markDoneMutation.error ?? onTheWayMutation.error;

  const escrow = booking.escrowStatus ?? 'NONE';
  const earning = formatPrice(Math.round(booking.price * (1 - COMMISSION)));

  const box = 'mt-4 border-t border-border pt-4';
  const errorLine = error && (
    <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
      {getApiErrorMessage(error, 'L’action n’a pas abouti. Réessayez.')}
    </p>
  );

  if ((booking.status === 'ACCEPTED' || booking.status === 'IN_PROGRESS') && escrow === 'NONE') {
    return (
      <div className={box}>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          En attente du paiement du client. Vous pourrez démarrer dès qu&apos;il aura payé.
        </p>
      </div>
    );
  }

  if (booking.status === 'ACCEPTED' && escrow === 'HELD') {
    return (
      <div className={box}>
        <p className="text-sm">
          <span className="font-semibold">Le client a payé.</span>{' '}
          <span className="text-foreground/75">L&apos;argent est sécurisé chez Ouvra : vous recevrez {earning} à la fin du travail.</span>
        </p>
        {booking.onTheWayAt ? (
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-brand-700 dark:text-brand-300" strokeWidth={3} />
            Client prévenu de votre départ à {new Date(booking.onTheWayAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => onTheWayMutation.mutate()}
            disabled={onTheWayMutation.isPending}
            className="mr-2 mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-sun-400 px-4 text-sm font-bold text-gray-950 transition-colors hover:bg-sun-300 disabled:opacity-60"
          >
            {onTheWayMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            Je pars chez le client
          </button>
        )}
        <button
          type="button"
          onClick={() => startMutation.mutate()}
          disabled={startMutation.isPending}
          className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-900 disabled:opacity-60 dark:bg-brand-300 dark:text-brand-950"
        >
          {startMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Démarrer l&apos;intervention
        </button>
        {errorLine}
      </div>
    );
  }

  if ((booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED') && escrow === 'HELD') {
    return (
      <div className={box}>
        {booking.status === 'COMPLETED' && booking.releaseAt ? (
          <p className="flex items-start gap-2 text-sm">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span>
              <span className="font-semibold">En attente de la confirmation du client.</span>{' '}
              <span className="text-foreground/75">
                Sans signalement, vous serez payé le{' '}
                {new Date(booking.releaseAt).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}.
                Vous pouvez aussi saisir son code dès maintenant.
              </span>
            </span>
          </p>
        ) : (
          <p className="text-sm">
            <span className="font-semibold">Travail terminé ?</span>{' '}
            <span className="text-foreground/75">Demandez au client son code à 4 chiffres : vous recevez {earning} tout de suite.</span>
          </p>
        )}

        <form
          className="mt-3 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            completeMutation.mutate();
          }}
        >
          <label htmlFor={`code-${booking.id}`} className="sr-only">
            Code du client
          </label>
          <input
            id={`code-${booking.id}`}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="0000"
            className="h-11 w-28 rounded-lg border border-border bg-card text-center font-display text-xl font-bold tracking-[0.4em] tabular focus:border-brand-600 focus:outline-none focus:ring-[3px] focus:ring-brand-600/15"
          />
          <button
            type="submit"
            disabled={code.length !== 4 || completeMutation.isPending}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-sun-400 px-4 text-sm font-bold text-gray-950 transition-colors hover:bg-sun-300 disabled:opacity-50"
          >
            {completeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={3} />}
            Valider et être payé
          </button>
        </form>

        {booking.status === 'IN_PROGRESS' && (
          <button
            type="button"
            onClick={() => markDoneMutation.mutate()}
            disabled={markDoneMutation.isPending}
            className="mt-3 text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Client absent ? Déclarer le travail terminé (paiement automatique sous 48 h sauf signalement)
          </button>
        )}
        {errorLine}
      </div>
    );
  }

  if (escrow === 'DISPUTED') {
    return (
      <div className={box}>
        <p className="flex items-start gap-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <span>
            <span className="font-semibold">Le client a signalé un problème.</span>{' '}
            <span className="text-foreground/75">
              Le paiement est bloqué le temps que notre équipe examine. Message du client : « {booking.disputeReason} »
            </span>
          </span>
        </p>
      </div>
    );
  }

  if (escrow === 'RELEASED') {
    return (
      <div className={box}>
        <p className="flex items-center gap-2 text-sm text-brand-800 dark:text-brand-200">
          <Check className="h-4 w-4" strokeWidth={3} />
          Payé : {earning} versés sur votre portefeuille.
          <Link href="/dashboard/provider/wallet" className="font-semibold underline underline-offset-4">
            Voir le portefeuille
          </Link>
        </p>
      </div>
    );
  }

  if (escrow === 'REFUNDED') {
    return (
      <div className={box}>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <RotateCcw className="h-4 w-4" />
          Le paiement a été remboursé au client.
        </p>
      </div>
    );
  }

  return null;
}
