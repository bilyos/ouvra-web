'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, EyeOff, Loader2, MapPin, Mic } from 'lucide-react';
import { categoryApi, mediaApi, requestApi } from '@/services/api';
import { PlacePicker, loadSavedPlace, type PickedPlace } from '@/components/location/place-picker';
import { PhotoPicker, VoiceRecorder, type LocalPhoto, type LocalVoice } from '@/components/requests/media-capture';
import { PILOT_CATEGORIES, iconFor } from '@/components/requests/category-icon';
import { TIMING_HINT, TIMING_LABEL } from '@/components/requests/labels';
import { useAuthStore } from '@/stores/auth-store';
import { getApiErrorMessage } from '@/utils/api-error';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { RequestTiming } from '@/types';

const field =
  'w-full rounded-lg border border-border bg-card px-3.5 text-[15px] transition-[border-color,box-shadow] placeholder:text-gray-400 hover:border-gray-300 focus:border-brand-600 focus:outline-none focus:ring-[3px] focus:ring-brand-600/15 dark:hover:border-gray-700';

const MIN_TEXT = 20;

/** « Akwa, Douala » → quartier et ville ; « Douala » → ville seule. */
function splitPlace(label: string) {
  const parts = label.split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length > 1 ? { quarter: parts.slice(0, -1).join(', '), city: parts[parts.length - 1] } : { quarter: undefined, city: parts[0] };
}

function extensionFor(type: string) {
  if (type.includes('mp4') || type.includes('aac')) return 'm4a';
  if (type.includes('ogg')) return 'ogg';
  return 'webm';
}

export default function NewRequestPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [voice, setVoice] = useState<LocalVoice | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [timing, setTiming] = useState<RequestTiming>('THIS_WEEK');
  const [place, setPlace] = useState<PickedPlace | null>(null);
  const [landmark, setLandmark] = useState('');
  const [budget, setBudget] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list });
  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) => {
        const ia = PILOT_CATEGORIES.indexOf(a.id);
        const ib = PILOT_CATEGORIES.indexOf(b.id);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      }),
    [categories]
  );
  const [showAll, setShowAll] = useState(false);
  const visibleCategories = showAll ? sortedCategories : sortedCategories.slice(0, 6);
  const categoryLabel = categories.find((c) => c.id === category)?.label;

  useEffect(() => {
    const saved = loadSavedPlace();
    if (saved) queueMicrotask(() => setPlace(saved));
    // Arrivée depuis une page métier : ?category=plomberie
    const fromUrl = new URLSearchParams(window.location.search).get('category');
    if (fromUrl) queueMicrotask(() => setCategory(fromUrl));
  }, []);

  const hasSomething = photos.length > 0 || !!voice || description.trim().length >= MIN_TEXT;
  const where = place ? splitPlace(place.label) : null;

  const publish = useMutation({
    mutationFn: async () => {
      // Les fichiers partent d'abord, un par un : sur une connexion lente, c'est plus fiable qu'un seul gros envoi
      const media = [];
      for (const p of photos) {
        const up = await mediaApi.upload(p.file);
        media.push({ kind: 'PHOTO' as const, url: up.url });
      }
      let voiceUrl: string | undefined;
      if (voice) {
        const file = new File([voice.blob], `note.${extensionFor(voice.blob.type)}`, { type: voice.blob.type });
        voiceUrl = (await mediaApi.upload(file)).url;
      }
      return requestApi.create({
        categoryId: category,
        title: title.trim(),
        description: description.trim() || undefined,
        voiceUrl,
        voiceSeconds: voice?.seconds,
        media,
        city: where!.city,
        quarter: where!.quarter,
        lat: place?.lat,
        lng: place?.lng,
        address: [place?.label, landmark.trim()].filter(Boolean).join(', ') || undefined,
        timing,
        budgetMax: budget ? Number(budget) : undefined,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requests'] }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSomething) return setFormError('Ajoutez une photo, une note vocale ou quelques phrases pour montrer le problème.');
    if (!category) return setFormError('Choisissez le métier concerné.');
    if (!title.trim()) return setFormError('Donnez un titre court à votre demande.');
    if (!place) return setFormError('Indiquez votre quartier pour prévenir les prestataires proches.');
    setFormError(null);
    publish.mutate();
  };

  if (publish.isSuccess) {
    const { request, notifiedProviders } = publish.data;
    return (
      <div className="mx-auto max-w-xl py-10">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sun-300 text-gray-950">
          <Check className="h-7 w-7" strokeWidth={3} />
        </span>
        <h1 className="mt-6 text-3xl font-bold">Demande publiée</h1>
        <p className="mt-3 text-[17px] text-foreground/80">
          {notifiedProviders > 0
            ? `${notifiedProviders} prestataire${notifiedProviders > 1 ? 's' : ''} de votre quartier ${notifiedProviders > 1 ? 'ont' : 'a'} été prévenu${notifiedProviders > 1 ? 's' : ''}.`
            : 'Aucun prestataire de ce métier n’est encore inscrit tout près. Votre demande reste visible et nous vous prévenons dès qu’un devis arrive.'}{' '}
          Vous recevrez jusqu’à 5 devis.
        </p>
        <ol className="mt-8 space-y-3 border-l-2 border-border pl-5 text-[15px]">
          <li><span className="font-semibold">Vous comparez</span> les prix, les dates et les avis.</li>
          <li><span className="font-semibold">Vous choisissez</span> et payez par Mobile Money : l’argent reste chez Ouvra.</li>
          <li><span className="font-semibold">Travail terminé :</span> vous donnez votre code, il est payé.</li>
        </ol>
        <Link
          href={`/dashboard/client/requests/${request.id}`}
          className="mt-10 inline-flex h-12 items-center gap-2 rounded-lg bg-brand-800 px-5 text-[15px] font-semibold text-white hover:bg-brand-900 dark:bg-brand-300 dark:text-brand-950"
        >
          Suivre ma demande
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const busy = publish.isPending;
  const previewText = description.trim();

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]">
      <form onSubmit={submit} className="max-w-2xl space-y-9" noValidate>
        <header>
          <h1 className="text-3xl font-bold">Montrez votre problème</h1>
          <p className="mt-1.5 max-w-xl text-[15px] text-muted-foreground">
            Les prestataires du coin vous envoient un prix et une date. Vous choisissez, sans donner votre numéro.
          </p>
        </header>

        <section aria-labelledby="s-show" className="space-y-3">
          <h2 id="s-show" className="text-base font-semibold">Ce qu’il faut voir</h2>
          <PhotoPicker photos={photos} onChange={setPhotos} busy={busy} />
          <VoiceRecorder value={voice} onChange={setVoice} busy={busy} />
          <div>
            <label htmlFor="r-desc" className="mb-1.5 block text-sm">
              Décrivez en quelques phrases {photos.length || voice ? <span className="text-muted-foreground">(facultatif)</span> : null}
            </label>
            <textarea
              id="r-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Depuis quand, ce que vous avez déjà essayé, la marque de l’appareil…"
              className={cn(field, 'resize-none py-3')}
              disabled={busy}
            />
          </div>
          <p className="text-[13px] text-muted-foreground">Montrez le problème, pas les personnes ni l’entrée de la maison.</p>
        </section>

        <fieldset disabled={busy}>
          <legend className="mb-3 text-base font-semibold">Quel métier ?</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 2xl:grid-cols-4">
            {visibleCategories.map((c) => {
              const Icon = iconFor(c.id);
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  aria-pressed={active}
                  className={cn(
                    'flex h-12 items-center gap-2.5 rounded-lg border px-3 text-left text-sm font-semibold transition-colors',
                    active ? 'border-brand-800 bg-brand-800 text-white dark:border-brand-300 dark:bg-brand-300 dark:text-brand-950' : 'border-border bg-card hover:border-gray-400 dark:hover:border-gray-600'
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
          {!showAll && sortedCategories.length > 6 && (
            <button type="button" onClick={() => setShowAll(true)} className="mt-2 text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 dark:text-brand-300">
              Voir les {sortedCategories.length - 6} autres métiers
            </button>
          )}
          <label htmlFor="r-title" className="mb-1.5 mt-5 block text-sm">
            Titre de la demande
          </label>
          <input
            id="r-title"
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : fuite sous l’évier, clim qui ne refroidit plus"
            className={cn(field, 'h-12')}
          />
        </fieldset>

        <fieldset disabled={busy}>
          <legend className="mb-3 text-base font-semibold">Pour quand ?</legend>
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
            {(['NOW', 'THIS_WEEK', 'FLEXIBLE'] as const).map((k) => {
              const active = timing === k;
              return (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTiming(k)}
                  className={cn(
                    'rounded-lg border px-3.5 py-3 text-left transition-colors',
                    active ? 'border-brand-800 ring-1 ring-brand-800 dark:border-brand-300 dark:ring-brand-300' : 'border-border bg-card hover:border-gray-400 dark:hover:border-gray-600'
                  )}
                >
                  <span className="block text-[15px] font-semibold">{TIMING_LABEL[k]}</span>
                  <span className="mt-0.5 block text-[13px] text-muted-foreground">{TIMING_HINT[k]}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset disabled={busy} className="space-y-3">
          <legend className="mb-3 text-base font-semibold">Où ?</legend>
          <PlacePicker value={place} onChange={setPlace} />
          <input
            aria-label="Adresse ou point de repère"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="Point de repère, ex : face à la pharmacie, portail bleu"
            className={cn(field, 'h-12')}
          />
          <p className="flex items-start gap-2 text-[13px] text-muted-foreground">
            <EyeOff className="mt-0.5 h-4 w-4 shrink-0" />
            Seul le quartier est visible. Le point de repère n’est donné qu’au prestataire que vous choisissez.
          </p>
        </fieldset>

        <fieldset disabled={busy}>
          <legend className="mb-1 text-base font-semibold">
            Budget maximum <span className="font-normal text-muted-foreground">(facultatif)</span>
          </legend>
          <p className="mb-3 text-[13px] text-muted-foreground">Sans budget, les prestataires proposent leur prix.</p>
          <div className="relative max-w-xs">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              aria-label="Budget maximum en FCFA"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="20 000"
              className={cn(field, 'h-12 pr-16')}
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">FCFA</span>
          </div>
        </fieldset>

        {(formError || publish.isError) && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {formError ?? getApiErrorMessage(publish.error, 'La demande n’a pas pu être publiée. Vérifiez votre connexion et réessayez.')}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-sun-400 px-8 text-base font-bold text-gray-950 shadow-[inset_0_-3px_0_rgb(0_0_0/0.14)] transition-colors hover:bg-sun-300 active:translate-y-px disabled:opacity-60 sm:w-auto"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {busy ? 'Envoi en cours…' : 'Publier ma demande'}
        </button>
      </form>

      {/* Aperçu : la demande telle que la voit un prestataire, pour que le client sache ce qu'il montre */}
      <aside className="hidden xl:sticky xl:top-24 xl:block xl:self-start" aria-label="Aperçu">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Ce que verront les prestataires</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photos[0].preview} alt="" className="aspect-[16/10] w-full object-cover" />
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center bg-muted text-[13px] text-muted-foreground">Pas encore de photo</div>
          )}
          <div className="space-y-2 p-4">
            <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold">
              {categoryLabel && <span className="rounded-md bg-muted px-2 py-0.5">{categoryLabel}</span>}
              <span className={cn('rounded-md px-2 py-0.5', timing === 'NOW' ? 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-200' : 'bg-muted')}>{TIMING_LABEL[timing]}</span>
            </div>
            <p className={cn('text-[17px] font-semibold leading-snug', !title.trim() && 'text-muted-foreground')}>{title.trim() || 'Le titre de votre demande'}</p>
            {previewText && <p className="line-clamp-3 text-sm text-foreground/80">{previewText}</p>}
            {voice && (
              <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <Mic className="h-3.5 w-3.5" /> Note vocale, {voice.seconds} s
              </p>
            )}
            <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-[13px] text-muted-foreground">
              <span className="flex min-w-0 items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{where ? (where.quarter ? `${where.quarter}, ${where.city}` : where.city) : 'Votre quartier'}</span>
              </span>
              <span className="shrink-0">{user ? `${user.firstName} ${user.lastName.charAt(0)}.` : ''}</span>
            </div>
            {budget && Number(budget) > 0 && <p className="text-[13px]">Budget : {formatPrice(Number(budget))} au plus</p>}
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          Votre numéro, votre nom complet et votre point de repère restent cachés. Les prestataires ne peuvent pas vous écrire avant que vous les choisissiez.
        </p>
      </aside>
    </div>
  );
}
