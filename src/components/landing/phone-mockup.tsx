'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bell,
  CalendarCheck,
  Check,
  ChevronLeft,
  CreditCard,
  Home,
  MapPin,
  MessageCircle,
  Search,
  Smartphone,
  Star,
  User,
  Wrench,
  Zap,
  Scissors,
  AirVent,
  PaintRoller,
} from 'lucide-react';
import { cn } from '@/utils/cn';

const SCREEN_COUNT = 3;

/* ---------- Barre d'état et barre d'onglets communes ---------- */

function StatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <div className={cn('flex h-9 items-center justify-between px-6 pt-1 text-[10px] font-semibold', dark ? 'text-white' : 'text-gray-950')}>
      <span className="tabular">9:41</span>
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="flex items-end gap-[1.5px]">
          {[3, 5, 7, 9].map((h) => (
            <span key={h} className="w-[2.5px] rounded-sm bg-current" style={{ height: h }} />
          ))}
        </span>
        <span className="ml-1 h-[9px] w-[18px] rounded-[3px] border border-current p-[1px]">
          <span className="block h-full w-3/4 rounded-[1px] bg-current" />
        </span>
      </span>
    </div>
  );
}

function TabBar({ active, labels }: { active: number; labels: string[] }) {
  const icons = [Home, Search, MessageCircle, User];
  return (
    <div className="absolute inset-x-0 bottom-0 grid grid-cols-4 border-t border-gray-200 bg-white px-2 pb-5 pt-2">
      {icons.map((Icon, i) => (
        <span key={i} className={cn('flex flex-col items-center gap-0.5 text-[8px] font-medium', i === active ? 'text-brand-700' : 'text-gray-400')}>
          <Icon className="h-[15px] w-[15px]" strokeWidth={i === active ? 2.4 : 1.8} />
          {labels[i]}
        </span>
      ))}
    </div>
  );
}

/* ---------- Écran 1 : accueil ---------- */

function HomeScreen() {
  const t = useTranslations('landing.app.screens.home');
  const pros = [
    { initials: 'PK', name: 'Paul Kamga', area: 'Bastos', rating: '4,9', min: 12 },
    { initials: 'JE', name: 'Joseph Essomba', area: 'Mvan', rating: '4,8', min: 25 },
  ];
  const trades = [Wrench, Zap, Scissors, AirVent, PaintRoller];
  return (
    <div className="relative h-full bg-[#f6f7f5] text-gray-950">
      <StatusBar />
      <div className="flex items-center justify-between px-5 pt-2">
        <span className="text-[11px] text-gray-500">{t('greeting')}</span>
        <Bell className="h-4 w-4 text-gray-700" />
      </div>
      <div className="px-5 pt-3 font-display text-[22px] font-bold leading-[1.1] tracking-[-0.03em]">
        {t('ask')}
        <br />
        <span className="bg-[linear-gradient(transparent_60%,#ffd447_60%,#ffd447_92%,transparent_92%)]">{t('trade')}</span>
        <br />
        {t('city')}
      </div>
      <div className="mx-5 mt-4 flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#fcc419] text-[11px] font-bold shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)]">
        <Search className="h-3.5 w-3.5" strokeWidth={2.6} />
        {t('search')}
      </div>
      <div className="mt-4 flex gap-2 px-5">
        {trades.map((Icon, i) => (
          <span key={i} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef6f1] text-[#12553b]">
            <Icon className="h-4 w-4" strokeWidth={1.8} />
          </span>
        ))}
      </div>
      <p className="px-5 pt-4 text-[10px] font-semibold">{t('nearby')}</p>
      <div className="mx-5 mt-2 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
        {pros.map((p) => (
          <div key={p.name} className="flex items-center gap-2.5 px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d6eadf] font-display text-[10px] font-bold text-[#0f4431]">{p.initials}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[10px] font-semibold">{p.name}</span>
              <span className="flex items-center gap-0.5 text-[9px] text-gray-500">
                <MapPin className="h-2.5 w-2.5" />
                {p.area}, {p.min} min
              </span>
            </span>
            <span className="flex items-center gap-0.5 text-[10px] font-semibold">
              <Star className="h-2.5 w-2.5 fill-[#fcc419] text-[#fcc419]" />
              {p.rating}
            </span>
          </div>
        ))}
      </div>
      <TabBar active={0} labels={t.raw('tabs') as string[]} />
    </div>
  );
}

/* ---------- Écran 2 : profil prestataire ---------- */

function ProfileScreen() {
  const t = useTranslations('landing.app.screens.profile');
  const tabs = useTranslations('landing.app.screens.home').raw('tabs') as string[];
  return (
    <div className="relative h-full bg-white text-gray-950">
      <div className="bg-[#0c3727] pb-12">
        <StatusBar dark />
        <div className="flex items-center justify-between px-4 pt-1 text-white">
          <ChevronLeft className="h-4 w-4" />
          <MessageCircle className="h-4 w-4" />
        </div>
      </div>
      <div className="-mt-9 flex flex-col items-center px-5">
        <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white bg-[#d6eadf] font-display text-xl font-bold text-[#0f4431]">
          PK
        </span>
        <p className="mt-2 font-display text-[17px] font-bold tracking-[-0.02em]">{t('name')}</p>
        <p className="text-[10px] text-gray-500">{t('trade')}</p>
        <p className="mt-1.5 flex items-center gap-1 text-[10px]">
          <Star className="h-3 w-3 fill-[#fcc419] text-[#fcc419]" />
          <span className="font-semibold">4,9</span>
          <span className="text-gray-500">({t('reviews')})</span>
        </p>
      </div>
      <p className="mx-5 mt-4 rounded-lg bg-[#f6f7f5] p-3 text-[10px] leading-relaxed text-gray-700">{t('about')}</p>
      <div className="mx-5 mt-4 flex items-end justify-between border-t border-gray-100 pt-3">
        <span>
          <span className="block text-[9px] text-gray-500">{t('from')}</span>
          <span className="font-display text-[16px] font-bold">7 500 FCFA</span>
        </span>
        <span className="flex items-center gap-1 text-[9px] font-semibold text-[#176848]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#267c5a]" />
          12 min
        </span>
      </div>
      <div className="mx-5 mt-4 grid grid-cols-[1fr_auto] gap-2">
        <span className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#fcc419] text-[11px] font-bold shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)]">
          <CalendarCheck className="h-3.5 w-3.5" />
          {t('book')}
        </span>
        <span className="flex h-9 items-center justify-center rounded-lg border border-gray-200 px-3 text-[11px] font-semibold">{t('message')}</span>
      </div>
      <TabBar active={1} labels={tabs} />
    </div>
  );
}

/* ---------- Écran 3 : paiement Mobile Money ---------- */

function PayScreen() {
  const t = useTranslations('landing.app.screens.pay');
  const tabs = useTranslations('landing.app.screens.home').raw('tabs') as string[];
  const methods = [
    { label: t('orange'), icon: Smartphone, selected: true },
    { label: t('mtn'), icon: Smartphone, selected: false },
    { label: t('card'), icon: CreditCard, selected: false },
  ];
  return (
    <div className="relative h-full bg-[#f6f7f5] text-gray-950">
      <StatusBar />
      <div className="flex items-center gap-2 px-4 pt-1">
        <ChevronLeft className="h-4 w-4" />
        <span className="text-[12px] font-semibold">{t('title')}</span>
      </div>
      <div className="mx-5 mt-4 rounded-xl border border-gray-200 bg-white p-3.5">
        <p className="text-[10px] text-gray-500">{t('service')}</p>
        <p className="text-[10px] font-medium">Paul Kamga</p>
        <div className="mt-3 flex items-end justify-between border-t border-gray-100 pt-2.5">
          <span className="text-[10px] text-gray-500">{t('total')}</span>
          <span className="font-display text-[18px] font-bold">7 500 FCFA</span>
        </div>
      </div>
      <p className="px-5 pt-4 text-[10px] font-semibold">{t('method')}</p>
      <div className="mx-5 mt-2 space-y-1.5">
        {methods.map((m) => (
          <div
            key={m.label}
            className={cn(
              'flex items-center gap-2.5 rounded-lg border bg-white px-3 py-2.5 text-[10px] font-medium',
              m.selected ? 'border-[#176848] ring-1 ring-[#176848]' : 'border-gray-200'
            )}
          >
            <m.icon className="h-3.5 w-3.5 text-gray-500" />
            <span className="flex-1">{m.label}</span>
            <span className={cn('flex h-3.5 w-3.5 items-center justify-center rounded-full border', m.selected ? 'border-[#176848] bg-[#176848]' : 'border-gray-300')}>
              {m.selected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
            </span>
          </div>
        ))}
      </div>
      <div className="mx-5 mt-4 flex h-9 items-center justify-center rounded-lg bg-[#0c3727] text-[11px] font-bold text-white">{t('confirm')}</div>
      <p className="mt-3 flex items-center justify-center gap-1 text-[9px] font-medium text-[#176848]">
        <Check className="h-3 w-3" strokeWidth={3} />
        {t('done')}
      </p>
      <TabBar active={2} labels={tabs} />
    </div>
  );
}

const screens = [HomeScreen, ProfileScreen, PayScreen];

/* ---------- Le téléphone ---------- */

const SCREEN_DURATION = 4000;

export function PhoneMockup() {
  const t = useTranslations('landing.app');
  const [screen, setScreen] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    // Pas de défilement automatique si le visiteur a demandé moins d'animations
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setScreen((s) => (s + 1) % SCREEN_COUNT), SCREEN_DURATION);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <figure className="relative mx-auto flex w-full max-w-[360px] flex-col items-center" aria-label={t('screens.label')}>
      <div className="relative h-[540px] w-[264px] rounded-[46px] bg-gray-950 p-[10px] shadow-[inset_0_0_0_1.5px_#3d443d,0_40px_70px_-30px_rgb(12_55_39/0.5)] sm:h-[580px] sm:w-[284px]">
        <div className="relative h-full w-full overflow-hidden rounded-[37px] bg-white">
          {screens.map((Screen, i) => (
            <div
              key={i}
              aria-hidden={i !== screen}
              className={cn('absolute inset-0 transition-opacity duration-500 ease-out', i === screen ? 'opacity-100' : 'opacity-0')}
            >
              <Screen />
            </div>
          ))}
          <span className="absolute left-1/2 top-2 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-gray-950" aria-hidden="true" />
          <span className="absolute bottom-1.5 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-gray-950/80" aria-hidden="true" />
        </div>
        {/* boutons latéraux */}
        <span className="absolute -left-[3px] top-[110px] h-8 w-[3px] rounded-l bg-gray-800" aria-hidden="true" />
        <span className="absolute -left-[3px] top-[160px] h-14 w-[3px] rounded-l bg-gray-800" aria-hidden="true" />
        <span className="absolute -right-[3px] top-[140px] h-20 w-[3px] rounded-r bg-gray-800" aria-hidden="true" />
      </div>

      <figcaption className="mt-7 flex items-center gap-3">
        <span className="flex gap-1">
          {screens.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setScreen(i)}
              aria-label={`${t('screens.label')} ${i + 1}/${SCREEN_COUNT}`}
              aria-current={i === screen}
              className="flex h-6 items-center px-0.5"
            >
              <span className={cn('h-1.5 rounded-full transition-all duration-300', i === screen ? 'w-5 bg-brand-700 dark:bg-brand-300' : 'w-1.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700')} />
            </button>
          ))}
        </span>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="phone-toggle rounded-md px-2 py-1 text-[13px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {paused ? t('play') : t('pause')}
        </button>
      </figcaption>
    </figure>
  );
}
