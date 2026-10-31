'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { categoryApi, providerApi } from '@/services/api';
import { cn } from '@/utils/cn';
import type { ProviderCard } from '@/types';

/** « Yaounde » et « Yaoundé » désignent la même ville. */
const cityKey = (c: string) => c.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

/** Orthographe officielle des villes souvent saisies sans accent. */
const CITY_NAMES: Record<string, string> = {
  yaounde: 'Yaoundé',
  ngaoundere: 'Ngaoundéré',
  limbe: 'Limbé',
};

const median = (sorted: number[]) => {
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : Math.round((sorted[m - 1] + sorted[m]) / 2 / 500) * 500;
};

/** Pas de graduation lisible (500, 1 000, 2 500, 5 000…) selon l'étendue. */
function niceStep(span: number) {
  const steps = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
  return steps.find((s) => span / s <= 5) ?? 250000;
}

const MAX_CITIES = 4;

export function PriceCheckSection() {
  const t = useTranslations('landing.prices');
  const locale = useLocale();
  const fmt = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.list,
    staleTime: 10 * 60_000,
  });
  const { data, isLoading, isError } = useQuery({
    queryKey: ['providers', 'price-check'],
    queryFn: () => providerApi.search({ size: 200 }),
    staleTime: 5 * 60_000,
  });
  const providers = useMemo(() => (data?.content ?? []).filter((p) => p.startingPrice > 0), [data]);

  // Services qui ont au moins un prestataire, les plus fournis d'abord
  const services = useMemo(() => {
    const count = new Map<string, number>();
    for (const p of providers) count.set(p.categoryId, (count.get(p.categoryId) ?? 0) + 1);
    return categories
      .filter((c) => count.has(c.id))
      .map((c) => ({ ...c, count: count.get(c.id)! }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [categories, providers]);

  const [picked, setPicked] = useState<string | null>(null);
  const [city, setCity] = useState<string>('');
  const service = picked ?? services[0]?.id ?? null;

  const inService = useMemo(() => providers.filter((p) => p.categoryId === service), [providers, service]);

  // Villes de ce service, avec l'orthographe accentuée quand elle existe
  const cities = useMemo(() => {
    const map = new Map<string, { label: string; n: number }>();
    for (const p of inService) {
      const k = cityKey(p.city);
      const cur = map.get(k);
      if (cur) cur.n += 1;
      else map.set(k, { label: CITY_NAMES[k] ?? p.city.trim(), n: 1 });
    }
    return [...map.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, MAX_CITIES);
  }, [inService]);

  const activeCity = cities.some(([k]) => k === city) ? city : '';
  const shown = inService.filter((p) => !activeCity || cityKey(p.city) === activeCity);
  const prices = shown.map((p) => p.startingPrice).sort((a, b) => a - b);
  const low = prices[0];
  const high = prices[prices.length - 1];
  // Une médiane sur 1 ou 2 prix ne dit rien d'utile
  const same = prices.length > 0 && low === high;
  const mid = prices.length >= 3 && !same ? median(prices) : undefined;

  // L'échelle couvre tout le service, pour comparer les villes entre elles
  const all = inService.map((p) => p.startingPrice);
  const step = niceStep(Math.max(1, Math.max(...all, 0) - Math.min(...all, 0)) || 1000);
  const scaleMin = all.length ? Math.max(0, Math.floor(Math.min(...all) / step) * step - (Math.min(...all) === Math.max(...all) ? step : 0)) : 0;
  const scaleMax = all.length ? Math.ceil(Math.max(...all) / step) * step + (Math.min(...all) === Math.max(...all) ? step : 0) : step;
  const pos = (v: number) => ((v - scaleMin) / (scaleMax - scaleMin || 1)) * 100;
  const ticks: number[] = [];
  for (let v = scaleMin; v <= scaleMax; v += step) ticks.push(v);

  // Points empilés quand plusieurs prestataires affichent le même prix
  const stacks = useMemo(() => {
    const m = new Map<number, ProviderCard[]>();
    for (const p of inService) m.set(p.startingPrice, [...(m.get(p.startingPrice) ?? []), p]);
    return [...m.entries()];
  }, [inService]);
  const tallest = Math.max(1, ...stacks.map(([, s]) => s.length));

  const serviceLabel = services.find((s) => s.id === service)?.label ?? '';
  const searchHref = `/search?category=${service ?? ''}`;
  const chip = (active: boolean) =>
    cn(
      'h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors',
      active ? 'bg-foreground text-background' : 'border border-border bg-card text-muted-foreground hover:border-gray-400 hover:text-foreground dark:hover:border-gray-600',
    );

  return (
    <section id="tarifs" className="scroll-mt-20 py-20 sm:py-28" aria-labelledby="prices-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 id="prices-title" className="text-3xl font-bold sm:text-[2.6rem] sm:leading-[1.1]">
            {t('title')}
          </h2>
          <p className="mt-3 text-[17px] text-muted-foreground">{t('subtitle')}</p>
        </div>

        {isLoading ? (
          <p className="mt-12 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('loading')}
          </p>
        ) : isError || services.length === 0 ? (
          <p className="mt-12 text-muted-foreground">{t('error')}</p>
        ) : (
          <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="space-y-4 border-b border-border p-5 sm:p-7">
              <div role="radiogroup" aria-label={t('service')} className="hide-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:-mx-7 sm:px-7 lg:flex-wrap">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={service === s.id}
                    onClick={() => {
                      setPicked(s.id);
                      setCity('');
                    }}
                    className={chip(service === s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {cities.length > 1 && (
                <div role="radiogroup" aria-label={t('city')} className="flex flex-wrap items-center gap-1 rounded-lg text-sm">
                  {[['', { label: t('allCities'), n: inService.length }] as const, ...cities].map(([k, c]) => (
                    <button
                      key={k || 'all'}
                      type="button"
                      role="radio"
                      aria-checked={activeCity === k}
                      onClick={() => setCity(k)}
                      className={cn(
                        'h-8 rounded-md px-3 font-medium transition-colors',
                        activeCity === k ? 'bg-brand-800 text-white dark:bg-brand-300 dark:text-brand-950' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {c.label}
                      <span className="ml-1.5 tabular opacity-60">{c.n}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-10 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-14">
              <div>
                {prices.length === 0 ? (
                  <div className="flex h-full min-h-40 flex-col items-start justify-center gap-3">
                    <p className="text-muted-foreground">{t('empty')}</p>
                    <button type="button" onClick={() => setCity('')} className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
                      {t('emptyCta')}
                    </button>
                  </div>
                ) : (
                  <>
                    <dl className={cn('grid gap-4', same ? 'grid-cols-1' : mid != null ? 'grid-cols-3' : 'grid-cols-2')}>
                      {(same
                        ? [
                            {
                              k: t('same', { count: prices.length }),
                              v: low,
                              strong: false,
                            },
                          ]
                        : [{ k: t('from'), v: low, strong: false }, ...(mid != null ? [{ k: t('common'), v: mid, strong: true }] : []), { k: t('upTo'), v: high, strong: false }]
                      ).map((f) => (
                        <div key={f.k} className={cn('flex flex-col-reverse', f.strong && 'text-center')}>
                          <dt className="mt-1 text-[13px] text-muted-foreground sm:text-sm">{f.k}</dt>
                          <dd className={cn('font-display font-bold leading-none tabular', f.strong ? 'text-[1.7rem] sm:text-5xl' : 'text-xl sm:text-3xl')}>
                            {fmt.format(f.v!)}
                            <span className="ml-1 font-sans text-[11px] font-semibold text-muted-foreground sm:text-sm">FCFA</span>
                          </dd>
                        </div>
                      ))}
                    </dl>

                    {/* Règle des prix : un point par prestataire */}
                    <figure className="mt-10" aria-label={t('scale')}>
                      <div className="relative" style={{ height: `${tallest * 18 + 28}px` }}>
                        <span
                          className="absolute bottom-[9px] h-2.5 -translate-y-0 rounded-full bg-sun-300/70 transition-all duration-500 dark:bg-sun-400/30"
                          style={{
                            left: `${pos(low)}%`,
                            width: `max(10px, ${pos(high) - pos(low)}%)`,
                            transform: low === high ? 'translateX(-5px)' : undefined,
                          }}
                          aria-hidden="true"
                        />
                        <span className="absolute inset-x-0 bottom-[13px] h-px bg-border" aria-hidden="true" />
                        {mid != null && (
                          <span
                            className="absolute bottom-0 top-0 w-0 border-l-2 border-dashed border-gray-950 transition-all duration-500 dark:border-white"
                            style={{ left: `${pos(mid)}%` }}
                            aria-hidden="true"
                          />
                        )}
                        {stacks.map(([price, list]) =>
                          list.map((p, i) => {
                            const visible = !activeCity || cityKey(p.city) === activeCity;
                            return (
                              <Link
                                key={p.id}
                                href={`/providers/${p.id}`}
                                title={`${p.name}, ${p.city}, ${fmt.format(price)} FCFA`}
                                aria-label={t('dot', {
                                  name: p.name,
                                  price: `${fmt.format(price)} FCFA`,
                                })}
                                tabIndex={visible ? 0 : -1}
                                className={cn(
                                  'absolute h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-card transition-all duration-500 hover:scale-150 focus-visible:scale-150',
                                  visible ? 'bg-brand-800 dark:bg-brand-300' : 'pointer-events-none bg-gray-300 dark:bg-gray-700',
                                )}
                                style={{
                                  left: `${pos(price)}%`,
                                  bottom: `${7 + i * 18}px`,
                                }}
                              />
                            );
                          }),
                        )}
                      </div>
                      <div className="relative mt-2 h-5 text-[12px] tabular text-muted-foreground" aria-hidden="true">
                        {ticks.map((v, i) => (
                          <span
                            key={v}
                            className={cn('absolute', i === 0 ? 'left-0' : i === ticks.length - 1 ? 'right-0' : '-translate-x-1/2')}
                            style={i === 0 || i === ticks.length - 1 ? undefined : { left: `${pos(v)}%` }}
                          >
                            {v >= 1000 ? `${fmt.format(v / 1000)}k` : v}
                          </span>
                        ))}
                      </div>
                      <figcaption className="mt-4 text-[13px] text-muted-foreground">
                        {t('basedOn', { count: prices.length })}
                        {activeCity ? `, ${cities.find(([k]) => k === activeCity)?.[1].label}` : ''}.{prices.length < 3 && ` ${t('fewData')}`}
                      </figcaption>
                    </figure>
                  </>
                )}
              </div>

              <div className="flex flex-col justify-between gap-6 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                <p className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-700 dark:text-brand-300" />
                  {t('note')}
                </p>
                {prices.length > 0 && (
                  <Link
                    href={searchHref}
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-sun-400 px-5 text-[15px] font-bold text-gray-950 shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)] transition-colors hover:bg-sun-300"
                  >
                    <span className="truncate">
                      {t('see', { count: prices.length })}
                      <span className="sr-only">, {serviceLabel}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
