'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Camera, CalendarCheck, Heart, Mic, MessageSquare, Search, Zap, Users } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { favoriteApi, chatApi, providerApi, bookingApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { ProviderCard } from '@/components/providers/provider-card';
import { useDayPeriod } from '@/hooks/use-day-period';

function ProviderCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  );
}

export default function ClientDashboardPage() {
  const t = useTranslations('client.home');
  const user = useAuthStore((s) => s.user);

  const { data: favorites, isLoading: favLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: favoriteApi.list,
  });

  const { data: conversations, isLoading: convLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.listConversations,
  });

  const { data: bookings, isLoading: bookLoading } = useQuery({
    queryKey: ['bookings', 'mine'],
    queryFn: bookingApi.mine,
  });

  const { data: recommended, isLoading: recLoading } = useQuery({
    queryKey: ['providers', 'recommended'],
    queryFn: () => providerApi.search({ sort: 'rating', size: 6 }),
  });

  const unreadMessages = conversations?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;
  const favCount = favorites?.length ?? 0;
  const activeBookings = bookings?.filter((b) => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(b.status)).length ?? 0;
  const period = useDayPeriod();
  const greetingKey = period === 'morning' ? 'greetingMorning' : period === 'afternoon' ? 'greetingAfternoon' : 'greetingEvening';

  const stats = [
    { label: t('activeBookings'), value: activeBookings, href: '/dashboard/client/bookings', icon: CalendarCheck },
    { label: t('unreadMessages'), value: unreadMessages, href: '/dashboard/messages', icon: MessageSquare },
    { label: t('favorites'), value: favCount, href: '/dashboard/client/favorites', icon: Heart },
  ];

  const quickActions = [
    { label: t('actionSearch'), description: t('actionSearchDesc'), icon: Search, href: '/search' },
    { label: t('actionMessages'), description: t('actionMessagesDesc'), icon: MessageSquare, href: '/dashboard/messages' },
    { label: t('actionFavorites'), description: t('actionFavoritesDesc'), icon: Heart, href: '/dashboard/client/favorites' },
  ];

  const statsLoading = favLoading || convLoading || bookLoading;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">
            {t(greetingKey)}, {user?.firstName ?? t('fallbackUser')}
          </h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button asChild size="lg" variant="accent">
          <Link href="/search">
            <Search />
            {t('searchCta')}
          </Link>
        </Button>
      </header>

      <section className="flex flex-col gap-5 rounded-xl bg-brand-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-7 dark:bg-brand-950 dark:ring-1 dark:ring-white/10">
        <div className="flex items-start gap-4">
          <span className="hidden shrink-0 gap-1.5 sm:flex" aria-hidden="true">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10"><Camera className="h-5 w-5" /></span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10"><Mic className="h-5 w-5" /></span>
          </span>
          <div>
            <h2 className="font-display text-xl font-bold">{t('showProblemTitle')}</h2>
            <p className="mt-1 max-w-xl text-[15px] text-brand-100/85">{t('showProblemDesc')}</p>
          </div>
        </div>
        <Link
          href="/dashboard/client/requests/new"
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-sun-400 px-5 text-[15px] font-bold text-gray-950 shadow-[inset_0_-3px_0_rgb(0_0_0/0.14)] hover:bg-sun-300"
        >
          {t('showProblemCta')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section aria-label={t('activeBookings')} className="grid divide-y divide-border rounded-xl border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group flex items-center justify-between gap-4 px-6 py-5 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-paper sm:first:rounded-l-xl sm:first:rounded-tr-none sm:last:rounded-r-xl sm:last:rounded-bl-none">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              {statsLoading ? (
                <div className="mt-2 h-8 w-10 animate-pulse rounded bg-muted" />
              ) : (
                <p className="mt-1 font-display text-[2rem] font-bold leading-none tabular">{stat.value}</p>
              )}
            </div>
            <stat.icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" />
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_2fr]" aria-label={t('quickActions')}>
        <Link
          href="/dashboard/client/urgent"
          className="group flex flex-col justify-between gap-6 rounded-xl bg-red-600 p-6 text-white transition-colors hover:bg-red-700"
        >
          <Zap className="h-6 w-6" />
          <div>
            <h2 className="font-display text-xl font-bold">{t('actionUrgent')}</h2>
            <p className="mt-1 text-[15px] text-white/85">{t('actionUrgentDesc')}</p>
          </div>
        </Link>
        <ul className="grid divide-y divide-border rounded-xl border border-border bg-card">
          {quickActions.map((action) => (
            <li key={action.href}>
              <Link href={action.href} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/60 dark:text-brand-200">
                  <action.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{action.label}</span>
                  <span className="block truncate text-sm text-muted-foreground">{action.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="recommended-title">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 id="recommended-title" className="text-2xl font-bold">{t('recommendedProviders')}</h2>
            <p className="mt-1 text-[15px] text-muted-foreground">{t('recommendedSubtitle')}</p>
          </div>
          <Link href="/search" className="shrink-0 text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700 dark:text-brand-300">
            {t('viewAll')}
          </Link>
        </div>

        {recLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProviderCardSkeleton key={i} />
            ))}
          </div>
        ) : recommended && recommended.content.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.content.map((provider, i) => (
              <ProviderCard key={provider.id} provider={provider} index={i} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
            <p className="text-[15px] text-muted-foreground">{t('noProviders')}</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/search">{t('exploreProviders')}</Link>
            </Button>
          </div>
        )}
      </section>

      <Link
        href="/dashboard/client/become-provider"
        className="flex flex-col gap-4 rounded-xl border border-sun-200 bg-sun-50 p-6 transition-colors hover:border-sun-300 sm:flex-row sm:items-center sm:justify-between dark:border-sun-500/20 dark:bg-sun-500/[0.07]"
      >
        <div className="flex items-start gap-4">
          <Users className="mt-0.5 h-6 w-6 shrink-0 text-sun-700 dark:text-sun-300" />
          <div>
            <h2 className="font-display text-lg font-bold">{t('becomeProviderTitle')}</h2>
            <p className="mt-0.5 max-w-lg text-[15px] text-foreground/70">{t('becomeProviderSubtitle')}</p>
          </div>
        </div>
        <span className="inline-flex h-10 shrink-0 items-center rounded-lg bg-brand-900 px-4 text-sm font-semibold text-white">{t('start')}</span>
      </Link>
    </div>
  );
}
