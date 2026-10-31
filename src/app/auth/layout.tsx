'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/utils/cn';

/** Plan de quartier en filigrane : le même langage graphique que la démonstration du hero. */
function CityBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-brand-900 opacity-[0.07] dark:text-brand-200 dark:opacity-[0.06]"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <g strokeWidth="1.5">
          {[70, 150, 300, 520, 640, 740].map((y) => (
            <path key={`h${y}`} d={`M0 ${y} C 300 ${y - 22}, 820 ${y + 26}, 1200 ${y - 10}`} />
          ))}
          {[120, 260, 470, 760, 940, 1100].map((x) => (
            <path key={`v${x}`} d={`M${x} 0 C ${x - 26} 260, ${x + 30} 540, ${x - 12} 800`} />
          ))}
        </g>
        <g strokeWidth="7">
          <path d="M0 400 C 260 352, 470 470, 760 430 S 1060 340, 1200 370" />
          <path d="M360 0 C 400 230, 330 520, 400 800" />
          <path d="M880 0 C 840 260, 790 520, 850 800" />
        </g>
        <circle cx="760" cy="430" r="26" strokeWidth="7" />
      </g>
    </svg>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('auth.layout');
  const pathname = usePathname();
  const wide = pathname.startsWith('/auth/register');

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-paper">
      <CityBackdrop />

      <header className="relative z-10 mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('home')}
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-start justify-center px-4 pb-10 pt-6 sm:items-center sm:py-10">
        <div className={cn('w-full', wide ? 'max-w-[560px]' : 'max-w-[440px]')}>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-28px_rgb(12_55_39/0.35)]">
            {/* bande à damier des taxis de Douala : la signature des écrans de compte */}
            <div
              className="h-3 bg-[repeating-conic-gradient(var(--color-gray-950)_0_25%,var(--color-sun-400)_0_50%)] bg-[length:12px_12px]"
              aria-hidden="true"
            />
            <div className="px-6 pb-8 pt-7 sm:px-10 sm:pb-10 sm:pt-9">{children}</div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('help')}{' '}
            <a
              href="https://wa.me/237600000000"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700 dark:text-brand-300"
            >
              {t('helpCta')}
            </a>
          </p>
        </div>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[13px] text-muted-foreground sm:px-6">
        <span>
          &copy; {new Date().getFullYear()} Ouvra. {t('rights')}
        </span>
        <span className="flex gap-4">
          <Link href="/#conditions" className="hover:text-foreground">
            {t('terms')}
          </Link>
          <Link href="/#confidentialite" className="hover:text-foreground">
            {t('privacy')}
          </Link>
        </span>
      </footer>
    </div>
  );
}
