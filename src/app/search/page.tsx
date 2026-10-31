'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, Grid3X3, List, X, Loader2, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PlacePicker, loadSavedPlace, type PickedPlace } from '@/components/location/place-picker';
import { providerApi, categoryApi } from '@/services/api';
import { cn } from '@/utils/cn';
import { ProviderCard } from '@/components/providers/provider-card';
import type { ProviderSearchParams } from '@/types';

const labelClass = 'mb-1.5 block text-sm font-medium';

function FilterSelect({ id, value, onChange, children }: { id: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-lg border border-border bg-card pl-3.5 pr-9 text-[15px] transition-colors hover:border-gray-300 focus:border-brand-600 focus:outline-none focus:ring-[3px] focus:ring-brand-600/15 dark:hover:border-gray-700"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
    </div>
  );
}

export default function SearchPage() {
  const t = useTranslations('search');
  const searchParams = useSearchParams();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [place, setPlace] = useState<PickedPlace | null>(null);
  const geoActive = place != null;

  const [filters, setFilters] = useState<ProviderSearchParams>({
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || undefined,
    minRating: searchParams.get('minRating')
      ? Number(searchParams.get('minRating'))
      : undefined,
    sort: (searchParams.get('sort') as ProviderSearchParams['sort']) || 'proximity',
    page: 0,
    size: 20,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.list,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['providers', filters],
    queryFn: () => providerApi.search(filters),
  });

  const updateFilter = useCallback(
    (key: keyof ProviderSearchParams, value: string | number | boolean | undefined) => {
      setFilters((prev) => ({ ...prev, [key]: value, page: 0 }));
    },
    []
  );

  const clearFilters = () => {
    setFilters({ q: '', page: 0, size: 20, sort: 'proximity' });
    setPlace(null);
  };

  const applyPlace = useCallback((p: PickedPlace | null) => {
    setPlace(p);
    setFilters((prev) =>
      p
        ? { ...prev, lat: p.lat, lng: p.lng, radius: prev.radius ?? 15, sort: 'proximity', page: 0 }
        : { ...prev, lat: undefined, lng: undefined, radius: undefined, sort: prev.sort === 'proximity' ? 'rating' : prev.sort, page: 0 }
    );
  }, []);

  // Reprend le quartier choisi lors d'une visite précédente
  useEffect(() => {
    const saved = loadSavedPlace();
    if (saved) queueMicrotask(() => applyPlace(saved));
  }, [applyPlace]);

  const activeFilterCount = [
    filters.category,
    filters.minRating,
    filters.online,
    filters.available,
  ].filter(Boolean).length;

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <label htmlFor="f-category" className={labelClass}>
          {t('category')}
        </label>
        <FilterSelect id="f-category" value={filters.category || ''} onChange={(v) => updateFilter('category', v || undefined)}>
          <option value="">{t('all')}</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </FilterSelect>
      </div>

      <fieldset>
        <legend className={labelClass}>{t('minRating')}</legend>
        <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
          {[undefined, 4, 3, 2].map((v) => (
            <button
              key={v ?? 'all'}
              type="button"
              onClick={() => updateFilter('minRating', v)}
              aria-pressed={filters.minRating === v}
              className={cn(
                'h-9 rounded-md text-sm font-medium transition-colors',
                filters.minRating === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {v ? `${v}+` : t('all')}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="f-sort" className={labelClass}>
          {t('sort')}
        </label>
        <FilterSelect id="f-sort" value={filters.sort || 'proximity'} onChange={(v) => updateFilter('sort', v as ProviderSearchParams['sort'])}>
          <option value="proximity">{t('sortProximity')}</option>
          <option value="rating">{t('sortRating')}</option>
          <option value="price">{t('sortPrice')}</option>
          <option value="reviews">{t('sortReviews')}</option>
        </FilterSelect>
      </div>

      {geoActive && (
        <div>
          <label htmlFor="f-radius" className={labelClass}>
            {t('radius', { km: filters.radius || 15 })}
          </label>
          <input
            id="f-radius"
            type="range"
            min={1}
            max={50}
            value={filters.radius || 15}
            onChange={(e) => updateFilter('radius', Number(e.target.value))}
            className="w-full accent-brand-700"
          />
        </div>
      )}

      <div className="space-y-3">
        {(['available', 'online'] as const).map((key) => (
          <label key={key} className="flex cursor-pointer items-center gap-3 text-[15px]">
            <input
              type="checkbox"
              checked={filters[key] || false}
              onChange={(e) => updateFilter(key, e.target.checked || undefined)}
              className="h-[18px] w-[18px] accent-brand-700"
            />
            {t(key)}
          </label>
        ))}
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={clearFilters}
          className="text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700 dark:text-brand-300"
        >
          {t('clearFilters')}
        </button>
      )}
    </div>
  );

  const toolButton = 'flex h-12 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors';

  return (
    <div className="min-h-screen bg-paper">
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                aria-label={t('placeholder')}
                placeholder={t('placeholder')}
                value={filters.q || ''}
                onChange={(e) => updateFilter('q', e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-card pl-12 pr-4 text-base outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground hover:border-gray-300 focus:border-brand-600 focus:ring-[3px] focus:ring-brand-600/15 dark:hover:border-gray-700"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <PlacePicker value={place} onChange={applyPlace} className="min-w-0 flex-1 sm:w-72 sm:flex-none" />
              <button
                onClick={() => setFiltersOpen(true)}
                className={cn(toolButton, 'flex-1 justify-center border-border bg-card hover:border-gray-400 sm:flex-none lg:hidden dark:hover:border-gray-600')}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t('filters')}
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1 text-xs text-white">{activeFilterCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[232px_1fr] lg:px-8">
        <aside className="hidden lg:block" aria-label={t('filters')}>
          <div className="sticky top-24">
            <h2 className="mb-5 font-sans text-base font-semibold tracking-normal">{t('filters')}</h2>
            {filterPanel}
          </div>
        </aside>

        <section aria-busy={isFetching}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="text-[15px] text-muted-foreground" aria-live="polite">
              {data ? (
                <>
                  <span className="font-semibold text-foreground tabular">{data.totalElements}</span>{' '}
                  {t('resultsCount', { count: data.totalElements })}
                </>
              ) : (
                t('searching')
              )}
              {isFetching && data && <Loader2 className="ml-2 inline h-4 w-4 animate-spin align-[-2px]" />}
            </p>
            <div className="hidden items-center rounded-lg bg-muted p-1 md:flex" role="group">
              {(
                [
                  ['grid', Grid3X3],
                  ['list', List],
                ] as const
              ).map(([v, Icon]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  aria-label={v}
                  className={cn(
                    'flex h-8 w-9 items-center justify-center rounded-md transition-colors',
                    view === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className={cn('gap-4', view === 'grid' ? 'grid sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col')}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5">
                  <div className="h-14 w-14 animate-pulse rounded-full bg-muted" />
                  <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="mt-6 h-5 w-1/3 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : data && data.content.length > 0 ? (
            <>
              <div className={cn('gap-4', view === 'grid' ? 'grid sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col')}>
                {data.content.map((provider, i) => (
                  <ProviderCard key={provider.id} provider={provider} view={view} index={i} />
                ))}
              </div>

              {data.totalPages > 1 && (
                <nav className="mt-12 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
                  {Array.from({ length: data.totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setFilters((prev) => ({ ...prev, page: i }))}
                      aria-current={i === data.page ? 'page' : undefined}
                      className={cn(
                        'flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-sm font-semibold tabular transition-colors',
                        i === data.page ? 'bg-brand-900 text-white dark:bg-brand-300 dark:text-brand-950' : 'hover:bg-muted'
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </nav>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center dark:border-gray-700">
              <h2 className="text-xl font-semibold">{t('noResults')}</h2>
              <p className="mx-auto mt-2 max-w-sm text-[15px] text-muted-foreground">{t('noResultsHint')}</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-5 text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 dark:text-brand-300"
                >
                  {t('clearFilters')}
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={t('filters')}>
          <div className="absolute inset-0 bg-gray-950/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">{t('filters')}</h2>
              <button
                onClick={() => setFiltersOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted"
                aria-label={t('filters')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {filterPanel}
            <button
              onClick={() => setFiltersOpen(false)}
              className="mt-8 flex h-12 w-full items-center justify-center rounded-lg bg-brand-900 text-[15px] font-semibold text-white"
            >
              {data ? `${data.totalElements} ${t('resultsCount', { count: data.totalElements })}` : t('filters')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
