'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { adminApi } from '@/services/api';
import { useFormatters } from '@/hooks/use-formatters';
import { EmptyState, Figures, PageHeader, StatusDot } from '@/components/dashboard/page-parts';
import { cn } from '@/utils/cn';

/** Orange Money et MTN MoMo sont des noms de marque : identiques dans les deux langues. */
const METHOD: Record<string, { label: string; badge: string; cls: string }> = {
  ORANGE_MONEY: { label: 'Orange Money', badge: 'OM', cls: 'bg-[#ff7900] text-white' },
  MTN_MOMO: { label: 'MTN MoMo', badge: 'MTN', cls: 'bg-[#ffcc00] text-gray-950' },
};

const STATUS: Record<string, { key: string; tone: 'green' | 'yellow' | 'red' | 'gray' | 'blue' }> = {
  COMPLETED: { key: 'statusCompleted', tone: 'green' },
  PENDING: { key: 'statusPending', tone: 'yellow' },
  PROCESSING: { key: 'statusProcessing', tone: 'blue' },
  FAILED: { key: 'statusFailed', tone: 'red' },
  REFUNDED: { key: 'statusRefunded', tone: 'gray' },
};
const FILTERS = [
  { v: '', k: 'allStatuses' },
  { v: 'COMPLETED', k: 'filterCompleted' },
  { v: 'PENDING', k: 'filterPending' },
  { v: 'PROCESSING', k: 'filterProcessing' },
  { v: 'FAILED', k: 'filterFailed' },
  { v: 'REFUNDED', k: 'filterRefunded' },
];

export default function AdminPaymentsPage() {
  const t = useTranslations('admin.payments');
  const { formatPrice, formatDateTime } = useFormatters();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);

  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminApi.getStats() });
  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', { status, page }],
    queryFn: () => adminApi.listPayments({ status: status || undefined, page, size: 20 }),
    placeholderData: (prev) => prev,
  });

  const payments = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const share = stats && stats.totalRevenue > 0 ? (stats.totalCommission / stats.totalRevenue) * 100 : 0;

  return (
    <div className="space-y-8">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <Figures
        items={[
          { label: t('totalRevenue'), value: stats ? formatPrice(stats.totalRevenue) : '–' },
          { label: t('commission'), value: stats ? formatPrice(stats.totalCommission) : '–' },
          { label: t('providerPayouts'), value: stats ? formatPrice(stats.totalProviderPayouts) : '–' },
          { label: t('completedPayments'), value: stats ? stats.completedPayments : '–' },
        ]}
      />

      {stats && stats.totalRevenue > 0 && (
        <div>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <span className="bg-sun-400" style={{ width: `${share}%` }} />
            <span className="bg-brand-700 dark:bg-brand-400" style={{ width: `${100 - share}%` }} />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-sun-400" />
              {t('commissionLine')} <strong className="font-semibold text-foreground tabular">{formatPrice(stats.totalCommission)}</strong>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-brand-700 dark:bg-brand-400" />
              {t('providersLine')} <strong className="font-semibold text-foreground tabular">{formatPrice(stats.totalProviderPayouts)}</strong>
            </span>
          </div>
        </div>
      )}

      <section className="space-y-4">
        <div className="hide-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <button
              key={f.v || 'all'}
              type="button"
              onClick={() => {
                setStatus(f.v);
                setPage(0);
              }}
              aria-pressed={status === f.v}
              className={cn('h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors', status === f.v ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground')}
            >
              {t(f.k)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : payments.length === 0 ? (
          <EmptyState title={t('empty')} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-paper text-left text-[13px] text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-5 py-2.5 font-medium">{t('colMethod')}</th>
                    <th className="px-4 py-2.5 font-medium">{t('colRef')}</th>
                    <th className="px-4 py-2.5 text-right font-medium">{t('colAmount')}</th>
                    <th className="px-4 py-2.5 text-right font-medium">{t('colCommission')}</th>
                    <th className="px-4 py-2.5 text-right font-medium">{t('colProvider')}</th>
                    <th className="px-4 py-2.5 font-medium">{t('colStatus')}</th>
                    <th className="px-4 py-2.5 font-medium">{t('colDate')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((p) => {
                    const m = METHOD[p.method];
                    const s = STATUS[p.status];
                    return (
                      <tr key={p.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-2.5">
                            <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[9px] font-black', m?.cls ?? 'bg-gray-900 text-white dark:bg-white dark:text-gray-950')}>{m?.badge ?? 'CB'}</span>
                            <span className="min-w-0">
                              <span className="block">{m?.label ?? (p.method === 'CARD' ? t('methodCard') : p.method)}</span>
                              {p.phoneNumber && <span className="block text-[12px] tabular text-muted-foreground">{p.phoneNumber}</span>}
                            </span>
                          </span>
                        </td>
                        <td className="max-w-[160px] truncate px-4 py-3 font-mono text-[12px] text-muted-foreground" title={p.transactionRef ?? p.id}>
                          {p.transactionRef || p.id.substring(0, 8)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular">{formatPrice(p.amount)}</td>
                        <td className="px-4 py-3 text-right tabular">{formatPrice(p.commissionAmount)}</td>
                        <td className="px-4 py-3 text-right tabular text-muted-foreground">{formatPrice(p.providerAmount)}</td>
                        <td className="px-4 py-3">
                          <StatusDot tone={s?.tone ?? 'gray'}>{s ? t(s.key) : p.status}</StatusDot>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular text-muted-foreground">{formatDateTime(p.paidAt ?? p.createdAt)}</td>
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
    </div>
  );
}
