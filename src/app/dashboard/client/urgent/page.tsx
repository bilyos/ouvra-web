'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AirVent,
  BookOpen,
  Camera,
  Check,
  CookingPot,
  Hammer,
  Laptop,
  Loader2,
  PaintRoller,
  Scissors,
  SprayCan,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { bookingApi, categoryApi, providerApi } from '@/services/api';
import { getApiErrorMessage } from '@/utils/api-error';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import { PlacePicker, loadSavedPlace, type PickedPlace } from '@/components/location/place-picker';

const ICONS: [RegExp, LucideIcon][] = [
  [/plomb/i, Wrench],
  [/electr/i, Zap],
  [/menage|nettoy/i, SprayCan],
  [/coiff|beaut/i, Scissors],
  [/menuis|bois/i, Hammer],
  [/peint/i, PaintRoller],
  [/clim|froid/i, AirVent],
  [/inform|tel/i, Laptop],
  [/cours|repet/i, BookOpen],
  [/demen|transp/i, Truck],
  [/photo/i, Camera],
  [/traiteur|cuisin/i, CookingPot],
];
const iconFor = (id: string) => ICONS.find(([re]) => re.test(id))?.[1] ?? Wrench;

const BUDGETS = [5000, 10000, 15000, 25000];

const field =
  'w-full rounded-lg border border-border bg-card px-3.5 text-[15px] transition-[border-color,box-shadow] placeholder:text-gray-400 hover:border-gray-300 focus:border-brand-600 focus:outline-none focus:ring-[3px] focus:ring-brand-600/15 dark:hover:border-gray-700';

export default function UrgentRequestPage() {
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [budget, setBudget] = useState(10000);
  const [customBudget, setCustomBudget] = useState('');
  const [place, setPlace] = useState<PickedPlace | null>(null);
  const lat = place?.lat;
  const lng = place?.lng;
  const [formError, setFormError] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list });
  const { data: nearby, isFetching: nearbyLoading } = useQuery({
    queryKey: ['providers', 'nearby', lat, lng, category],
    queryFn: () => providerApi.search({ lat, lng, radius: 20, available: true, category: category || undefined, sort: 'proximity', size: 50 }),
    enabled: lat != null && lng != null,
    refetchInterval: 30000,
  });
  const nearbyCount = nearby?.totalElements ?? 0;

  // Reprend le quartier déjà choisi sur cet appareil
  useEffect(() => {
    const saved = loadSavedPlace();
    if (saved) queueMicrotask(() => setPlace(saved));
  }, []);

  const price = customBudget ? Number(customBudget) : budget;
  const create = useMutation({
    mutationFn: () =>
      bookingApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        // Le quartier choisi, puis le point de repère : c'est ce que lit le prestataire
        address: [place?.source === 'list' ? place.label : null, address.trim()].filter(Boolean).join(', '),
        price,
        urgent: true,
        categoryId: category,
        lat,
        lng,
      }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !title.trim() || (!place && !address.trim()) || !(price > 0)) {
      setFormError('Choisissez un métier, décrivez le problème et indiquez où vous êtes.');
      return;
    }
    setFormError(null);
    create.mutate();
  };

  if (create.isSuccess) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
          <Zap className="h-7 w-7" />
        </span>
        <h1 className="mt-6 text-3xl font-bold">Demande urgente envoyée</h1>
        <p className="mt-3 text-[17px] text-foreground/80">
          {nearbyCount > 0
            ? `${nearbyCount} prestataire${nearbyCount > 1 ? 's' : ''} disponible${nearbyCount > 1 ? 's' : ''} à moins de 20 km ${nearbyCount > 1 ? 'ont' : 'a'} été prévenu${nearbyCount > 1 ? 's' : ''}.`
            : 'Les prestataires disponibles de cette catégorie ont été prévenus.'}{' '}
          Le premier qui accepte prend la demande. Elle reste ouverte 30 minutes.
        </p>
        <ol className="mt-8 space-y-3 border-l-2 border-border pl-5">
          <li className="text-[15px]"><span className="font-semibold">Un prestataire accepte :</span> vous êtes prévenu et pouvez lui écrire.</li>
          <li className="text-[15px]"><span className="font-semibold">Vous payez</span> par Mobile Money : l’argent reste chez Ouvra.</li>
          <li className="text-[15px]"><span className="font-semibold">Travail terminé :</span> vous donnez votre code, il est payé.</li>
        </ol>
        <Link href="/dashboard/client/bookings" className="mt-10 inline-flex h-12 items-center rounded-lg bg-brand-800 px-5 text-[15px] font-semibold text-white hover:bg-brand-900 dark:bg-brand-300 dark:text-brand-950">
          Suivre ma demande
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <form onSubmit={submit} className="space-y-8" noValidate>
        <header>
          <p className="inline-flex items-center gap-2 rounded-md bg-red-100 px-2.5 py-1 text-[13px] font-semibold text-red-800 dark:bg-red-500/15 dark:text-red-200">
            <Zap className="h-3.5 w-3.5" />
            Dans l’heure
          </p>
          <h1 className="mt-3 text-3xl font-bold">Demande urgente</h1>
          <p className="mt-1.5 max-w-xl text-[15px] text-muted-foreground">Envoyée à tous les prestataires disponibles près de vous. Le premier qui accepte vient.</p>
        </header>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold">1. Quel métier ?</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {categories.map((c) => {
              const Icon = iconFor(c.id);
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  aria-pressed={active}
                  className={cn(
                    'flex h-14 items-center gap-3 rounded-lg border px-3 text-left text-sm font-semibold transition-colors',
                    active ? 'border-brand-800 bg-brand-800 text-white dark:border-brand-300 dark:bg-brand-300 dark:text-brand-950' : 'border-border bg-card hover:border-gray-400 dark:hover:border-gray-600'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-3 text-sm font-semibold">2. Que se passe-t-il ?</legend>
          <div>
            <label htmlFor="u-title" className="mb-1.5 block text-sm">
              En quelques mots
            </label>
            <input id="u-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : tuyau cassé, l’eau coule partout" className={cn(field, 'h-12')} />
          </div>
          <div>
            <label htmlFor="u-desc" className="mb-1.5 block text-sm">
              Détails <span className="text-muted-foreground">(facultatif)</span>
            </label>
            <textarea id="u-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ce qui aide le prestataire à venir avec le bon matériel" className={cn(field, 'resize-none py-3')} />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-3 text-sm font-semibold">3. Où êtes-vous ?</legend>
          <PlacePicker value={place} onChange={setPlace} />
          <input aria-label="Point de repère" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Point de repère, ex : face à la boulangerie, portail bleu" className={cn(field, 'h-12')} />
          <p className="flex items-center gap-2 text-[13px]">
            {place ? (
              <>
                <Check className="h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" strokeWidth={3} />
                <span>On prévient les prestataires à moins de 20 km de {place.source === 'gps' ? 'votre position' : place.label}.</span>
              </>
            ) : (
              <span className="text-muted-foreground">Choisissez votre quartier pour prévenir les prestataires les plus proches.</span>
            )}
          </p>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold">4. Votre budget</legend>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => {
                  setBudget(b);
                  setCustomBudget('');
                }}
                aria-pressed={!customBudget && budget === b}
                className={cn(
                  'h-10 rounded-lg border px-3.5 text-sm font-semibold tabular transition-colors',
                  !customBudget && budget === b ? 'border-brand-800 bg-brand-800 text-white dark:border-brand-300 dark:bg-brand-300 dark:text-brand-950' : 'border-border bg-card hover:border-gray-400'
                )}
              >
                {formatPrice(b)}
              </button>
            ))}
            <input
              type="number"
              inputMode="numeric"
              min={500}
              step={500}
              aria-label="Autre montant en FCFA"
              placeholder="Autre montant"
              value={customBudget}
              onChange={(e) => setCustomBudget(e.target.value)}
              className={cn(field, 'h-10 w-40 tabular')}
            />
          </div>
        </fieldset>

        <div className="border-t border-border pt-6">
          {(formError || create.isError) && (
            <p role="alert" className="mb-3 text-sm text-red-700 dark:text-red-300">
              {formError ?? getApiErrorMessage(create.error, 'La demande n’a pas pu être envoyée.')}
            </p>
          )}
          <button type="submit" disabled={create.isPending} className="inline-flex h-12 items-center gap-2 rounded-lg bg-red-600 px-6 text-[15px] font-bold text-white hover:bg-red-700 disabled:opacity-60">
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Envoyer la demande urgente
          </button>
        </div>
      </form>

      <aside className="h-fit space-y-4 lg:sticky lg:top-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Disponibles maintenant, à moins de 20 km</p>
          <p className="mt-1 font-display text-4xl font-bold tabular">{lat == null ? '–' : nearbyLoading && !nearby ? '…' : nearbyCount}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{category ? 'dans ce métier' : 'tous métiers confondus'}</p>
          {nearby && nearby.content.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-border pt-4">
              {nearby.content.slice(0, 4).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{p.name}</span>
                  <span className="shrink-0 tabular text-muted-foreground">{p.distanceKm != null ? `${p.distanceKm.toFixed(1)} km` : p.city}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="px-1 text-[13px] leading-relaxed text-muted-foreground">
          Pas urgent ? Une <Link href="/search" className="font-semibold underline underline-offset-4">réservation classique</Link> vous laisse choisir le prestataire et le créneau.
        </p>
      </aside>
    </div>
  );
}
