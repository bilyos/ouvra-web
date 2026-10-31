'use client';

import { useLocale, useTranslations } from 'next-intl';
import { BadgeCheck, MessageCircle, Receipt, Star } from 'lucide-react';

const items = [
  { key: 'verified', icon: BadgeCheck },
  { key: 'reviews', icon: Star },
  { key: 'payment', icon: Receipt },
  { key: 'messaging', icon: MessageCircle },
] as const;

export function TrustSection() {
  const t = useTranslations('landing.trust');
  const locale = useLocale();
  const n = new Intl.NumberFormat(locale);

  const figures = [
    { value: `${n.format(10000)}+`, label: t('figures.providers') },
    { value: `${n.format(50000)}+`, label: t('figures.clients') },
    { value: locale === 'fr' ? '4,8/5' : '4.8/5', label: t('figures.rating') },
    { value: '10', label: t('figures.regions') },
  ];

  return (
    <section className="bg-brand-900 py-20 text-white sm:py-28" aria-labelledby="trust-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 id="trust-title" className="text-3xl font-bold sm:text-[2.6rem] sm:leading-[1.1]">
              {t('title')}
            </h2>
            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-brand-100/80">{t('subtitle')}</p>
          </div>

          <dl className="grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:col-span-7">
            {items.map((item) => (
              <div key={item.key}>
                <dt className="flex items-center gap-3 font-display text-lg font-semibold">
                  <item.icon className="h-5 w-5 text-sun-400" strokeWidth={2} aria-hidden="true" />
                  {t(`items.${item.key}.title`)}
                </dt>
                <dd className="mt-2 pl-8 text-[15px] leading-relaxed text-brand-100/75">{t(`items.${item.key}.description`)}</dd>
              </div>
            ))}
          </dl>
        </div>

        <dl className="mt-16 grid grid-cols-2 gap-y-8 border-t border-white/15 pt-10 lg:grid-cols-4">
          {figures.map((f) => (
            <div key={f.label} className="flex flex-col-reverse">
              <dt className="mt-1 text-[15px] text-brand-100/70">{f.label}</dt>
              <dd className="font-display text-4xl font-bold tracking-[-0.03em] tabular sm:text-5xl">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
