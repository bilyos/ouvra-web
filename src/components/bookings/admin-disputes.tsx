'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { adminApi } from '@/services/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { formatPrice } from '@/utils/format';
import type { BookingItem } from '@/types';

function DisputeRow({ booking }: { booking: BookingItem }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const resolve = useMutation({
    mutationFn: (decision: 'RELEASE' | 'REFUND') => adminApi.resolveDispute(booking.id, decision, note.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
  });

  return (
    <li className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{booking.title}</p>
          <p className="text-sm text-muted-foreground">
            {booking.clientName} contre {booking.providerName ?? 'prestataire inconnu'}
            {booking.disputedAt ? `, signalé le ${new Date(booking.disputedAt).toLocaleDateString('fr-FR')}` : ''}
          </p>
        </div>
        <p className="font-display text-lg font-bold tabular">{formatPrice(booking.price)}</p>
      </div>
      <blockquote className="mt-3 rounded-lg bg-paper px-4 py-3 text-[15px]">« {booking.disputeReason} »</blockquote>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor={`note-${booking.id}`} className="sr-only">
          Note pour les deux parties
        </label>
        <input
          id={`note-${booking.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Motif de la décision (envoyé aux deux parties)"
          className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-[3px] focus:ring-brand-600/15"
        />
        <button
          type="button"
          onClick={() => resolve.mutate('RELEASE')}
          disabled={resolve.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white hover:bg-brand-900 disabled:opacity-60 dark:bg-brand-300 dark:text-brand-950"
        >
          {resolve.isPending && resolve.variables === 'RELEASE' && <Loader2 className="h-4 w-4 animate-spin" />}
          Payer le prestataire
        </button>
        <button
          type="button"
          onClick={() => resolve.mutate('REFUND')}
          disabled={resolve.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
        >
          {resolve.isPending && resolve.variables === 'REFUND' && <Loader2 className="h-4 w-4 animate-spin" />}
          Rembourser le client
        </button>
      </div>
      {resolve.isError && (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">
          {getApiErrorMessage(resolve.error, 'La décision n’a pas pu être enregistrée.')}
        </p>
      )}
    </li>
  );
}

/** Les signalements de clients en attente de décision : l'argent reste bloqué jusque-là. */
export function AdminDisputes() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-disputes'], queryFn: () => adminApi.disputes() });
  const disputes = data?.content ?? [];

  if (isLoading) return null;
  if (disputes.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun litige en attente.</p>;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-red-200 bg-card dark:border-red-500/25" aria-labelledby="disputes-title">
      <h2 id="disputes-title" className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-5 py-3 font-sans text-base font-semibold tracking-normal text-red-800 dark:border-red-500/25 dark:bg-red-500/[0.07] dark:text-red-200">
        <AlertTriangle className="h-4 w-4" />
        {disputes.length} litige{disputes.length > 1 ? 's' : ''} à trancher
      </h2>
      <ul className="divide-y divide-border">
        {disputes.map((b) => (
          <DisputeRow key={b.id} booking={b} />
        ))}
      </ul>
    </section>
  );
}
