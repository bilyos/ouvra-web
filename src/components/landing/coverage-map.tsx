'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/utils/cn';
import { CAMEROON_REGIONS, CAMEROON_VIEWBOX } from './cameroon-regions';

const totalProviders = CAMEROON_REGIONS.reduce((s, r) => s + r.providers, 0);
const maxProviders = Math.max(...CAMEROON_REGIONS.map((r) => r.providers));

/** Quatre paliers de densité : la carte se lit comme une carte choroplèthe, pas comme une décoration. */
function tier(providers: number) {
  const ratio = providers / maxProviders;
  if (ratio > 0.75) return 3;
  if (ratio > 0.4) return 2;
  if (ratio > 0.18) return 1;
  return 0;
}

const fills = [
  'fill-brand-100 dark:fill-brand-900',
  'fill-brand-300 dark:fill-brand-700',
  'fill-brand-500 dark:fill-brand-500',
  'fill-brand-800 dark:fill-brand-300',
];
const labelFills = ['fill-brand-900 dark:fill-brand-100', 'fill-brand-950 dark:fill-white', 'fill-white', 'fill-white dark:fill-brand-950'];

// Marge à gauche de la carte, côté océan, pour les régions trop étroites pour porter leur nom.
const MARGIN = 84;
const callouts: Record<string, { x: number; y: number }> = {
  'CM-SW': { x: -MARGIN + 4, y: 418 },
  'CM-LT': { x: -MARGIN + 4, y: 486 },
};
const CHAR_WIDTH = 5.6;

/** Décale le nom sous le point du chef-lieu quand les deux se chevauchent. */
function labelPosition(region: (typeof CAMEROON_REGIONS)[number]) {
  const { label, capitalPoint } = region;
  const halfWidth = (region.name.length * CHAR_WIDTH) / 2 + 4;
  const overlaps = Math.abs(label.x - capitalPoint.x) < halfWidth && Math.abs(label.y - 3.5 - capitalPoint.y) < 10;
  return overlaps ? { x: label.x, y: capitalPoint.y + 15 } : label;
}

export function CoverageMapSection() {
  const t = useTranslations('landing.coverage');
  const locale = useLocale();
  const n = new Intl.NumberFormat(locale);
  const [active, setActive] = useState<string | null>(null);
  const sorted = [...CAMEROON_REGIONS].sort((a, b) => b.providers - a.providers);
  const activeRegion = CAMEROON_REGIONS.find((r) => r.iso === active);

  return (
    <section className="py-20 sm:py-28" aria-labelledby="coverage-title">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] items-start gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-5">
          <h2 id="coverage-title" className="text-3xl font-bold sm:text-[2.6rem] sm:leading-[1.1]">
            {t('title')}
          </h2>
          <p className="mt-4 max-w-md text-[17px] text-muted-foreground">{t('subtitle')}</p>

          <p className="mt-10 font-display text-5xl font-bold tracking-[-0.03em] tabular">{n.format(totalProviders)}</p>
          <p className="mt-1 text-[15px] text-muted-foreground">{t('verifiedProviders')}</p>

          <ul className="mt-8 border-t border-border">
            {sorted.map((region) => (
              <li key={region.iso}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(region.iso)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(region.iso)}
                  onBlur={() => setActive(null)}
                  aria-pressed={active === region.iso}
                  className={cn(
                    'grid w-full grid-cols-[1fr_auto] items-center gap-x-4 border-b border-border px-2 py-2.5 text-left transition-colors',
                    active === region.iso && 'bg-paper'
                  )}
                >
                  <span className="text-[15px]">
                    <span className="font-semibold">{region.name}</span>
                    <span className="text-muted-foreground">, {region.capital}</span>
                  </span>
                  <span className="text-sm text-muted-foreground tabular">
                    {n.format(region.providers)} {t('providers')}
                  </span>
                  <span className="col-span-2 mt-1.5 block h-1 rounded-full bg-muted" aria-hidden="true">
                    <span
                      className={cn('block h-full rounded-full transition-colors', active === region.iso ? 'bg-sun-400' : 'bg-brand-600 dark:bg-brand-400')}
                      style={{ width: `${(region.providers / maxProviders) * 100}%` }}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <figure className="lg:sticky lg:top-24 lg:col-span-7">
          <svg
            viewBox={`${-MARGIN} 0 ${CAMEROON_VIEWBOX.width + MARGIN} ${CAMEROON_VIEWBOX.height}`}
            className="mx-auto h-auto w-full max-w-[540px]"
            role="img"
            aria-labelledby="coverage-map-title"
          >
            <title id="coverage-map-title">{t('mapLabel')}</title>

            {CAMEROON_REGIONS.map((region) => {
              const isActive = active === region.iso;
              return (
                <path
                  key={region.iso}
                  d={region.d}
                  onMouseEnter={() => setActive(region.iso)}
                  onMouseLeave={() => setActive(null)}
                  className={cn(
                    'cursor-pointer stroke-background transition-[fill,opacity] duration-150',
                    isActive ? 'fill-sun-400' : fills[tier(region.providers)],
                    active && !isActive && 'opacity-55'
                  )}
                  strokeWidth={1.6}
                  strokeLinejoin="round"
                />
              );
            })}

            {/* chefs-lieux */}
            {CAMEROON_REGIONS.map((region) => (
              <circle
                key={`${region.iso}-cap`}
                cx={region.capitalPoint.x}
                cy={region.capitalPoint.y}
                r={active === region.iso ? 3.2 : 2.2}
                className="pointer-events-none fill-gray-950 stroke-white dark:fill-white dark:stroke-gray-950"
                strokeWidth={1}
              />
            ))}

            {/* noms des régions */}
            {CAMEROON_REGIONS.map((region) => {
              const isActive = active === region.iso;
              const callout = callouts[region.iso];
              const pos = callout ?? labelPosition(region);
              const { x, y } = pos;
              const fillClass = callout
                ? 'fill-foreground'
                : isActive
                  ? 'fill-gray-950'
                  : labelFills[tier(region.providers)];
              return (
                <g key={`${region.iso}-label`} className="pointer-events-none select-none">
                  {callout && (
                    <line
                      x1={x + region.name.length * CHAR_WIDTH + 4}
                      y1={y - 3.5}
                      x2={region.label.x}
                      y2={region.label.y}
                      className="stroke-foreground/50"
                      strokeWidth={0.75}
                    />
                  )}
                  <text
                    x={x}
                    y={y}
                    textAnchor={callout ? 'start' : 'middle'}
                    className={cn('font-sans', fillClass)}
                    style={{ fontSize: 10, fontWeight: isActive ? 800 : 700, letterSpacing: '-0.01em' }}
                  >
                    {region.name}
                  </text>
                </g>
              );
            })}
          </svg>

          <figcaption className="mx-auto mt-6 flex max-w-[540px] flex-wrap items-center justify-between gap-4 text-[13px] text-muted-foreground">
            <span className="min-h-5 font-medium text-foreground" aria-live="polite">
              {activeRegion
                ? `${activeRegion.name}, ${activeRegion.capital} : ${n.format(activeRegion.providers)} ${t('providers')}`
                : t('legendHint')}
            </span>
            <span className="flex items-center gap-2">
              {t('legendLow')}
              {fills.map((f, i) => (
                <svg key={i} width="14" height="14" aria-hidden="true">
                  <rect width="14" height="14" rx="3" className={f} />
                </svg>
              ))}
              {t('legendHigh')}
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
