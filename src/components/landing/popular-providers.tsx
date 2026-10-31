'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MapPin, Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

const providers = [
  { id: '1', name: 'Jean-Pierre Mbarga', profession: 'plumber', city: 'Douala', rating: 4.9, reviewCount: 127, startingPrice: 5000, initials: 'JM', online: true },
  { id: '2', name: 'Marie-Claire Ngo', profession: 'hairdresser', city: 'Yaoundé', rating: 4.8, reviewCount: 243, startingPrice: 3000, initials: 'MN', online: true },
  { id: '3', name: 'Paul Kamga', profession: 'electrician', city: 'Douala', rating: 4.9, reviewCount: 89, startingPrice: 7500, initials: 'PK', online: false },
  { id: '4', name: 'Fatima Amadou', profession: 'cleaner', city: 'Yaoundé', rating: 4.7, reviewCount: 312, startingPrice: 2500, initials: 'FA', online: true },
  { id: '5', name: 'Emmanuel Fotso', profession: 'carpenter', city: 'Bafoussam', rating: 4.8, reviewCount: 67, startingPrice: 10000, initials: 'EF', online: true },
  { id: '6', name: 'Sylvie Atangana', profession: 'photographer', city: 'Douala', rating: 4.9, reviewCount: 198, startingPrice: 15000, initials: 'SA', online: false },
  { id: '7', name: 'Ibrahim Moussa', profession: 'acTechnician', city: 'Garoua', rating: 4.6, reviewCount: 54, startingPrice: 8000, initials: 'IM', online: true },
  { id: '8', name: 'Grace Tchamba', profession: 'mathTutor', city: 'Yaoundé', rating: 5.0, reviewCount: 76, startingPrice: 5000, initials: 'GT', online: true },
] as const;

export function PopularProvidersSection() {
  const t = useTranslations('landing.providers');
  const locale = useLocale();
  const scrollRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const price = new Intl.NumberFormat(locale);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  const scroll = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const arrow =
    'flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-35 dark:hover:border-gray-600';

  return (
    <section className="py-20 sm:py-28" aria-labelledby="providers-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <h2 id="providers-title" className="text-3xl font-bold sm:text-[2.6rem] sm:leading-[1.1]">
              {t('title')}
            </h2>
            <p className="mt-3 text-[17px] text-muted-foreground">{t('subtitle')}</p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button onClick={() => scroll(-1)} disabled={!canScrollLeft} className={arrow} aria-label={t('scrollLeft')}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => scroll(1)} disabled={!canScrollRight} className={arrow} aria-label={t('scrollRight')}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <ul
          ref={scrollRef}
          onScroll={checkScroll}
          className="hide-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:px-0"
        >
          {providers.map((p) => (
            <li key={p.id} className="w-[78%] shrink-0 snap-start sm:w-[300px]">
              <Link
                href={`/providers/${p.id}`}
                className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-gray-400 dark:hover:border-gray-600"
              >
                <div className="flex items-start justify-between">
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 font-display text-lg font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
                    {p.initials}
                    {p.online && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[2.5px] border-card bg-brand-500" title={t('available')} />
                    )}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-semibold tabular">
                    <Star className="h-4 w-4 fill-sun-400 text-sun-400" />
                    {p.rating.toFixed(1)}
                    <span className="font-normal text-muted-foreground">({p.reviewCount})</span>
                  </span>
                </div>

                <h3 className="mt-5 font-display text-lg font-semibold leading-tight group-hover:underline group-hover:decoration-sun-400 group-hover:decoration-2 group-hover:underline-offset-4">
                  {p.name}
                </h3>
                <p className="mb-5 mt-1 text-[15px] text-muted-foreground">{t(`professions.${p.profession}`)}</p>

                <div className="mt-auto flex items-end justify-between border-t border-border pt-4">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {p.city}
                  </span>
                  <span className="text-right">
                    <span className="block text-[12px] text-muted-foreground">{t('from')}</span>
                    <span className="font-display text-[17px] font-bold tabular">{price.format(p.startingPrice)} FCFA</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/search"
          className="mt-8 inline-block text-[15px] font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700 dark:text-brand-300"
        >
          {t('viewAll')}
        </Link>
      </div>
    </section>
  );
}
