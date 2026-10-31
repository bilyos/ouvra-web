'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, ChevronRight, Loader2, Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { adminApi, subscriptionApi } from '@/services/api';
import { useFormatters } from '@/hooks/use-formatters';
import { EmptyState, PageHeader, StatusDot } from '@/components/dashboard/page-parts';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/utils/cn';
import { getApiErrorMessage } from '@/utils/api-error';
import type { SubscriptionPlan } from '@/types';

const STATUS: Record<string, { key: string; tone: 'green' | 'gray' | 'red' }> = {
  ACTIVE: { key: 'statusActive', tone: 'green' },
  EXPIRED: { key: 'statusExpired', tone: 'gray' },
  CANCELLED: { key: 'statusCancelled', tone: 'red' },
};

const input = 'h-11 w-full rounded-lg border border-border bg-card px-3.5 text-[15px] outline-none focus:border-brand-600 focus:ring-[3px] focus:ring-brand-600/15';

type Form = { name: string; price: number; durationDays: number; maxServices: number; boostFactor: number; description: string };

export default function AdminSubscriptionsPage() {
  const t = useTranslations('admin.subscriptions');
  const { formatPrice, formatDate, formatNumber } = useFormatters();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState<Form | null>(null);

  const { data: plans = [], isLoading: plansLoading } = useQuery({ queryKey: ['subscription-plans'], queryFn: () => subscriptionApi.plans() });
  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ['admin-subscriptions', page],
    queryFn: () => adminApi.listSubscriptions({ page, size: 20 }),
    placeholderData: (prev) => prev,
  });

  const save = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminApi.updatePlan>[1] }) => adminApi.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setEditing(null);
    },
  });

  const subs = subsData?.content ?? [];
  const totalPages = subsData?.totalPages ?? 0;
  const sorted = [...plans].sort((a, b) => a.price - b.price);

  const openEdit = (plan: SubscriptionPlan) => {
    save.reset();
    setEditing(plan);
    setForm({ name: plan.name, price: plan.price, durationDays: plan.durationDays, maxServices: plan.maxServices, boostFactor: plan.boostFactor, description: plan.description ?? '' });
  };
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <div className="space-y-10">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <section aria-labelledby="plans-title">
        <h2 id="plans-title" className="mb-4 text-xl font-bold">
          {t('plansTitle')}
        </h2>
        {plansLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ul className={cn('grid gap-4', sorted.length >= 3 ? 'lg:grid-cols-3' : 'sm:grid-cols-2')}>
            {sorted.map((plan) => (
              <li key={plan.id} className="flex flex-col rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-sans text-lg font-bold tracking-normal">{plan.name}</h3>
                    <p className="font-mono text-[12px] text-muted-foreground">{plan.slug}</p>
                  </div>
                  <button type="button" onClick={() => openEdit(plan)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted">
                    <Pencil className="h-3.5 w-3.5" />
                    {t('edit')}
                  </button>
                </div>
                <p className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-display text-3xl font-bold tabular">{formatNumber(plan.price)}</span>
                  <span className="text-sm text-muted-foreground">{plan.price === 0 ? t('forever') : t('perPeriod', { count: plan.durationDays })}</span>
                </p>
                <ul className="mt-4 flex-1 space-y-1.5 text-sm">
                  {[
                    { on: true, l: plan.maxServices === -1 ? t('unlimited') : t('maxServices', { count: plan.maxServices }) },
                    { on: plan.boostFactor > 1, l: t('boost', { factor: plan.boostFactor }) },
                    { on: plan.verifiedBadge, l: t('verifiedBadge') },
                    { on: plan.prioritySupport, l: t('prioritySupport') },
                  ].map((f) => (
                    <li key={f.l} className={cn('flex items-center gap-2', !f.on && 'text-muted-foreground line-through decoration-gray-400/60')}>
                      <Check className={cn('h-4 w-4 shrink-0', f.on ? 'text-brand-700 dark:text-brand-300' : 'opacity-0')} strokeWidth={2.5} />
                      {f.l}
                    </li>
                  ))}
                </ul>
                {plan.description && <p className="mt-4 border-t border-border pt-3 text-[13px] text-muted-foreground">{plan.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="subs-title">
        <h2 id="subs-title" className="mb-4 text-xl font-bold">
          {t('providerSubs')}
        </h2>
        {subsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : subs.length === 0 ? (
          <EmptyState title={t('empty')} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-paper text-left text-[13px] text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-5 py-2.5 font-medium">{t('colPlan')}</th>
                    <th className="px-4 py-2.5 font-medium">{t('colStart')}</th>
                    <th className="px-4 py-2.5 font-medium">{t('colExpiry')}</th>
                    <th className="px-4 py-2.5 font-medium">{t('colRenewal')}</th>
                    <th className="px-4 py-2.5 font-medium">{t('colStatus')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subs.map((s) => {
                    const st = STATUS[s.status];
                    return (
                      <tr key={s.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-5 py-3">
                          <span className="font-semibold">{s.plan.name}</span>
                          <span className="ml-2 tabular text-muted-foreground">{formatPrice(s.plan.price)}</span>
                        </td>
                        <td className="px-4 py-3 tabular text-muted-foreground">{formatDate(s.startsAt)}</td>
                        <td className="px-4 py-3 tabular">{formatDate(s.expiresAt)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.autoRenew ? t('auto') : t('manual')}</td>
                        <td className="px-4 py-3">
                          <StatusDot tone={st?.tone ?? 'gray'}>{st ? t(st.key) : s.status}</StatusDot>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-5 py-3">
                <p className="text-sm text-muted-foreground">{t('pageOf', { page: page + 1, total: totalPages })}</p>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-40" aria-label="Page précédente">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-40" aria-label="Page suivante">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <Dialog open={!!editing} onOpenChange={(o) => !o && !save.isPending && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          {editing && form && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate({ id: editing.id, data: { ...form, name: form.name.trim(), description: form.description.trim() || undefined } });
              }}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle>
                  {t('editPlan')}, {editing.name}
                </DialogTitle>
              </DialogHeader>
              <div>
                <label htmlFor="plan-name" className="mb-1.5 block text-sm font-semibold">
                  {t('nameLabel')}
                </label>
                <input id="plan-name" value={form.name} onChange={(e) => set('name', e.target.value)} className={input} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    { k: 'price', l: t('priceLabel'), step: 500 },
                    { k: 'durationDays', l: t('durationLabel'), step: 1 },
                    { k: 'maxServices', l: t('maxServicesLabel'), step: 1 },
                    { k: 'boostFactor', l: t('boostLabel'), step: 0.1 },
                  ] as const
                ).map((f) => (
                  <div key={f.k}>
                    <label htmlFor={`plan-${f.k}`} className="mb-1.5 block text-sm font-semibold">
                      {f.l}
                    </label>
                    <input id={`plan-${f.k}`} type="number" step={f.step} value={form[f.k]} onChange={(e) => set(f.k, Number(e.target.value))} className={cn(input, 'tabular')} />
                  </div>
                ))}
              </div>
              <div>
                <label htmlFor="plan-desc" className="mb-1.5 block text-sm font-semibold">
                  {t('descriptionLabel')}
                </label>
                <textarea id="plan-desc" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} className="w-full resize-none rounded-lg border border-border bg-card p-3 text-[15px] outline-none focus:border-brand-600 focus:ring-[3px] focus:ring-brand-600/15" />
              </div>
              {save.isError && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                  {getApiErrorMessage(save.error, t('actionError'))}
                </p>
              )}
              <DialogFooter className="gap-2">
                <button type="button" onClick={() => setEditing(null)} disabled={save.isPending} className="h-10 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={save.isPending || !form.name.trim()} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sun-400 px-5 text-sm font-bold text-gray-950 hover:bg-sun-300 disabled:opacity-50">
                  {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('save')}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
