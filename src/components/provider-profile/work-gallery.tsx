'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/utils/cn';

/** Photos de chantier : une grande + les suivantes, visionneuse plein écran au clavier. */
export function WorkGallery({ photos, name }: { photos: string[]; name: string }) {
  const t = useTranslations('provider.profile');
  const [index, setIndex] = useState<number | null>(null);
  const total = photos.length;

  const go = useCallback((delta: number) => setIndex((i) => (i === null ? i : (i + delta + total) % total)), [total]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndex(null);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [index, go]);

  if (total === 0) {
    return <p className="rounded-xl border border-dashed border-gray-300 px-5 py-8 text-center text-[15px] text-muted-foreground dark:border-gray-700">{t('workEmpty')}</p>;
  }

  const visible = photos.slice(0, 5);
  const hidden = total - visible.length;

  return (
    <>
      <ul className={cn('grid gap-2', total === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-4 sm:grid-rows-2')}>
        {visible.map((src, i) => (
          <li key={src} className={cn(i === 0 && total > 1 && 'col-span-2 row-span-2', 'relative')}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group block h-full w-full overflow-hidden rounded-xl bg-muted"
              aria-label={t('photoOf', { n: i + 1, total })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- photos servies par l'API, domaine variable */}
              <img
                src={src}
                alt=""
                loading="lazy"
                className={cn(
                  'h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]',
                  i === 0 && total > 1 ? 'aspect-square sm:aspect-auto' : 'aspect-square'
                )}
              />
              {i === visible.length - 1 && hidden > 0 && (
                <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-950/55 font-display text-2xl font-bold text-white">
                  +{hidden}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {index !== null && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-gray-950/95" role="dialog" aria-modal="true" aria-label={`${name}, ${t('work')}`}>
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm tabular text-white/70">{t('photoOf', { n: index + 1, total })}</span>
            <button type="button" onClick={() => setIndex(null)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10" aria-label={t('close')}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4 pb-6" onClick={() => setIndex(null)}>
            {/* eslint-disable-next-line @next/next/no-img-element -- visionneuse */}
            <img loading="lazy" decoding="async" src={photos[index]} alt={t('photoOf', { n: index + 1, total })} className="max-h-full max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(-1);
                  }}
                  className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  aria-label={t('prev')}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(1);
                  }}
                  className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  aria-label={t('next')}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
