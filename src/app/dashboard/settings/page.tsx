'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight, Loader2, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { useAuthStore } from '@/stores/auth-store';
import { setUserLocale } from '@/i18n/locale';
import { locales, localeLabels, type Locale } from '@/i18n/config';
import { PageHeader } from '@/components/dashboard/page-parts';
import { cn } from '@/utils/cn';
import { getInitials } from '@/utils/format';

const themeOptions = [
  { value: 'light', key: 'themeLight', icon: Sun },
  { value: 'dark', key: 'themeDark', icon: Moon },
  { value: 'system', key: 'themeSystem', icon: Monitor },
] as const;

const PROFILE_HREF = '/dashboard/client/profile';

/** Ligne de réglage : libellé et aide à gauche, contrôle à droite. */
function Row({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 py-6 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:gap-10">
      <div>
        <h2 className="font-sans text-base font-semibold tracking-normal">{title}</h2>
        {hint && <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [switching, startTransition] = useTransition();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);

  const changeLocale = (next: Locale) => {
    startTransition(async () => {
      await setUserLocale(next);
      router.refresh();
    });
  };

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader title={t('title')} description={t('subtitle')} />

      <div className="divide-y divide-border rounded-xl border border-border bg-card p-5 sm:p-7">
        <Row title={t('account')} hint={t('accountSubtitle')}>
          <Link href={PROFILE_HREF} className="group flex items-center gap-4 rounded-lg border border-border p-3.5 transition-colors hover:bg-muted/60">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-display font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- avatar servi par l'API
                <img loading="lazy" decoding="async" src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                getInitials(fullName || '?')
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{fullName || '–'}</span>
              <span className="block truncate text-[13px] text-muted-foreground tabular">{[user?.phone, user?.email].filter(Boolean).join(', ')}</span>
            </span>
            <span className="hidden shrink-0 text-sm font-semibold text-brand-700 sm:inline dark:text-brand-300">{t('editProfile')}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Row>

        <Row title={t('security')} hint={t('securitySubtitle')}>
          <Link href={`${PROFILE_HREF}#password`} className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted">
            {t('changePassword')}
          </Link>
        </Row>

        <Row title={t('appearance')} hint={t('appearanceSubtitle')}>
          <div role="radiogroup" aria-label={t('appearance')} className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => {
              const active = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border px-2 py-4 text-sm font-semibold transition-colors',
                    active ? 'border-brand-700 ring-1 ring-brand-700 dark:border-brand-300 dark:ring-brand-300' : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  <opt.icon className="h-5 w-5" />
                  {t(opt.key)}
                </button>
              );
            })}
          </div>
        </Row>

        <Row title={t('language')} hint={t('languageSubtitle')}>
          <div role="radiogroup" aria-label={t('language')} className="flex flex-wrap items-center gap-2">
            {locales.map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={locale === l}
                disabled={switching}
                onClick={() => locale !== l && changeLocale(l)}
                className={cn(
                  'h-10 rounded-lg border px-4 text-sm font-semibold transition-colors disabled:opacity-60',
                  locale === l ? 'border-brand-700 ring-1 ring-brand-700 dark:border-brand-300 dark:ring-brand-300' : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {localeLabels[l]}
              </button>
            ))}
            {switching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </Row>
      </div>

      <div className="rounded-xl border border-red-200 bg-card p-5 sm:p-7 dark:border-red-900/60">
        <Row title={t('dangerZone')} hint={t('dangerZoneSubtitle')}>
          <Link
            href={`${PROFILE_HREF}#delete`}
            className="inline-flex h-10 items-center rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-500/10"
          >
            {t('deleteAccount')}
          </Link>
        </Row>
      </div>
    </div>
  );
}
