'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { adminApi } from '@/services/api';
import { useFormatters } from '@/hooks/use-formatters';
import { AdminDisputes } from '@/components/bookings/admin-disputes';
import { EmptyState, PageHeader, StatusDot } from '@/components/dashboard/page-parts';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/utils/cn';
import { getApiErrorMessage } from '@/utils/api-error';
import type { BookingItem, BookingStatus, EscrowStatus } from '@/types';

const STATUS: Record<BookingStatus, { key: string; tone: 'green' | 'yellow' | 'red' | 'gray' | 'blue' }> = {
  PENDING: { key: 'statusPending', tone: 'yellow' },
  ACCEPTED: { key: 'statusAccepted', tone: 'blue' },
  IN_PROGRESS: { key: 'statusInProgress', tone: 'blue' },
  COMPLETED: { key: 'statusCompleted', tone: 'green' },
  CANCELLED: { key: 'statusCancelled', tone: 'gray' },
  REJECTED: { key: 'statusRejected', tone: 'gray' },
};
const ESCROW_TONE: Record<EscrowStatus, string> = {
  NONE: 'text-muted-foreground',
  HELD: 'text-brand-700 dark:text-brand-300',
  RELEASED: 'text-foreground',
  REFUNDED: 'text-muted-foreground',
  DISPUTED: 'font-semibold text-red-600 dark:text-red-300',
};
const FILTERS: ('' | BookingStatus)[] = ['', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function AdminBookingsPage() {
  const t = useTranslations('admin.bookings');
  const { formatPrice, formatRelativeTime } = useFormatters();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'' | BookingStatus>('');
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState<BookingItem | null>(null);
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', { status, page }],
    queryFn: () => adminApi.listBookings({ status: status || undefined, page, size: 20 }),
    placeholderData: (prev) => prev,
  });

  const cancel = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminApi.forceCancel(id, reason),
    onSuccess: () => {
      ['admin-bookings', 'admin-disputes', 'admin-stats'].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
      setTarget(null);
      setReason('');
    },
  });

  const bookings = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader title={t('title')} description={t('subtitle', { count: data?.totalElements ?? 0 })} />

      <AdminDisputes />

      <section aria-labelledby="all-bookings" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="all-bookings" className="text-xl font-bold">
            {t('allBookings')}
          </h2>
          <div className="hide-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {FILTERS.map((s) => (
              <button
                key={s || 'all'}
                type="button"
                onClick={() => {
                  setStatus(s);
                  setPage(0);
                }}
                aria-pressed={status === s}
                className={cn('h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors', status === s ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground')}
              >
                {s ? t(STATUS[s].key) : t('all')}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState title={t('empty')} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-paper text-left text-[13px] text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-5 py-2.5 font-medium">{t('colService')}</th>
                    <th className="px-4 py-2.5 font-medium">
                      {t('colClient')}, {t('colProvider').toLowerCase()}
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium">{t('colPrice')}</th>
                    <th className="px-4 py-2.5 font-medium">{t('colPayment')}</th>
                    <th className="px-4 py-2.5 font-medium">{t('colStatus')}</th>
                    <th className="px-4 py-2.5 font-medium">{t('colDate')}</th>
                    <th className="w-12 px-4 py-2.5">
                      <span className="sr-only">{t('colActions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.map((b) => {
                    const s = STATUS[b.status];
                    const escrow = b.escrowStatus ?? 'NONE';
                    const cancellable = b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && b.status !== 'REJECTED';
                    return (
                      <tr key={b.id} className="transition-colors hover:bg-muted/40">
                        <td className="max-w-[240px] px-5 py-3">
                          <p className="truncate font-semibold">{b.title}</p>
                          {b.urgent && <p className="text-[12px] font-semibold text-red-600 dark:text-red-300">{t('urgent')}</p>}
                        </td>
                        <td className="max-w-[220px] px-4 py-3">
                          <p className="truncate">{b.clientName}</p>
                          <p className="truncate text-[13px] text-muted-foreground">{b.providerName ?? '–'}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular">{formatPrice(b.price)}</td>
                        <td className={cn('px-4 py-3 text-[13px]', ESCROW_TONE[escrow])}>{t(`escrow${escrow}`)}</td>
                        <td className="px-4 py-3">
                          <StatusDot tone={s?.tone ?? 'gray'}>{s ? t(s.key) : b.status}</StatusDot>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatRelativeTime(b.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          {cancellable && (
                            <button
                              type="button"
                              onClick={() => {
                                cancel.reset();
                                setTarget(b);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                              aria-label={t('actionsFor', { title: b.title })}
                              title={t('cancel')}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
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

      <Dialog open={!!target} onOpenChange={(o) => !o && !cancel.isPending && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          {target && (
            <>
              <DialogHeader>
                <DialogTitle>{t('cancelTitle')}</DialogTitle>
                <DialogDescription>
                  <span className="font-semibold text-foreground">{target.title}</span>, {target.clientName}, {formatPrice(target.price)}
                </DialogDescription>
              </DialogHeader>
              <p className={cn('rounded-lg px-3 py-2.5 text-sm', target.escrowStatus === 'HELD' || target.escrowStatus === 'DISPUTED' ? 'bg-sun-100 text-sun-900 dark:bg-sun-500/10 dark:text-sun-200' : 'bg-muted text-muted-foreground')}>
                {target.escrowStatus === 'HELD' || target.escrowStatus === 'DISPUTED' ? t('refundNote', { amount: formatPrice(target.price) }) : t('noRefund')}
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('cancelReasonPlaceholder')}
                aria-label={t('cancelReason')}
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-brand-600 focus:ring-[3px] focus:ring-brand-600/15"
              />
              {cancel.isError && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                  {getApiErrorMessage(cancel.error, t('actionError'))}
                </p>
              )}
              <DialogFooter className="gap-2">
                <button type="button" onClick={() => setTarget(null)} disabled={cancel.isPending} className="h-10 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted">
                  {t('back')}
                </button>
                <button
                  type="button"
                  onClick={() => cancel.mutate({ id: target.id, reason: reason.trim() || undefined })}
                  disabled={cancel.isPending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {cancel.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('confirmCancel')}
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
