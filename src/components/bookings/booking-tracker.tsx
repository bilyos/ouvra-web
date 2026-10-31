'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { BookingItem } from '@/types';

type StepState = 'done' | 'current' | 'todo' | 'failed';
interface Step {
  key: string;
  label: string;
  at?: string | null;
  state: StepState;
  /** Ce qui se passe maintenant, vu par le client */
  hint?: string;
}

const time = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

/** Les étapes d'une demande, de l'envoi à la fin du travail. */
export function trackingSteps(b: BookingItem): Step[] {
  const searching = b.urgent && !b.providerId;
  const done = b.status === 'COMPLETED';
  const paid = b.escrowStatus !== 'NONE' || done;
  const accepted = !!b.acceptedAt || ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status);
  const viewed = !!b.viewedAt || accepted || b.status === 'REJECTED';
  const onTheWay = !!b.onTheWayAt || b.status === 'IN_PROGRESS' || done;
  const who = b.providerName?.split(' ')[0] ?? 'Le prestataire';
  const scheduled = new Date(b.scheduledAt).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

  const raw: Omit<Step, 'state'>[] = [
    { key: 'sent', label: 'Demande envoyée', at: b.createdAt },
    {
      key: 'viewed',
      label: searching ? 'Recherche d’un prestataire' : 'Vue par le prestataire',
      at: b.viewedAt,
      hint: searching ? 'Les prestataires disponibles près de vous sont prévenus.' : `${who} n’a pas encore ouvert votre demande.`,
    },
    { key: 'accepted', label: 'Acceptée', at: b.acceptedAt, hint: `${who} a vu votre demande et doit l’accepter.` },
    { key: 'paid', label: 'Paiement bloqué', hint: 'Payez pour confirmer : l’argent reste bloqué jusqu’à la fin du travail.' },
    { key: 'onTheWay', label: 'En route', at: b.onTheWayAt, hint: `${who} vient le ${scheduled}. Vous serez prévenu à son départ.` },
    {
      key: 'done',
      label: 'Terminée',
      at: b.completedAt,
      hint:
        b.escrowStatus === 'DISPUTED'
          ? 'Problème signalé : notre équipe tranche, l’argent reste bloqué.'
          : b.status === 'IN_PROGRESS'
            ? `Travail en cours. Quand tout est bon, donnez votre code à ${who}.`
            : `${who} est en route. À la fin, donnez-lui votre code.`,
    },
  ];
  const reached = [true, viewed, accepted, paid, onTheWay, done];

  // Refus ou annulation : la frise s'arrête sur une étape en échec
  if (b.status === 'REJECTED' || b.status === 'CANCELLED') {
    const stopAt = reached.findIndex((r) => !r);
    const steps: Step[] = raw.slice(0, stopAt === -1 ? raw.length : stopAt).map((s) => ({ ...s, state: 'done' as const }));
    steps.push({
      key: 'end',
      label: b.status === 'REJECTED' ? 'Refusée par le prestataire' : 'Annulée',
      at: null,
      state: 'failed',
      hint: [b.cancelReason, b.escrowStatus === 'REFUNDED' ? 'Vous avez été remboursé.' : null].filter(Boolean).join(' ') || undefined,
    });
    return steps;
  }

  let currentFound = false;
  return raw.map((s, i) => {
    if (reached[i]) return { ...s, state: 'done' };
    if (!currentFound) {
      currentFound = true;
      return { ...s, state: 'current' };
    }
    return { ...s, state: 'todo' };
  });
}

function Dot({ state }: { state: StepState }) {
  return (
    <span
      className={cn(
        'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
        state === 'done' && 'bg-brand-700 text-white dark:bg-brand-300 dark:text-brand-950',
        state === 'current' && 'bg-sun-400 text-gray-950 ring-4 ring-sun-400/25',
        state === 'todo' && 'border-2 border-gray-300 bg-card dark:border-gray-700',
        state === 'failed' && 'bg-red-600 text-white'
      )}
      aria-hidden="true"
    >
      {state === 'done' && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      {state === 'failed' && <X className="h-3.5 w-3.5" strokeWidth={3} />}
      {state === 'current' && <span className="h-2 w-2 animate-pulse rounded-full bg-gray-950 motion-reduce:animate-none" />}
    </span>
  );
}

/** Frise verticale détaillée, pour la page de suivi. */
export function BookingTracker({ booking, action }: { booking: BookingItem; action?: React.ReactNode }) {
  const steps = trackingSteps(booking);
  return (
    <ol className="relative" aria-label="Suivi de la demande">
      {steps.map((s, i) => (
        <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0" aria-current={s.state === 'current' ? 'step' : undefined}>
          {i < steps.length - 1 && (
            <span className={cn('absolute left-[11px] top-6 h-[calc(100%-24px)] w-0.5', s.state === 'done' ? 'bg-brand-700 dark:bg-brand-300' : 'bg-gray-200 dark:bg-gray-800')} aria-hidden="true" />
          )}
          <Dot state={s.state} />
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className={cn('font-semibold', s.state === 'todo' && 'font-medium text-muted-foreground', s.state === 'failed' && 'text-red-700 dark:text-red-300')}>{s.label}</p>
              {s.at && s.state === 'done' && <p className="text-[13px] tabular text-muted-foreground">{time(s.at)}</p>}
            </div>
            {(s.state === 'current' || s.state === 'failed') && s.hint && <p className="mt-1 text-[14px] leading-snug text-muted-foreground">{s.hint}</p>}
            {s.state === 'current' && action && <div className="mt-3">{action}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Version compacte sur une ligne, pour les listes. */
export function BookingTrackerCompact({ booking }: { booking: BookingItem }) {
  const steps = trackingSteps(booking);
  const current = steps.find((s) => s.state === 'current' || s.state === 'failed');
  return (
    <div>
      <div className="flex items-center gap-1" aria-hidden="true">
        {steps.map((s) => (
          <span
            key={s.key}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              s.state === 'done' && 'bg-brand-700 dark:bg-brand-300',
              s.state === 'current' && 'bg-sun-400',
              s.state === 'todo' && 'bg-gray-200 dark:bg-gray-800',
              s.state === 'failed' && 'bg-red-600'
            )}
          />
        ))}
      </div>
      <p className="mt-2 text-[13px] text-muted-foreground">
        <span className="font-semibold text-foreground">{current ? current.label : 'Terminée'}</span>
        {current?.state === 'current' && current.hint ? `. ${current.hint}` : ''}
      </p>
    </div>
  );
}
