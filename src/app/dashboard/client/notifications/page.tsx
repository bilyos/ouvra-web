'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CalendarCheck, FileText, Heart, Loader2, Megaphone, MessageSquare, Star, Trash2, Wallet, Zap } from 'lucide-react';
import { notificationApi } from '@/services/api';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader, EmptyState } from '@/components/dashboard/page-parts';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/format';
import type { NotificationItem } from '@/types';

const PAGE_SIZE = 20;

function iconFor(n: NotificationItem) {
  if (n.refType === 'urgent_booking') return Zap;
  if (n.refType === 'job_request') return n.type === 'REQUEST' ? Megaphone : FileText;
  if (n.refType === 'wallet') return Wallet;
  if (n.refType === 'booking') return CalendarCheck;
  if (n.type === 'MESSAGE') return MessageSquare;
  if (n.type === 'REVIEW') return Star;
  if (n.type === 'FAVORITE') return Heart;
  return Bell;
}

function groupOf(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Aujourd’hui';
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return 'Plus tôt';
}

export default function NotificationsPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [onlyUnread, setOnlyUnread] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationApi.list(page, PAGE_SIZE),
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };
  const markRead = useMutation({ mutationFn: notificationApi.markRead, onSuccess: refresh });
  const markAll = useMutation({ mutationFn: notificationApi.markAllRead, onSuccess: refresh });
  const remove = useMutation({ mutationFn: notificationApi.delete, onSuccess: refresh });

  const items = useMemo(() => (data?.content ?? []).filter((n) => !onlyUnread || !n.read), [data, onlyUnread]);
  const unreadCount = (data?.content ?? []).filter((n) => !n.read).length;
  const groups = useMemo(() => {
    const out: { label: string; items: NotificationItem[] }[] = [];
    for (const n of items) {
      const label = groupOf(n.createdAt);
      const last = out[out.length - 1];
      if (last?.label === label) last.items.push(n);
      else out.push({ label, items: [n] });
    }
    return out;
  }, [items]);

  // Une notification mène à ce dont elle parle
  const open = (n: NotificationItem) => {
    if (!n.read) markRead.mutate(n.id);
    const base = role === 'PROVIDER' ? '/dashboard/provider' : '/dashboard/client';
    // Le client va droit au suivi de sa demande
    if (n.refType === 'job_request' && n.refId) router.push(role === 'PROVIDER' ? '/dashboard/provider/requests' : `/dashboard/client/requests/${n.refId}`);
    else if ((n.refType === 'booking' || n.refType === 'urgent_booking') && role !== 'PROVIDER' && n.refId) router.push(`/dashboard/client/bookings/${n.refId}`);
    else if (n.refType === 'booking' || n.refType === 'urgent_booking') router.push(`${base}/bookings`);
    else if (n.refType === 'wallet') router.push('/dashboard/provider/wallet');
    else if (n.type === 'MESSAGE') router.push('/dashboard/messages');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Notifications"
        description="Réservations, paiements, messages et avis : tout ce qui vous concerne."
        actions={
          unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-60"
            >
              {markAll.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Tout marquer comme lu
            </button>
          )
        }
      />

      <div className="flex gap-1 rounded-lg bg-muted p-1 sm:w-fit" role="tablist">
        {[
          { v: false, label: 'Toutes' },
          { v: true, label: `Non lues${unreadCount ? ` (${unreadCount})` : ''}` },
        ].map((t) => (
          <button
            key={String(t.v)}
            type="button"
            role="tab"
            aria-selected={onlyUnread === t.v}
            onClick={() => setOnlyUnread(t.v)}
            className={cn('h-9 flex-1 rounded-md px-4 text-sm font-semibold sm:flex-none', onlyUnread === t.v ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-border bg-card px-6 py-10 text-center">
          <p className="font-semibold">Impossible de charger les notifications.</p>
          <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-semibold underline underline-offset-4">
            Réessayer
          </button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title={onlyUnread ? 'Tout est lu' : 'Pas encore de notification'}
          description={onlyUnread ? 'Vous êtes à jour.' : 'Vous serez prévenu ici quand une réservation avance ou qu’on vous écrit.'}
        />
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.label} aria-label={g.label}>
              <h2 className="mb-2 font-sans text-sm font-semibold tracking-normal text-muted-foreground">{g.label}</h2>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {g.items.map((n) => {
                  const Icon = iconFor(n);
                  return (
                    <li key={n.id} className={cn('relative flex items-start gap-3', !n.read && 'bg-sun-50/60 dark:bg-sun-500/[0.05]')}>
                      {!n.read && <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-sun-400" aria-hidden="true" />}
                      <button type="button" onClick={() => open(n)} className="flex min-w-0 flex-1 items-start gap-3 px-4 py-4 text-left">
                        <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', n.refType === 'urgent_booking' ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' : 'bg-muted text-foreground/70')}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className={cn('block text-[15px]', n.read ? 'font-medium' : 'font-bold')}>
                            {n.title}
                            {!n.read && <span className="sr-only"> (non lue)</span>}
                          </span>
                          <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{n.body}</span>
                          <span className="mt-1 block text-[12px] text-muted-foreground">{formatRelativeTime(n.createdAt)}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => remove.mutate(n.id)}
                        disabled={remove.isPending && remove.variables === n.id}
                        className="m-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-red-700 dark:hover:text-red-300"
                        aria-label="Supprimer la notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {data && data.totalPages > 1 && (
            <nav className="flex items-center justify-between" aria-label="Pagination">
              <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="h-10 rounded-lg border border-border px-4 text-sm font-semibold disabled:opacity-40">
                Plus récentes
              </button>
              <span className="text-sm tabular text-muted-foreground">
                Page {page + 1} sur {data.totalPages}
              </span>
              <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= data.totalPages} className="h-10 rounded-lg border border-border px-4 text-sm font-semibold disabled:opacity-40">
                Plus anciennes
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
