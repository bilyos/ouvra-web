'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Check, Circle, Clock, Loader2, Star, Zap } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { bookingApi, providerApi, walletApi } from '@/services/api';
import { useDayPeriod } from '@/hooks/use-day-period';
import { formatPrice, formatRating } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { BookingItem } from '@/types';

const COMMISSION = 0.1;

function Switch({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange: () => void; label: string; hint: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-4 rounded-lg px-1 py-2 text-left disabled:opacity-60"
    >
      <span>
        <span className="block text-[15px] font-semibold">{label}</span>
        <span className="block text-[13px] text-muted-foreground">{hint}</span>
      </span>
      <span className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors', checked ? 'bg-brand-700 dark:bg-brand-400' : 'bg-gray-300 dark:bg-gray-700')}>
        <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left]', checked ? 'left-6' : 'left-1')} />
      </span>
    </button>
  );
}

function when(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function ProviderDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const period = useDayPeriod();
  const greeting = period === 'evening' ? 'Bonsoir' : period === 'afternoon' ? 'Bon après-midi' : 'Bonjour';

  const { data: profile } = useQuery({ queryKey: ['provider-profile'], queryFn: providerApi.myProfile });
  const { data: stats } = useQuery({ queryKey: ['provider-stats'], queryFn: providerApi.stats });
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({ queryKey: ['bookings', 'received'], queryFn: bookingApi.received });
  const { data: urgent = [] } = useQuery({ queryKey: ['bookings', 'urgent'], queryFn: bookingApi.urgent, refetchInterval: 15000 });
  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: walletApi.get });
  const { data: transactions = [] } = useQuery({ queryKey: ['wallet', 'transactions'], queryFn: walletApi.transactions });

  const statusMutation = useMutation({
    mutationFn: providerApi.updateStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-profile'] }),
  });
  const decide = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACCEPTED' | 'REJECTED' }) => bookingApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });

  // Ce qui demande une action, du plus urgent au moins urgent
  const todo = useMemo(() => {
    const pending = bookings.filter((b) => b.status === 'PENDING' && !b.urgent);
    const toStart = bookings.filter((b) => b.status === 'ACCEPTED' && b.escrowStatus === 'HELD');
    const toFinish = bookings.filter((b) => b.status === 'IN_PROGRESS' && b.escrowStatus === 'HELD');
    const waitingPayment = bookings.filter((b) => (b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS') && b.escrowStatus === 'NONE');
    return { pending, toStart, toFinish, waitingPayment };
  }, [bookings]);

  const held = bookings
    .filter((b) => b.escrowStatus === 'HELD' || b.escrowStatus === 'DISPUTED')
    .reduce((sum, b) => sum + Math.round(b.price * (1 - COMMISSION)), 0);
  const now = new Date();
  const earnedThisMonth = transactions
    .filter((tx) => {
      const d = new Date(tx.createdAt);
      return tx.type === 'CREDIT' && tx.status === 'COMPLETED' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  const checklist = profile
    ? [
        { done: (profile.portfolio?.length ?? 0) >= 3, label: `Au moins 3 photos de chantier (${profile.portfolio?.length ?? 0}/3)` },
        { done: (profile.description?.length ?? 0) >= 120, label: 'Une présentation d’au moins 120 caractères' },
        { done: !!profile.availability, label: 'Vos jours et horaires de travail' },
        { done: !!user?.avatarUrl, label: 'Une photo de vous' },
      ]
    : [];
  const doneCount = checklist.filter((c) => c.done).length;
  const actionCount = todo.pending.length + todo.toStart.length + todo.toFinish.length + urgent.length;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">
            {greeting}, {user?.firstName}
          </h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            {actionCount > 0 ? `${actionCount} chose${actionCount > 1 ? 's' : ''} à traiter aujourd’hui.` : 'Rien en attente pour le moment.'}
          </p>
        </div>
        {profile && (
          <Link href={`/providers/${profile.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 dark:text-brand-300">
            Voir mon profil public
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* À faire */}
        <section aria-labelledby="todo-title" className="rounded-xl border border-border bg-card">
          <h2 id="todo-title" className="border-b border-border px-5 py-4 font-sans text-base font-semibold tracking-normal">
            À faire
          </h2>

          {bookingsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : actionCount === 0 && todo.waitingPayment.length === 0 ? (
            <p className="px-5 py-10 text-center text-[15px] text-muted-foreground">Les nouvelles demandes de vos clients apparaîtront ici.</p>
          ) : (
            <ul className="divide-y divide-border">
              {urgent.length > 0 && (
                <li className="flex items-center justify-between gap-4 bg-red-50 px-5 py-4 dark:bg-red-500/[0.07]">
                  <span className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-red-600 dark:text-red-300" />
                    <span>
                      <span className="block font-semibold">
                        {urgent.length} demande{urgent.length > 1 ? 's' : ''} urgente{urgent.length > 1 ? 's' : ''} près de vous
                      </span>
                      <span className="block text-[13px] text-muted-foreground">Le premier prestataire qui accepte obtient le travail.</span>
                    </span>
                  </span>
                  <Link href="/dashboard/provider/bookings" className="shrink-0 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-red-700">
                    Voir
                  </Link>
                </li>
              )}

              {todo.pending.map((b: BookingItem) => (
                <li key={b.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{b.title}</span>
                    <span className="block text-[13px] text-muted-foreground">
                      Nouvelle demande de {b.clientName}, {when(b.scheduledAt)}
                      {b.address ? `, ${b.address}` : ''}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="mr-1 font-semibold tabular">{formatPrice(b.price)}</span>
                    <button
                      type="button"
                      onClick={() => decide.mutate({ id: b.id, status: 'ACCEPTED' })}
                      disabled={decide.isPending}
                      className="h-9 rounded-lg bg-brand-800 px-3.5 text-sm font-semibold text-white hover:bg-brand-900 disabled:opacity-60 dark:bg-brand-300 dark:text-brand-950"
                    >
                      Accepter
                    </button>
                    <button
                      type="button"
                      onClick={() => decide.mutate({ id: b.id, status: 'REJECTED' })}
                      disabled={decide.isPending}
                      className="h-9 rounded-lg border border-border px-3.5 text-sm font-semibold hover:bg-muted disabled:opacity-60"
                    >
                      Refuser
                    </button>
                  </span>
                </li>
              ))}

              {todo.toStart.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{b.title}</span>
                    <span className="block text-[13px] text-muted-foreground">Payé par {b.clientName}. Vous pouvez intervenir, {when(b.scheduledAt)}.</span>
                  </span>
                  <Link href="/dashboard/provider/bookings" className="shrink-0 text-sm font-semibold text-brand-700 underline underline-offset-4 dark:text-brand-300">
                    Démarrer
                  </Link>
                </li>
              ))}

              {todo.toFinish.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{b.title}</span>
                    <span className="block text-[13px] text-muted-foreground">
                      En cours. Demandez son code à {b.clientName} pour recevoir {formatPrice(Math.round(b.price * (1 - COMMISSION)))}.
                    </span>
                  </span>
                  <Link href="/dashboard/provider/bookings" className="shrink-0 rounded-lg bg-sun-400 px-3.5 py-2 text-sm font-bold text-gray-950 hover:bg-sun-300">
                    Saisir le code
                  </Link>
                </li>
              ))}

              {todo.waitingPayment.map((b) => (
                <li key={b.id} className="flex items-center gap-3 px-5 py-4 text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 text-[14px]">
                    <span className="font-medium text-foreground">{b.title}</span> : en attente du paiement de {b.clientName}.
                  </span>
                </li>
              ))}
            </ul>
          )}
          {decide.isError && <p className="px-5 pb-4 text-sm text-red-700 dark:text-red-300">L’action n’a pas abouti. Réessayez.</p>}
        </section>

        {/* Disponibilité */}
        <section aria-labelledby="status-title" className="rounded-xl border border-border bg-card p-5">
          <h2 id="status-title" className="font-sans text-base font-semibold tracking-normal">
            Votre statut
          </h2>
          <div className="mt-3 divide-y divide-border">
            <Switch
              checked={!!profile?.online}
              onChange={() => statusMutation.mutate({ online: !profile?.online })}
              disabled={!profile || statusMutation.isPending}
              label="En ligne"
              hint="Les clients voient que vous répondez maintenant."
            />
            <Switch
              checked={!!profile?.available}
              onChange={() => statusMutation.mutate({ available: !profile?.available })}
              disabled={!profile || statusMutation.isPending}
              label="Disponible"
              hint="Vous recevez les nouvelles demandes et les urgences."
            />
          </div>
        </section>
      </div>

      {/* Argent */}
      <section aria-labelledby="money-title">
        <div className="mb-4 flex items-end justify-between">
          <h2 id="money-title" className="text-2xl font-bold">
            Votre argent
          </h2>
          <Link href="/dashboard/provider/wallet" className="text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 dark:text-brand-300">
            Retirer vers Mobile Money
          </Link>
        </div>
        <dl className="grid divide-y divide-border rounded-xl border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex flex-col-reverse px-6 py-5">
            <dt className="mt-1 text-sm text-muted-foreground">Disponible sur votre portefeuille</dt>
            <dd className="font-display text-3xl font-bold tabular">{formatPrice(wallet?.balance ?? 0)}</dd>
          </div>
          <div className="flex flex-col-reverse px-6 py-5">
            <dt className="mt-1 text-sm text-muted-foreground">Bloqué en attendant la fin des travaux</dt>
            <dd className="font-display text-3xl font-bold tabular text-foreground/70">{formatPrice(held)}</dd>
          </div>
          <div className="flex flex-col-reverse px-6 py-5">
            <dt className="mt-1 text-sm text-muted-foreground">Gagné ce mois-ci</dt>
            <dd className="font-display text-3xl font-bold tabular">{formatPrice(earnedThisMonth)}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Réputation */}
        <section aria-labelledby="rep-title" className="rounded-xl border border-border bg-card p-5">
          <h2 id="rep-title" className="font-sans text-base font-semibold tracking-normal">
            Votre réputation
          </h2>
          <dl className="mt-4 grid grid-cols-3 gap-4">
            <div className="flex flex-col-reverse">
              <dt className="text-[13px] text-muted-foreground">note moyenne</dt>
              <dd className="flex items-center gap-1.5 font-display text-2xl font-bold tabular">
                <Star className="h-5 w-5 fill-sun-400 text-sun-400" />
                {stats ? formatRating(stats.ratingAvg) : '–'}
              </dd>
            </div>
            <div className="flex flex-col-reverse">
              <dt className="text-[13px] text-muted-foreground">avis</dt>
              <dd className="font-display text-2xl font-bold tabular">{stats?.reviewCount ?? '–'}</dd>
            </div>
            <div className="flex flex-col-reverse">
              <dt className="text-[13px] text-muted-foreground">clients qui vous ont écrit</dt>
              <dd className="font-display text-2xl font-bold tabular">{stats?.contacts ?? '–'}</dd>
            </div>
          </dl>
          <Link href="/dashboard/provider/reviews" className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
            Lire les avis
          </Link>
        </section>

        {/* Profil */}
        {checklist.length > 0 && (
          <section aria-labelledby="profile-title" className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <h2 id="profile-title" className="font-sans text-base font-semibold tracking-normal">
                Un profil complet reçoit plus de demandes
              </h2>
              <span className="text-sm font-semibold tabular text-muted-foreground">
                {doneCount}/{checklist.length}
              </span>
            </div>
            <span className="mt-3 block h-1.5 rounded-full bg-muted" aria-hidden="true">
              <span className="block h-full rounded-full bg-sun-400" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
            </span>
            <ul className="mt-4 space-y-2.5">
              {checklist.map((c) => (
                <li key={c.label} className={cn('flex items-center gap-2.5 text-[15px]', c.done && 'text-muted-foreground line-through decoration-gray-300')}>
                  {c.done ? (
                    <Check className="h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" strokeWidth={3} />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-gray-400" />
                  )}
                  {c.label}
                </li>
              ))}
            </ul>
            {doneCount < checklist.length && (
              <Link href="/dashboard/provider/services" className="mt-4 inline-block text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 dark:text-brand-300">
                Compléter mon profil
              </Link>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
