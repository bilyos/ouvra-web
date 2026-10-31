'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { PhoneMockup } from './phone-mockup';
import { AppleLogo, GooglePlayLogo } from './store-badges';

export function DownloadAppSection() {
  const t = useTranslations('landing.app');
  const features = t.raw('features') as string[];

  return (
    <section className="overflow-hidden border-t border-border bg-paper py-20 sm:py-28" aria-labelledby="app-title">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] items-center gap-16 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-6">
          <p className="inline-flex items-center gap-2 rounded-md bg-sun-100 px-2.5 py-1 text-[13px] font-semibold text-sun-800 dark:bg-sun-500/15 dark:text-sun-200">
            <span className="h-1.5 w-1.5 rounded-full bg-sun-500" aria-hidden="true" />
            {t('soon')}
          </p>
          <h2 id="app-title" className="mt-5 text-3xl font-bold sm:text-[2.6rem] sm:leading-[1.1]">
            {t('title')}
          </h2>
          <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-muted-foreground">{t('subtitle')}</p>

          <ul className="mt-8 space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-[16px]">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-700 dark:text-brand-300" strokeWidth={2.4} aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {[
              { name: t('ios'), Logo: AppleLogo, logoClass: 'h-[22px] w-[22px]' },
              { name: t('android'), Logo: GooglePlayLogo, logoClass: 'h-[22px] w-[20px]' },
            ].map(({ name, Logo, logoClass }) => (
              <span
                key={name}
                role="img"
                aria-label={`${t('soonOn')} ${name}`}
                className="inline-flex h-[52px] min-w-[164px] items-center gap-3 rounded-xl bg-gray-950 px-4 text-white ring-1 ring-inset ring-white/10 dark:bg-white dark:text-gray-950"
              >
                <Logo className={logoClass} />
                <span className="leading-none">
                  <span className="block text-[11px] font-medium opacity-80">{t('soonOn')}</span>
                  <span className="mt-1 block font-sans text-[17px] font-semibold tracking-[-0.01em]">{name}</span>
                </span>
              </span>
            ))}
            <a
              href="https://chat.whatsapp.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[52px] items-center rounded-xl bg-brand-900 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-brand-800 dark:bg-brand-300 dark:text-brand-950 dark:hover:bg-brand-200"
            >
              {t('notify')}
            </a>
          </div>
        </div>

        <div className="lg:col-span-6">
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}
