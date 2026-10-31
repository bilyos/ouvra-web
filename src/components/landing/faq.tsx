'use client';

import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/utils/cn';

const faqKeys = ['how', 'free', 'verification', 'payment', 'problem', 'cities', 'becomeProvider'] as const;

export function FAQSection() {
  const t = useTranslations('landing.faq');
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section id="faq" className="scroll-mt-20 border-t border-border bg-paper py-20 sm:py-28" aria-labelledby="faq-title">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <h2 id="faq-title" className="text-3xl font-bold sm:text-[2.6rem] sm:leading-[1.1]">
              {t('title')}
            </h2>
            <p className="mt-4 max-w-xs text-[17px] text-muted-foreground">{t('contact')}</p>
            <a
              href="https://wa.me/237600000000"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block text-[15px] font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700 dark:text-brand-300"
            >
              {t('contactCta')}
            </a>
          </div>
        </div>

        <ul className="border-t border-border lg:col-span-8">
          {faqKeys.map((key, i) => {
            const isOpen = open === i;
            const panelId = `${baseId}-${key}`;
            return (
              <li key={key} className="border-b border-border">
                <h3 className="font-sans tracking-normal">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-semibold transition-colors hover:text-brand-800 dark:hover:text-brand-200"
                  >
                    {t(`items.${key}.question`)}
                    <Plus
                      aria-hidden="true"
                      className={cn('h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-45 text-foreground')}
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  className={cn('grid transition-[grid-template-rows] duration-200 ease-out', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-2xl pb-6 text-[16px] leading-relaxed text-muted-foreground">{t(`items.${key}.answer`)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
