'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Minus } from 'lucide-react';
import { subscriptionApi } from '@/services/api/subscription';
import { walletApi } from '@/services/api/wallet';
import { PageHeader } from '@/components/dashboard/page-parts';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/utils/cn';
import { formatNumber, formatPrice } from '@/utils/format';
import { getApiErrorMessage } from '@/utils/api-error';
import type { SubscriptionPlan } from '@/types';

function features(plan: SubscriptionPlan) {
  return [
    { label: plan.maxServices === -1 ? 'Services illimités' : `${plan.maxServices} service${plan.maxServices > 1 ? 's' : ''} en ligne`, on: true },
    { label: plan.boostFactor > 1 ? `Remonté ×${plan.boostFactor} dans la recherche` : 'Classement standard dans la recherche', on: plan.boostFactor > 1 },
    { label: 'Badge vérifié sur le profil', on: plan.verifiedBadge },
    { label: 'Statistiques détaillées', on: plan.statsEnabled },
    { label: 'Support prioritaire', on: plan.prioritySupport },
  ];
}

const FAQ = [
  { q: 'Comment je paie ?', a: 'Le montant est pris sur le solde de votre portefeuille Ouvra, alimenté par vos prestations.' },
  { q: 'Je peux changer de formule ?', a: 'Oui, à tout moment. La nouvelle formule remplace l’ancienne dès le paiement.' },
  { q: 'Et à la fin du mois ?', a: 'Sans renouvellement, votre profil repasse en formule gratuite. Vos avis et votre historique restent.' },
];

export default function SubscriptionPage() {
  const queryClient = useQueryClient();
  const [now] = useState(() => Date.now());
  const { data: plans = [], isLoading } = useQuery({ queryKey: ['subscription-plans'], queryFn: subscriptionApi.plans });
  const { data: current } = useQuery({ queryKey: ['subscription', 'mine'], queryFn: subscriptionApi.mine });
  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: walletApi.get });

  const subscribe = useMutation({
    mutationFn: subscriptionApi.subscribe,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast({ title: `Formule ${data.plan.name} activée`, description: 'Votre profil en profite dès maintenant.', variant: 'success' });
    },
    onError: (err: unknown) => {
      toast({ title: 'Souscription impossible', description: getApiErrorMessage(err, 'Vérifiez le solde de votre portefeuille.'), variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const balance = wallet?.balance ?? 0;
  const sorted = [...plans].sort((a, b) => a.price - b.price);
  const currentSlug = current?.active ? current.plan.slug : 'free';
  const daysLeft = current?.active ? Math.max(0, Math.ceil((new Date(current.expiresAt).getTime() - now) / 86_400_000)) : null;

  return (
    <div className="space-y-8">
      <PageHeader title="Formule" description="Remontez dans les résultats de recherche et rassurez les clients avec le badge vérifié." />

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Formule actuelle</p>
          <p className="mt-0.5 text-lg font-semibold">
            {current?.active ? current.plan.name : 'Gratuite'}
            {daysLeft != null && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                jusqu’au {new Date(current!.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}, {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-sm text-muted-foreground">Solde du portefeuille</p>
          <p className="mt-0.5 text-lg font-semibold tabular">
            {formatPrice(balance)}
            <Link href="/dashboard/provider/wallet" className="ml-3 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
              Voir
            </Link>
          </p>
        </div>
      </div>

      <ul className={cn('grid gap-4', sorted.length >= 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2')}>
        {sorted.map((plan) => {
          const isCurrent = plan.slug === currentSlug;
          const isFree = plan.price === 0;
          const featured = plan.slug === 'pro';
          const missing = Math.max(0, plan.price - balance);
          const pending = subscribe.isPending && subscribe.variables === plan.slug;
          return (
            <li key={plan.id} className={cn('flex flex-col rounded-xl border bg-card p-6', featured ? 'border-brand-800 ring-1 ring-brand-800 dark:border-brand-300 dark:ring-brand-300' : 'border-border')}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-sans text-lg font-bold tracking-normal">{plan.name}</h2>
                {isCurrent ? (
                  <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[12px] font-semibold text-brand-800 dark:bg-brand-900 dark:text-brand-200">Votre formule</span>
                ) : plan.badge ? (
                  <span className="rounded-full bg-sun-100 px-2.5 py-0.5 text-[12px] font-semibold text-sun-800 dark:bg-sun-500/15 dark:text-sun-300">{plan.badge}</span>
                ) : null}
              </div>
              <p className="mt-1 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold tabular">{formatNumber(plan.price)}</span>
                <span className="text-sm text-muted-foreground">{isFree ? 'FCFA, pour toujours' : 'FCFA par mois'}</span>
              </p>

              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {features(plan).map((f) => (
                  <li key={f.label} className={cn('flex items-start gap-2.5', !f.on && 'text-muted-foreground')}>
                    {f.on ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" strokeWidth={2.5} /> : <Minus className="mt-0.5 h-4 w-4 shrink-0 opacity-50" />}
                    {f.label}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <p className="flex h-11 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">Formule en cours</p>
                ) : isFree ? (
                  <p className="flex h-11 items-center justify-center text-center text-[13px] text-muted-foreground">Vous y revenez à la fin d’une formule payante.</p>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => subscribe.mutate(plan.slug)}
                      disabled={subscribe.isPending || missing > 0}
                      className={cn(
                        'flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[15px] font-bold transition-colors disabled:opacity-50',
                        featured ? 'bg-sun-400 text-gray-950 hover:bg-sun-300' : 'bg-brand-800 text-white hover:bg-brand-700 dark:bg-brand-300 dark:text-brand-950 dark:hover:bg-brand-200'
                      )}
                    >
                      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Passer à {plan.name}
                    </button>
                    {missing > 0 && <p className="mt-2 text-center text-[13px] text-muted-foreground">Il manque {formatPrice(missing)} sur votre portefeuille.</p>}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="faq-title" className="max-w-3xl">
        <h2 id="faq-title" className="mb-4 text-xl font-bold">
          Questions fréquentes
        </h2>
        <dl className="divide-y divide-border border-y border-border">
          {FAQ.map((f) => (
            <div key={f.q} className="grid gap-1 py-4 sm:grid-cols-[220px_1fr] sm:gap-6">
              <dt className="font-semibold">{f.q}</dt>
              <dd className="text-[15px] text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
