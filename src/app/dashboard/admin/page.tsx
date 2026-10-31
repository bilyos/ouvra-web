'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { adminApi } from '@/services/api';
import { useFormatters } from '@/hooks/use-formatters';
import { EmptyState, Figures, PageHeader, Section } from '@/components/dashboard/page-parts';
import { cn } from '@/utils/cn';

export default function AdminDashboardPage() {
  const t = useTranslations('admin.dashboard');
  const locale = useLocale();
  const { formatPrice, formatNumber } = useFormatters();
  const { data: stats, isLoading, isError } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminApi.getStats(), refetchInterval: 60_000 });
  const { data: disputes } = useQuery({ queryKey: ['admin-disputes'], queryFn: () => adminApi.disputes() });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !stats) {
    return <EmptyState title={t('loadError')} description="Vérifiez que l’API est démarrée, puis rechargez la page." />;
  }

  const disputeCount = disputes?.totalElements ?? 0;
  const todo = [
    { count: disputeCount, label: t('disputesOpen', { count: disputeCount }), hint: t('disputesHint'), href: '/dashboard/admin/bookings', urgent: disputeCount > 0 },
    { count: stats.pendingBookings, label: t('pendingOpen', { count: stats.pendingBookings }), hint: t('pendingHint'), href: '/dashboard/admin/bookings', urgent: false },
    { count: stats.suspendedUsers, label: t('suspendedOpen', { count: stats.suspendedUsers }), hint: t('suspendedHint'), href: '/dashboard/admin/users', urgent: false },
  ];

  const statuses = [
    { name: t('statusPending'), value: stats.pendingBookings, cls: 'bg-sun-400' },
    { name: t('statusAccepted'), value: stats.acceptedBookings, cls: 'bg-brand-400' },
    { name: t('statusInProgress'), value: stats.inProgressBookings, cls: 'bg-brand-600' },
    { name: t('statusCompleted'), value: stats.completedBookings, cls: 'bg-brand-800 dark:bg-brand-200' },
    { name: t('statusCancelled'), value: stats.cancelledBookings, cls: 'bg-gray-400 dark:bg-gray-600' },
  ];
  const statusTotal = statuses.reduce((s, x) => s + x.value, 0);

  const months = stats.monthlyRevenue.slice(0, 12).reverse();
  const maxMonth = Math.max(1, ...months.map((m) => m.revenue));
  const topMax = stats.topCategories[0]?.bookingCount ?? 1;

  return (
    <div className="space-y-8">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <Figures
        items={[
          { label: t('usersFig'), value: formatNumber(stats.totalUsers) },
          { label: t('bookingsFig'), value: formatNumber(stats.totalBookings) },
          { label: t('commissionFig'), value: formatPrice(stats.totalCommission) },
          { label: t('subsFig'), value: formatNumber(stats.activeSubscriptions) },
        ]}
      />

      <Section title={t('toDo')} bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {todo.map((item) => (
            <li key={item.hint}>
              <Link href={item.href} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50">
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', item.urgent ? 'bg-red-500' : item.count > 0 ? 'bg-sun-500' : 'bg-gray-300 dark:bg-gray-600')} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className={cn('block font-semibold', item.count === 0 && 'font-medium text-muted-foreground')}>{item.label}</span>
                  <span className="block text-[13px] text-muted-foreground">{item.hint}</span>
                </span>
                {item.count > 0 && <span className="hidden text-sm font-semibold text-brand-700 sm:inline dark:text-brand-300">{t('open')}</span>}
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Section title={t('monthlyRevenue')} description={t('monthlyRevenueSub')}>
          {months.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">{t('noRevenueData')}</p>
          ) : (
            <>
              <ol className="flex h-56 items-end gap-2 sm:gap-3">
                {months.map((m) => (
                  <li key={m.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${m.month} : ${formatPrice(m.revenue)}, commission ${formatPrice(m.commission)}`}>
                    <span className="relative w-full overflow-hidden rounded-t-md bg-brand-200 dark:bg-brand-700" style={{ height: `${Math.max(3, (m.revenue / maxMonth) * 100)}%` }}>
                      <span className="absolute inset-x-0 bottom-0 bg-brand-800 dark:bg-brand-300" style={{ height: m.revenue > 0 ? `${(m.commission / m.revenue) * 100}%` : 0 }} />
                    </span>
                    <span className="text-xs capitalize text-muted-foreground">{new Date(`${m.month}-01T12:00:00`).toLocaleDateString(locale, { month: 'short' }).replace('.', '')}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-brand-200 dark:bg-brand-700" />
                  {t('revenueLabel')}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-brand-800 dark:bg-brand-300" />
                  {t('commissionLabel')}
                </span>
                <span className="ml-auto tabular">
                  {formatPrice(stats.totalRevenue)}, {stats.completedPayments} paiements
                </span>
              </div>
            </>
          )}
        </Section>

        <Section title={t('bookingsChart')} description={`${formatNumber(statusTotal)} au total`}>
          {statusTotal === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">{t('noBookings')}</p>
          ) : (
            <>
              <div className="flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                {statuses.map((s) => s.value > 0 && <span key={s.name} className={s.cls} style={{ width: `${(s.value / statusTotal) * 100}%` }} />)}
              </div>
              <dl className="mt-5 space-y-2.5 text-sm">
                {statuses.map((s) => (
                  <div key={s.name} className="flex items-center gap-2.5">
                    <span className={cn('h-2.5 w-2.5 rounded-sm', s.cls)} aria-hidden="true" />
                    <dt className="flex-1 text-muted-foreground">{s.name}</dt>
                    <dd className="font-semibold tabular">{formatNumber(s.value)}</dd>
                    <dd className="w-12 text-right text-[13px] tabular text-muted-foreground">{Math.round((s.value / statusTotal) * 100)} %</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title={t('topCategories')}>
          {stats.topCategories.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t('noData')}</p>
          ) : (
            <ol className="space-y-3.5">
              {stats.topCategories.slice(0, 8).map((c, i) => (
                <li key={c.categoryId}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium">
                      <span className="mr-2 tabular text-muted-foreground">{i + 1}</span>
                      {c.label}
                    </span>
                    <span className="shrink-0 tabular text-muted-foreground">{formatNumber(c.bookingCount)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={cn('h-full rounded-full', i === 0 ? 'bg-sun-400' : 'bg-brand-700 dark:bg-brand-400')} style={{ width: `${(c.bookingCount / topMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Section>

        <Section title={t('usersFig').charAt(0).toUpperCase() + t('usersFig').slice(1)}>
          <dl className="divide-y divide-border text-sm">
            {[
              { k: 'Clients', v: stats.totalClients },
              { k: 'Prestataires', v: stats.totalProviders },
              { k: 'Administrateurs', v: stats.totalAdmins },
              { k: 'Suspendus', v: stats.suspendedUsers },
            ].map((r) => (
              <div key={r.k} className="flex justify-between py-3 first:pt-0 last:pb-0">
                <dt className="text-muted-foreground">{r.k}</dt>
                <dd className="font-semibold tabular">{formatNumber(r.v)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('providersShare')}</span>
              <span className="font-semibold tabular">{formatPrice(stats.totalProviderPayouts)}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-muted-foreground">{t('commissionShare')}</span>
              <span className="font-semibold tabular">{formatPrice(stats.totalCommission)}</span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
