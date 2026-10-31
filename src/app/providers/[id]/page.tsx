'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Clock, Heart, Loader2, MapPin, MessageSquare, Share2, ShieldCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { categoryApi, chatApi, favoriteApi, providerApi } from '@/services/api';
import { useAuthStore } from '@/stores/auth-store';
import { formatDistance, formatPrice, getInitials } from '@/utils/format';
import { cn } from '@/utils/cn';
import { RequestSheet } from '@/components/provider-profile/request-sheet';
import { WorkGallery } from '@/components/provider-profile/work-gallery';
import { ReviewsSection, Stars } from '@/components/provider-profile/reviews-section';

/** Le bandeau reprend le plan de quartier de la marque, avec un repère jaune. */
function CoverBand() {
  return (
    <div className="relative h-40 overflow-hidden bg-brand-900 sm:h-48" aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full text-white/[0.09]" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="currentColor" strokeLinecap="round">
          <g strokeWidth="1.5">
            {[30, 70, 150, 185].map((y) => (
              <path key={y} d={`M0 ${y} C 300 ${y - 14}, 820 ${y + 16}, 1200 ${y - 6}`} />
            ))}
            {[90, 250, 520, 700, 980, 1120].map((x) => (
              <path key={x} d={`M${x} 0 C ${x - 14} 70, ${x + 16} 140, ${x - 6} 200`} />
            ))}
          </g>
          <g strokeWidth="7">
            <path d="M0 110 C 260 82, 470 140, 760 118 S 1060 76, 1200 94" />
            <path d="M380 0 C 410 70, 350 140, 400 200" />
            <path d="M860 0 C 830 70, 800 140, 850 200" />
          </g>
        </g>
      </svg>
      <span className="absolute left-[46%] top-[52%] h-4 w-4 rounded-full bg-sun-400 ring-[6px] ring-sun-400/25" />
    </div>
  );
}

function BookingCard({
  price,
  onBook,
  onMessage,
  messaging,
  saved,
  onSave,
  onShare,
  shared,
}: {
  price: number;
  onBook: () => void;
  onMessage: () => void;
  messaging: boolean;
  saved: boolean;
  onSave: () => void;
  onShare: () => void;
  shared: boolean;
}) {
  const t = useTranslations('provider.profile');
  const steps = t.raw('escrowSteps') as string[];
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_24px_60px_-32px_rgb(12_55_39/0.35)]">
      <p className="text-sm text-muted-foreground">{t('from')}</p>
      <p className="font-display text-[2rem] font-bold leading-tight tabular">{formatPrice(price)}</p>
      <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{t('priceNote')}</p>

      <button
        type="button"
        onClick={onBook}
        className="mt-5 flex h-12 w-full items-center justify-center rounded-lg bg-sun-400 text-[15px] font-bold text-gray-950 shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)] transition-colors hover:bg-sun-300"
      >
        {t('book')}
      </button>
      <button
        type="button"
        onClick={onMessage}
        disabled={messaging}
        className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border text-[15px] font-semibold transition-colors hover:bg-muted disabled:opacity-60"
      >
        {messaging ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
        {t('message')}
      </button>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onSave}
          aria-pressed={saved}
          className={cn(
            'flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted',
            saved && 'text-red-600 dark:text-red-300'
          )}
        >
          <Heart className={cn('h-4 w-4', saved && 'fill-current')} />
          {saved ? t('saved') : t('save')}
        </button>
        <button type="button" onClick={onShare} className="flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted">
          {shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          {shared ? t('copied') : t('share')}
        </button>
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-brand-700 dark:text-brand-300" />
          {t('escrowTitle')}
        </p>
        <ol className="mt-3 space-y-2">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] leading-snug text-foreground/75">
              <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted font-display text-[11px] font-bold text-foreground">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function ProviderProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('provider');
  const tp = useTranslations('provider.profile');
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const [requestOpen, setRequestOpen] = useState(false);
  const [shared, setShared] = useState(false);

  // « Refaire appel » depuis l'historique : ?demande=1 ouvre directement le formulaire
  useEffect(() => {
    if (isAuthenticated && new URLSearchParams(window.location.search).get('demande') === '1') {
      queueMicrotask(() => setRequestOpen(true));
    }
  }, [isAuthenticated]);

  const { data: provider, isLoading } = useQuery({
    queryKey: ['provider', id],
    queryFn: () => providerApi.detail(id),
    enabled: !!id,
  });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list });
  const { data: favorites } = useQuery({ queryKey: ['favorites'], queryFn: favoriteApi.list, enabled: isAuthenticated });
  const saved = !!favorites?.some((f) => f.id === id);

  const favMutation = useMutation({
    mutationFn: () => (saved ? favoriteApi.remove(id) : favoriteApi.add(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });
  const chatMutation = useMutation({
    mutationFn: () => chatApi.startConversation(id),
    onSuccess: (conv) => router.push(`/dashboard/messages?id=${conv.id}`),
  });

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?next=${encodeURIComponent(`/providers/${id}`)}`);
      return;
    }
    action();
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: provider?.name, url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        window.setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // partage annulé par l'utilisateur
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" aria-busy="true">
        <div className="h-40 animate-pulse bg-brand-900/80 sm:h-48" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="-mt-14 h-28 w-28 animate-pulse rounded-full border-4 border-background bg-muted" />
          <div className="mt-5 h-10 w-72 animate-pulse rounded-lg bg-muted" />
          <div className="mt-3 h-5 w-48 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">{t('notFound')}</h1>
        <Link href="/search" className="mt-4 inline-block font-semibold text-brand-700 underline underline-offset-4 dark:text-brand-300">
          {tp('backToSearch')}
        </Link>
      </div>
    );
  }

  const category = categories?.find((c) => c.id === provider.categoryId)?.label;
  const ratingText = provider.rating.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const canReview = isAuthenticated && user?.role === 'CLIENT';

  const card = (
    <BookingCard
      price={provider.startingPrice}
      onBook={() => requireAuth(() => setRequestOpen(true))}
      onMessage={() => requireAuth(() => chatMutation.mutate())}
      messaging={chatMutation.isPending}
      saved={saved}
      onSave={() => requireAuth(() => favMutation.mutate())}
      onShare={share}
      shared={shared}
    />
  );

  return (
    <div className="pb-28 lg:pb-20">
      <CoverBand />

      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-x-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <div>
          {/* Identité */}
          <header className="relative">
            <div className="-mt-14 flex items-end justify-between gap-4 sm:-mt-16">
              <span className="relative block h-28 w-28 shrink-0 sm:h-32 sm:w-32">
                {provider.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- avatar servi par l'API, domaine variable
                  <img loading="lazy" decoding="async" src={provider.avatarUrl} alt="" className="h-full w-full rounded-full border-4 border-background object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center rounded-full border-4 border-background bg-brand-100 font-display text-4xl font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-200">
                    {getInitials(provider.name)}
                  </span>
                )}
                {provider.online && (
                  <span className="absolute bottom-2 right-2 h-5 w-5 rounded-full border-[3px] border-background bg-brand-500" title={tp('online')} />
                )}
              </span>
            </div>

            <nav className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground" aria-label="Fil d'Ariane">
              <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-1.5 font-medium hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                {tp('backToSearch')}
              </button>
              {category && (
                <>
                  <span aria-hidden="true">/</span>
                  <Link href={`/search?category=${encodeURIComponent(provider.categoryId)}&q=${encodeURIComponent(provider.city)}`} className="hover:text-foreground hover:underline">
                    {tp('inCategory', { category, city: provider.city })}
                  </Link>
                </>
              )}
            </nav>

            <h1 className="mt-3 text-4xl font-bold leading-[1.05] sm:text-5xl">{provider.name}</h1>
            <p className="mt-2 text-xl text-foreground/75">{provider.profession}</p>

            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[15px] text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {provider.city}
                {provider.distanceKm != null && `, ${tp('away', { km: formatDistance(provider.distanceKm) })}`}
              </li>
              {provider.availability && (
                <li className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {provider.availability}
                </li>
              )}
              <li className="flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full', provider.available ? 'bg-brand-500' : 'bg-gray-400')} />
                <span className={provider.available ? 'font-medium text-brand-800 dark:text-brand-200' : ''}>
                  {provider.available ? tp('available') : tp('unavailable')}
                </span>
              </li>
            </ul>

            {/* Trois chiffres qui comptent pour choisir */}
            <dl className="mt-7 grid grid-cols-3 divide-x divide-border rounded-xl border border-border">
              <div className="flex min-w-0 flex-col-reverse px-3 py-4 sm:px-5">
                <dt className="mt-1 text-[13px] text-muted-foreground">{tp('facts.rating')}</dt>
                <dd className="flex items-center gap-2">
                  <span className="font-display text-xl font-bold tabular sm:text-2xl">{provider.reviewCount > 0 ? ratingText : '–'}</span>
                  {provider.reviewCount > 0 && <Stars value={provider.rating} className="hidden sm:inline-flex" />}
                </dd>
              </div>
              <div className="flex min-w-0 flex-col-reverse px-3 py-4 sm:px-5">
                <dt className="mt-1 text-[13px] text-muted-foreground">{tp('facts.reviews')}</dt>
                <dd>
                  <a href="#avis" className="font-display text-xl font-bold tabular hover:underline sm:text-2xl">
                    {provider.reviewCount}
                  </a>
                </dd>
              </div>
              <div className="flex min-w-0 flex-col-reverse px-3 py-4 sm:px-5">
                <dt className="mt-1 text-[13px] text-muted-foreground">{tp('facts.price')}</dt>
                <dd className="font-display text-xl font-bold tabular sm:text-2xl">
                  {new Intl.NumberFormat(locale).format(provider.startingPrice)}
                  <span className="ml-1 text-[13px] font-semibold text-muted-foreground">FCFA</span>
                </dd>
              </div>
            </dl>
          </header>

          {/* Carte de réservation : dans le flux sur mobile */}
          <div className="mt-8 lg:hidden">{card}</div>

          <div className="mt-12 space-y-14">
            <section aria-labelledby="work-title">
              <h2 id="work-title" className="mb-5 text-2xl font-bold">
                {tp('work')}
              </h2>
              <WorkGallery photos={provider.portfolio} name={provider.name} />
            </section>

            <section aria-labelledby="about-title" className="grid gap-8 md:grid-cols-[minmax(0,1fr)_220px]">
              <div>
                <h2 id="about-title" className="text-2xl font-bold">
                  {tp('about')}
                </h2>
                <p className="mt-4 max-w-2xl whitespace-pre-line text-[17px] leading-relaxed text-foreground/85">{provider.description}</p>
              </div>
              <dl className="space-y-5 md:border-l md:border-border md:pl-6 md:pt-1">
                <div>
                  <dt className="text-sm font-semibold">{tp('hours')}</dt>
                  <dd className="mt-1 text-[15px] text-muted-foreground">{provider.availability || '–'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold">{tp('zone')}</dt>
                  <dd className="mt-1 text-[15px] text-muted-foreground">{tp('zoneText', { city: provider.city })}</dd>
                </div>
              </dl>
            </section>

            <ReviewsSection
              providerId={provider.id}
              rating={provider.rating}
              reviewCount={provider.reviewCount}
              reviews={provider.reviews}
              canReview={canReview}
            />
          </div>
        </div>

        {/* Carte de réservation : colonne fixe sur grand écran, posée sur le bandeau */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 -mt-24">{card}</div>
        </aside>
      </div>

      {/* Barre d'action mobile */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-[12px] text-muted-foreground">{tp('from')}</p>
            <p className="font-display text-lg font-bold tabular">{formatPrice(provider.startingPrice)}</p>
          </div>
          <button
            type="button"
            onClick={() => requireAuth(() => setRequestOpen(true))}
            className="h-12 rounded-lg bg-sun-400 px-5 text-[15px] font-bold text-gray-950 shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)]"
          >
            {tp('book')}
          </button>
        </div>
      </div>

      <RequestSheet
        open={requestOpen}
        onOpenChange={setRequestOpen}
        providerId={provider.id}
        providerName={provider.name}
        startingPrice={provider.startingPrice}
      />
    </div>
  );
}
