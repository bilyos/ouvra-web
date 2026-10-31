'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { HeroDispatch, HERO_TRADES, type HeroTrade } from './hero-dispatch';

const cities = [
  { value: 'Douala', label: 'Douala' },
  { value: 'Yaounde', label: 'Yaoundé' },
  { value: 'Bafoussam', label: 'Bafoussam' },
  { value: 'Bamenda', label: 'Bamenda' },
  { value: 'Garoua', label: 'Garoua' },
  { value: 'Maroua', label: 'Maroua' },
  { value: 'Limbe', label: 'Limbé' },
  { value: 'Buea', label: 'Buea' },
  { value: 'Kribi', label: 'Kribi' },
  { value: 'Bertoua', label: 'Bertoua' },
  { value: 'Ebolowa', label: 'Ebolowa' },
  { value: 'Ngaoundere', label: 'Ngaoundéré' },
];

/** Un champ natif invisible posé sur le mot affiché : le sélecteur du téléphone s'ouvre, le texte reste de la typographie. */
function InlineSelect({
  label,
  value,
  display,
  onChange,
  children,
}: {
  label: string;
  value: string;
  display: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <span className="relative inline-flex items-baseline rounded-md focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-ring">
      <span className="marker pr-1" aria-hidden="true">
        {display}
      </span>
      <ChevronDown aria-hidden="true" className="ml-1 h-[0.45em] w-[0.45em] shrink-0 self-center text-brand-700 dark:text-brand-300" strokeWidth={3} />
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full cursor-pointer appearance-none opacity-0"
      >
        {children}
      </select>
    </span>
  );
}

export function HeroSection() {
  const t = useTranslations('landing.hero');
  const tCat = useTranslations('landing.categories.items');
  const router = useRouter();
  const [trade, setTrade] = useState<HeroTrade>('plumbing');
  const [city, setCity] = useState('Douala');

  const cityLabel = cities.find((c) => c.value === city)?.label ?? city;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ category: tCat(`${trade}.label`), q: city });
    router.push(`/search?${params.toString()}`);
  };

  const popular = t.raw('popularItems') as string[];

  return (
    <section className="relative border-b border-border bg-paper">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="lg:col-span-7">
          <h1 className="max-w-md font-sans text-lg font-medium tracking-normal text-muted-foreground sm:text-xl">{t('title')}</h1>

          <form onSubmit={submit} className="mt-6" role="search">
            <p className="font-display text-[2.6rem] font-bold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-[4.5rem]">
              {t('sentenceStart')}{' '}
              <InlineSelect label={t('tradeLabel')} value={trade} display={t(`trades.${trade}`)} onChange={(v) => setTrade(v as typeof trade)}>
                {HERO_TRADES.map((k) => (
                  <option key={k} value={k}>
                    {t(`trades.${k}`)}
                  </option>
                ))}
              </InlineSelect>{' '}
              <br className="hidden sm:block" />
              {t('sentenceIn')}{' '}
              <InlineSelect label={t('cityLabel')} value={city} display={cityLabel} onChange={setCity}>
                {cities.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </InlineSelect>
            </p>
            <p className="mt-4 text-sm text-muted-foreground">{t('hint')}</p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <button
                type="submit"
                className="inline-flex h-14 items-center justify-center gap-2.5 rounded-xl bg-sun-400 px-8 text-base font-bold text-gray-950 shadow-[inset_0_-3px_0_rgb(0_0_0/0.14)] transition-colors hover:bg-sun-300 active:translate-y-px"
              >
                <Search className="h-5 w-5" strokeWidth={2.5} />
                {t('search')}
              </button>
              <p className="max-w-xs text-sm leading-snug text-muted-foreground">{t('payment')}</p>
            </div>
          </form>

          <div className="mt-12">
            <h2 className="font-sans text-sm font-medium tracking-normal text-muted-foreground">{t('popular')}</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {popular.map((term) => (
                <li key={term}>
                  <Link
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="inline-flex h-9 items-center rounded-full border border-border bg-card px-4 text-sm text-foreground/85 transition-colors hover:border-brand-600 hover:text-brand-800 dark:hover:border-brand-300 dark:hover:text-brand-200"
                  >
                    {term}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-5">
          <HeroDispatch trade={trade} city={city} cityLabel={cityLabel} />
        </div>
      </div>
    </section>
  );
}
