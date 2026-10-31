'use client';

import { useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2, MoreHorizontal, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { adminApi } from '@/services/api';
import { useFormatters } from '@/hooks/use-formatters';
import { useAuthStore } from '@/stores/auth-store';
import { EmptyState, PageHeader, StatusDot } from '@/components/dashboard/page-parts';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/cn';
import { getInitials } from '@/utils/format';
import { getApiErrorMessage } from '@/utils/api-error';
import type { AdminUser, Role } from '@/types';

type Tab = '' | 'CLIENT' | 'PROVIDER' | 'ADMIN' | 'SUSPENDED';
type Pending = { kind: 'suspend' | 'role' | 'delete'; user: AdminUser } | null;

const roleKey: Record<Role, string> = { CLIENT: 'roleClient', PROVIDER: 'roleProvider', ADMIN: 'roleAdmin' };

export default function AdminUsersPage() {
  const t = useTranslations('admin.usersPage');
  const { formatDate } = useFormatters();
  const queryClient = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const [tab, setTab] = useState<Tab>('');
  const [page, setPage] = useState(0);
  const [pending, setPending] = useState<Pending>(null);
  const [reason, setReason] = useState('');
  const [newRole, setNewRole] = useState<Role>('CLIENT');

  const params = {
    search: deferredSearch || undefined,
    role: tab && tab !== 'SUSPENDED' ? tab : undefined,
    suspended: tab === 'SUSPENDED' ? true : undefined,
    page,
    size: 20,
  };
  const { data, isLoading, isFetching } = useQuery({ queryKey: ['admin-users', params], queryFn: () => adminApi.listUsers(params), placeholderData: (prev) => prev });

  const done = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    setPending(null);
    setReason('');
  };
  const suspend = useMutation({ mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminApi.suspendUser(id, reason), onSuccess: done });
  const activate = useMutation({ mutationFn: (id: string) => adminApi.activateUser(id), onSuccess: done });
  const changeRole = useMutation({ mutationFn: ({ id, role }: { id: string; role: Role }) => adminApi.changeRole(id, role), onSuccess: done });
  const remove = useMutation({ mutationFn: (id: string) => adminApi.deleteUser(id), onSuccess: done });
  const busy = suspend.isPending || changeRole.isPending || remove.isPending;
  const error = suspend.error ?? changeRole.error ?? remove.error ?? activate.error;

  const users = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.totalElements ?? 0;

  const tabs: { v: Tab; l: string }[] = [
    { v: '', l: t('allRoles') },
    { v: 'CLIENT', l: t('clients') },
    { v: 'PROVIDER', l: t('providers') },
    { v: 'ADMIN', l: t('admins') },
    { v: 'SUSPENDED', l: t('suspendedOnly') },
  ];

  const open = (kind: NonNullable<Pending>['kind'], user: AdminUser) => {
    suspend.reset();
    changeRole.reset();
    remove.reset();
    if (kind === 'role') setNewRole(user.role);
    setPending({ kind, user });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle', { count: total })} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="hide-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="tablist">
          {tabs.map((x) => (
            <button
              key={x.v || 'all'}
              type="button"
              role="tab"
              aria-selected={tab === x.v}
              onClick={() => {
                setTab(x.v);
                setPage(0);
              }}
              className={cn('h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors', tab === x.v ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground')}
            >
              {x.l}
            </button>
          ))}
        </div>
        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            aria-label={t('searchPlaceholder')}
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-9 text-sm outline-none focus:border-brand-600 focus:ring-[3px] focus:ring-brand-600/15"
          />
          {isFetching && !isLoading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {activate.isError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {getApiErrorMessage(activate.error, t('actionError'))}
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState title={t('empty')} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-paper text-left text-[13px] text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-5 py-2.5 font-medium">{t('colUser')}</th>
                  <th className="px-4 py-2.5 font-medium">{t('colRole')}</th>
                  <th className="px-4 py-2.5 font-medium">{t('colCity')}</th>
                  <th className="px-4 py-2.5 font-medium">{t('colStatus')}</th>
                  <th className="px-4 py-2.5 font-medium">{t('colSignup')}</th>
                  <th className="w-12 px-4 py-2.5">
                    <span className="sr-only">{t('colActions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const name = `${u.firstName} ${u.lastName}`.trim();
                  const isMe = u.id === me?.id;
                  return (
                    <tr key={u.id} className={cn('transition-colors hover:bg-muted/40', u.suspended && 'bg-red-50/40 dark:bg-red-500/[0.04]')}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-[13px] font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
                            {u.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element -- avatar servi par l'API
                              <img loading="lazy" decoding="async" src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              getInitials(name || '?')
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{name}</p>
                            <p className="truncate text-[13px] tabular text-muted-foreground">{[u.phone, u.email].filter(Boolean).join(', ')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{t(roleKey[u.role])}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.city || '–'}</td>
                      <td className="px-4 py-3">
                        {u.suspended ? (
                          <span title={u.suspendedReason ?? undefined}>
                            <StatusDot tone="red">{t('suspended')}</StatusDot>
                          </span>
                        ) : (
                          <StatusDot tone="green">{t('active')}</StatusDot>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular text-muted-foreground">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {!isMe && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" aria-label={t('actionsFor', { name })}>
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onSelect={() => open('role', u)}>{t('changeRole')}</DropdownMenuItem>
                              {u.suspended ? (
                                <DropdownMenuItem onSelect={() => activate.mutate(u.id)}>{t('reactivate')}</DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onSelect={() => open('suspend', u)}>{t('suspend')}</DropdownMenuItem>
                              )}
                              {u.role !== 'ADMIN' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onSelect={() => open('delete', u)} className="text-red-600 focus:text-red-700 dark:text-red-300">
                                    {t('delete')}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <Dialog open={!!pending} onOpenChange={(o) => !o && !busy && setPending(null)}>
        <DialogContent className="sm:max-w-md">
          {pending && (
            <>
              <DialogHeader>
                <DialogTitle>{pending.kind === 'suspend' ? t('suspendTitle') : pending.kind === 'role' ? t('changeRole') : t('deleteTitle')}</DialogTitle>
                <DialogDescription>
                  <span className="font-semibold text-foreground">
                    {pending.user.firstName} {pending.user.lastName}
                  </span>
                  {', '}
                  {pending.kind === 'suspend' ? t('suspendHint') : pending.kind === 'role' ? t('roleHint') : t('deleteHint')}
                </DialogDescription>
              </DialogHeader>

              {pending.kind === 'suspend' && (
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('suspendReasonPlaceholder')}
                  rows={3}
                  aria-label={t('suspendReasonPlaceholder')}
                  className="w-full resize-none rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-brand-600 focus:ring-[3px] focus:ring-brand-600/15"
                />
              )}

              {pending.kind === 'role' && (
                <div role="radiogroup" aria-label={t('colRole')} className="grid grid-cols-3 gap-2">
                  {(['CLIENT', 'PROVIDER', 'ADMIN'] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={newRole === r}
                      onClick={() => setNewRole(r)}
                      className={cn('h-11 rounded-lg border text-sm font-semibold transition-colors', newRole === r ? 'border-brand-700 ring-1 ring-brand-700 dark:border-brand-300 dark:ring-brand-300' : 'border-border text-muted-foreground hover:text-foreground')}
                    >
                      {r === 'ADMIN' ? t('roleAdminLong') : t(roleKey[r])}
                    </button>
                  ))}
                </div>
              )}

              {error && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                  {getApiErrorMessage(error, t('actionError'))}
                </p>
              )}

              <DialogFooter className="gap-2">
                <button type="button" onClick={() => setPending(null)} disabled={busy} className="h-10 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted">
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  disabled={busy || (pending.kind === 'role' && newRole === pending.user.role)}
                  onClick={() => {
                    const id = pending.user.id;
                    if (pending.kind === 'suspend') suspend.mutate({ id, reason: reason.trim() || undefined });
                    else if (pending.kind === 'role') changeRole.mutate({ id, role: newRole });
                    else remove.mutate(id);
                  }}
                  className={cn(
                    'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-50',
                    pending.kind === 'role' ? 'bg-brand-800 hover:bg-brand-700' : 'bg-red-600 hover:bg-red-700'
                  )}
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {pending.kind === 'suspend' ? t('suspend') : pending.kind === 'role' ? t('confirm') : t('delete')}
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
