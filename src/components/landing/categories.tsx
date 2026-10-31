'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Wrench,
  Zap,
  SprayCan,
  Scissors,
  Hammer,
  PaintRoller,
  AirVent,
  Laptop,
  BookOpen,
  Truck,
  Camera,
  CookingPot,
} from 'lucide-react';

const categories = [
  { key: 'plumbing', icon: Wrench, count: 845 },
  { key: 'electricity', icon: Zap, count: 723 },
  { key: 'cleaning', icon: SprayCan, count: 1203 },
  { key: 'beauty', icon: Scissors, count: 956 },
  { key: 'carpentry', icon: Hammer, count: 412 },
  { key: 'painting', icon: PaintRoller, count: 567 },
  { key: 'airConditioning', icon: AirVent, count: 328 },
  { key: 'it', icon: Laptop, count: 689 },
  { key: 'tutoring', icon: BookOpen, count: 534 },
  { key: 'moving', icon: Truck, count: 287 },
  { key: 'photography', icon: Camera, count: 398 },
  { key: 'catering', icon: CookingPot, count: 445 },
] as const;

export function CategoriesSection() {
  const t = useTranslations('landing.categories');
  const locale = useLocale();
  const fmt = new Intl.NumberFormat(locale);

  return (
    <section className="py-20 sm:py-28" aria-labelledby="categories-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <h2 id="categories-title" className="text-3xl font-bold sm:text-[2.6rem] sm:leading-[1.1]">
              {t('title')}
            </h2>
            <p className="mt-3 text-[17px] text-muted-foreground">{t('subtitle')}</p>
          </div>
          <Link
            href="/search"
            className="shrink-0 text-[15px] font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700 dark:text-brand-300"
          >
            {t('viewAll')}
          </Link>
        </div>

        <ul className="mt-12 grid sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3">
          {categories.map((cat) => (
            <li key={cat.key} className="border-t border-border">
              <Link
                href={`/search?category=${encodeURIComponent(t(`items.${cat.key}.label`))}`}
                className="group -mx-3 flex items-center gap-4 rounded-lg px-3 py-5 transition-colors hover:bg-paper"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors group-hover:bg-sun-300 group-hover:text-gray-950 dark:bg-brand-900/60 dark:text-brand-200">
                  <cat.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[17px] font-semibold tracking-[-0.01em]">{t(`items.${cat.key}.label`)}</span>
                  <span className="block truncate text-sm text-muted-foreground">{t(`items.${cat.key}.description`)}</span>
                </span>
                <span className="shrink-0 text-sm text-muted-foreground tabular">{t('pros', { count: fmt.format(cat.count) })}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
