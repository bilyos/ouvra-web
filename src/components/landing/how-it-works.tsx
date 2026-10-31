'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

const steps = ['describe', 'choose', 'enjoy'] as const;

export function HowItWorksSection() {
  const t = useTranslations('landing.howItWorks');

  return (
    <section id="comment-ca-marche" className="scroll-mt-20 border-y border-border bg-paper py-20 sm:py-28" aria-labelledby="how-title">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-4">
          <h2 id="how-title" className="text-3xl font-bold sm:text-[2.6rem] sm:leading-[1.1]">
            {t('title')}
          </h2>
          <p className="mt-3 max-w-sm text-[17px] text-muted-foreground">{t('subtitle')}</p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/search">{t('cta')}</Link>
          </Button>
        </div>

        <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8 lg:col-span-8">
          {steps.map((step, i) => (
            <li key={step} className="relative">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sun-400 font-display text-xl font-bold text-gray-950">
                  {i + 1}
                </span>
                {i < steps.length - 1 && <span aria-hidden="true" className="hidden h-px flex-1 bg-gray-300 sm:block dark:bg-gray-700" />}
              </div>
              <h3 className="mt-6 text-xl font-semibold">{t(`steps.${step}.title`)}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{t(`steps.${step}.description`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
