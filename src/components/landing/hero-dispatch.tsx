'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, RotateCcw, Star } from 'lucide-react';
import { cn } from '@/utils/cn';

/*
  Le côté droit du hero : une demande part du point jaune, les prestataires du quartier
  répondent, le plus proche est choisi et son trajet se dessine. La scène suit le métier
  et la ville choisis dans la phrase de gauche.
*/

export const HERO_TRADES = [
  'plumbing',
  'electricity',
  'airConditioning',
  'beauty',
  'cleaning',
  'carpentry',
  'painting',
  'it',
  'tutoring',
  'moving',
  'photography',
  'catering',
] as const;
export type HeroTrade = (typeof HERO_TRADES)[number];

const quarters: Record<string, string[]> = {
  Douala: ['Akwa', 'Bonapriso', 'Deïdo', 'Bonamoussadi'],
  Yaounde: ['Bastos', 'Mvan', 'Essos', 'Biyem-Assi'],
  Bafoussam: ['Tamdja', 'Djeleng', 'Kouogouo', 'Banengo'],
  Bamenda: ['Nkwen', 'Up Station', 'Mankon', 'Ntarinkon'],
  Garoua: ['Yelwa', 'Roumdé Adjia', 'Marouaré', 'Poumpoumré'],
  Maroua: ['Domayo', 'Kakataré', 'Doualaré', 'Pitoaré'],
  Limbe: ['Down Beach', 'Bota', 'Mile 4', 'New Town'],
  Buea: ['Molyko', 'Great Soppo', 'Bonduma', 'Mile 17'],
  Kribi: ['Mpangou', 'Dombé', 'Afan Mabé', 'Talla'],
  Bertoua: ['Tigaza', 'Nkolbikon', 'Mokolo', 'Enia'],
  Ebolowa: ['Angalé', 'Mekalat', 'Abang', 'Nko’ovos'],
  Ngaoundere: ['Dang', 'Baladji', 'Joli Soir', 'Mbideng'],
};
const coastal = new Set(['Douala', 'Limbe', 'Kribi']);

const startingPrice: Record<HeroTrade, number> = {
  plumbing: 5000,
  electricity: 7500,
  airConditioning: 10000,
  beauty: 3000,
  cleaning: 6000,
  carpentry: 8000,
  painting: 15000,
  it: 5000,
  tutoring: 4000,
  moving: 25000,
  photography: 15000,
  catering: 20000,
};

const people = [
  'Paul Kamga',
  'Aïcha Bello',
  'Joseph Essomba',
  'Marthe Ndzié',
  'Brice Ngono',
  'Sandrine Fotso',
  'Hervé Tchinda',
  'Clarisse Ebogo',
  'Yannick Mbella',
  'Arnaud Njoya',
];

// Repère SVG 400 x 300 : le demandeur au centre, trois prestataires autour.
const USER = { x: 205, y: 158 };
const PINS = [
  { x: 146, y: 122, km: 1.2, minutes: 12, rating: 4.9, priceFactor: 1 },
  { x: 282, y: 226, km: 1.8, minutes: 18, rating: 4.8, priceFactor: 1.2 },
  { x: 312, y: 96, km: 2.6, minutes: 25, rating: 4.7, priceFactor: 0.9 },
];
const ROUTE = 'M146 122 C 160 136, 174 142, 186 148 S 198 154, 205 158';

/** Étapes de la scène, en millisecondes depuis le départ. */
const TIMELINE = [0, 900, 1500, 2100, 2700, 4300];
const LOOP = 9500;
const FINAL_STEP = TIMELINE.length - 1;

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    mq.addEventListener('change', update);
    queueMicrotask(update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

function Streets({ water }: { water: boolean }) {
  return (
    <g aria-hidden="true">
      {water && (
        <>
          <path d="M0 0 H74 C 58 62, 92 128, 56 196 C 40 236, 52 270, 34 300 H0 Z" className="fill-brand-900" />
          <path d="M8 40 q 8 -4 16 0 t 16 0 M14 120 q 8 -4 16 0 t 16 0 M6 220 q 8 -4 16 0 t 16 0" className="fill-none stroke-brand-700/60" strokeWidth="1.2" />
        </>
      )}
      {/* rues secondaires */}
      <g className="fill-none stroke-white/[0.06]" strokeWidth="1">
        {[40, 75, 190, 265].map((y) => (
          <path key={`h${y}`} d={`M0 ${y} C 120 ${y - 8}, 260 ${y + 10}, 400 ${y - 4}`} />
        ))}
        {[110, 175, 240, 345].map((x) => (
          <path key={`v${x}`} d={`M${x} 0 C ${x - 10} 110, ${x + 12} 200, ${x - 4} 300`} />
        ))}
      </g>
      {/* grands axes */}
      <g className="fill-none stroke-white/[0.13]" strokeWidth="3" strokeLinecap="round">
        <path d="M0 128 C 90 112, 160 152, 250 140 S 360 108, 400 122" />
        <path d="M76 0 C 96 82, 128 168, 146 300" />
        <path d="M302 0 C 284 92, 252 172, 272 300" />
        <path d="M0 238 C 120 214, 222 252, 400 222" />
      </g>
      {/* rond-point */}
      <circle cx="250" cy="140" r="9" className="fill-none stroke-white/[0.13]" strokeWidth="3" />
    </g>
  );
}

export function HeroDispatch({ trade, city, cityLabel }: { trade: HeroTrade; city: string; cityLabel: string }) {
  const t = useTranslations('landing.hero.live');
  const tPro = useTranslations('landing.categories.items');
  const locale = useLocale();
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  const [run, setRun] = useState(0);

  // La scène redémarre quand le métier, la ville ou le bouton « Rejouer » changent
  useEffect(() => {
    if (reduced) {
      queueMicrotask(() => setStep(FINAL_STEP));
      return;
    }
    const timers = TIMELINE.map((ms, i) => window.setTimeout(() => setStep(i), ms));
    timers.push(window.setTimeout(() => setRun((r) => r + 1), LOOP));
    return () => timers.forEach(window.clearTimeout);
  }, [trade, city, run, reduced]);

  const area = (quarters[city] ?? quarters.Douala)[0];
  const tradeIndex = HERO_TRADES.indexOf(trade);
  const pros = PINS.map((pin, i) => {
    const name = people[(tradeIndex * 3 + i) % people.length];
    return { ...pin, name, initials: initials(name), quarter: (quarters[city] ?? quarters.Douala)[i + 1] };
  });
  const price = new Intl.NumberFormat(locale);
  const answered = Math.max(0, Math.min(3, step - 1));
  const chosen = step >= FINAL_STEP;

  const status = chosen
    ? t('statusChosen', { name: pros[0].name, minutes: pros[0].minutes })
    : answered > 0
      ? t('statusAnswers', { count: answered, seconds: Math.max(1, Math.round(TIMELINE[step] / 1000)) })
      : t('statusSending', { city: cityLabel });

  return (
    <div className="relative overflow-hidden rounded-[22px] bg-brand-950 text-white shadow-[0_40px_80px_-40px_rgb(6_31_22/0.65)] ring-1 ring-white/10">
      <p className="sr-only">{t('srSummary', { request: t(`requests.${trade}`), area })}</p>

      {/* barre d'état */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5" aria-hidden="true">
        <span className="flex min-w-0 items-center gap-2.5 text-[13px] font-medium">
          <span className="relative flex h-2 w-2 shrink-0">
            {!reduced && <span className="absolute inset-0 animate-ping rounded-full bg-sun-400 opacity-60" />}
            <span className="relative h-2 w-2 rounded-full bg-sun-400" />
          </span>
          <span key={status} className="truncate text-brand-100 motion-safe:animate-[fade-in_300ms_ease-out]">
            {status}
          </span>
        </span>
        <span className="shrink-0 text-[12px] text-brand-200/60">{t('label')}</span>
      </div>

      {/* plan du quartier */}
      <div className="relative" aria-hidden="true">
        <svg viewBox="0 0 400 300" className="block h-auto w-full">
          <Streets water={coastal.has(city)} />

          {/* quartiers */}
          {[
            { x: 300, y: 36 },
            { x: 104, y: 288 },
            { x: 330, y: 280 },
          ].map((p, i) => (
            <text key={i} x={p.x} y={p.y} textAnchor="middle" className="fill-brand-200/40 font-sans" style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.02em' }}>
              {(quarters[city] ?? quarters.Douala)[i + 1]}
            </text>
          ))}

          {/* trajet du prestataire choisi */}
          <path
            d={ROUTE}
            className="fill-none stroke-sun-400 transition-[stroke-dashoffset] duration-[1400ms] ease-out"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="140"
            strokeDashoffset={chosen ? 0 : 140}
          />

          {/* ondes de la demande */}
          {!reduced &&
            !chosen &&
            [0, 1, 2].map((i) => (
              <circle
                key={`${run}-${i}`}
                cx={USER.x}
                cy={USER.y}
                r="10"
                className="origin-center fill-none stroke-sun-400 [transform-box:fill-box] motion-safe:animate-[dispatch-ripple_2.4s_ease-out_infinite]"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                style={{ animationDelay: `${i * 0.8}s` }}
              />
            ))}

          {/* prestataires */}
          {pros.map((p, i) => {
            const visible = step >= i + 1;
            const isChosen = chosen && i === 0;
            return (
              <g
                key={p.name}
                className="transition-[opacity,transform] duration-500 ease-out [transform-box:fill-box]"
                style={{ opacity: visible ? (chosen && !isChosen ? 0.45 : 1) : 0, transform: visible ? 'scale(1)' : 'scale(0.6)', transformOrigin: `${p.x}px ${p.y}px` }}
              >
                <circle cx={p.x} cy={p.y} r="17" className={cn(isChosen ? 'fill-sun-400' : 'fill-white')} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" className="fill-brand-950 font-display" style={{ fontSize: 11, fontWeight: 800 }}>
                  {p.initials}
                </text>
                <g transform={`translate(${p.x + 21} ${p.y - 9})`}>
                  <rect width="44" height="18" rx="9" className="fill-brand-900/90 stroke-white/10" />
                  <text x="22" y="12.5" textAnchor="middle" className="fill-brand-100 font-sans" style={{ fontSize: 9, fontWeight: 600 }}>
                    {p.km.toLocaleString(locale)} km
                  </text>
                </g>
              </g>
            );
          })}

          {/* demandeur */}
          <circle cx={USER.x} cy={USER.y} r="11" className="fill-sun-400 stroke-brand-950" strokeWidth="3" />
          <circle cx={USER.x} cy={USER.y} r="3.5" className="fill-brand-950" />
        </svg>

        {/* la demande, posée sur le plan */}
        <div className="absolute left-4 top-4 max-w-[62%] rounded-xl bg-white/95 px-3.5 py-2.5 text-gray-950 shadow-lg shadow-black/20">
          <p className="text-[11px] font-medium text-gray-500">
            {t('yourRequest')}, {tPro(`${trade}.label`)}
          </p>
          <p key={`${trade}-${city}`} className="mt-0.5 text-[14px] font-semibold leading-snug motion-safe:animate-[fade-in_300ms_ease-out]">
            {t(`requests.${trade}`)} <span className="font-normal text-gray-500">{t('at', { area })}</span>
          </p>
        </div>
      </div>

      {/* réponses */}
      <ul className="space-y-2 border-t border-white/10 bg-brand-950 p-3" aria-hidden="true">
        {pros.map((p, i) => {
          const visible = answered > i;
          const isChosen = chosen && i === 0;
          return (
            <li
              key={p.name}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-500 ease-out',
                visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
                isChosen ? 'bg-sun-400 text-gray-950' : 'bg-white/[0.06]',
                chosen && !isChosen && 'opacity-50'
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[12px] font-bold',
                  isChosen ? 'bg-gray-950 text-sun-300' : 'bg-white text-brand-950'
                )}
              >
                {p.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[14px] font-semibold">
                  <span className="truncate">{p.name}</span>
                  <span className={cn('flex shrink-0 items-center gap-0.5 text-[12px] font-semibold', isChosen ? 'text-gray-950' : 'text-sun-300')}>
                    <Star className="h-3 w-3 fill-current" />
                    {p.rating.toLocaleString(locale)}
                  </span>
                </span>
                <span className={cn('block truncate text-[12px]', isChosen ? 'text-gray-950/70' : 'text-brand-100/60')}>
                  {p.quarter}, {t('respondsIn', { minutes: p.minutes })}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className={cn('block text-[12px] font-semibold tabular', isChosen ? 'text-gray-950' : 'text-white')}>
                  {t('from', { price: `${price.format(Math.round((startingPrice[trade] * p.priceFactor) / 500) * 500)} FCFA` })}
                </span>
                <span
                  className={cn(
                    'mt-1 inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-bold',
                    isChosen ? 'bg-gray-950 text-sun-300' : 'bg-white/10 text-white'
                  )}
                >
                  {isChosen && <Check className="h-3 w-3" strokeWidth={3} />}
                  {isChosen ? t('chosen') : t('choose')}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      {chosen && !reduced && (
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="absolute right-3 top-[58px] flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label={t('replay')}
          title={t('replay')}
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
