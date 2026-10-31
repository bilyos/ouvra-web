'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function CTASection() {
  const t = useTranslations('landing.cta');

  return (
    <section className="bg-sun-400 text-gray-950" aria-labelledby="cta-title">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="max-w-2xl">
          <h2 id="cta-title" className="text-3xl font-bold sm:text-5xl sm:leading-[1.05]">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-gray-950/75">{t('subtitle')}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
          <Link
            href="/auth/register?role=provider"
            className="inline-flex h-14 items-center justify-center rounded-xl bg-brand-900 px-7 text-base font-bold text-white transition-colors hover:bg-brand-800"
          >
            {t('register')}
          </Link>
          <a
            href="https://chat.whatsapp.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-14 items-center justify-center rounded-xl border-2 border-gray-950/80 px-7 text-base font-bold transition-colors hover:bg-gray-950/5"
          >
            {t('whatsapp')}
          </a>
        </div>
      </div>
    </section>
  );
}
