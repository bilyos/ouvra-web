'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, ExternalLink, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { categoryApi, mediaApi, providerApi } from '@/services/api';
import { EmptyState, PageHeader, Section } from '@/components/dashboard/page-parts';
import { ScheduleEditor } from '@/components/availability/schedule-editor';
import { cn } from '@/utils/cn';
import { getApiErrorMessage } from '@/utils/api-error';

const MAX_PHOTOS = 12;

const schema = z.object({
  title: z.string().trim().min(3, 'Au moins 3 caractères'),
  categoryId: z.string().min(1, 'Choisissez une catégorie'),
  description: z.string().trim().min(20, 'Au moins 20 caractères : les clients lisent cette partie'),
  startingPrice: z.number({ message: 'Indiquez un prix' }).int().min(500, 'Au moins 500 FCFA'),
  city: z.string().trim().min(1, 'Indiquez votre ville'),
  availability: z.string().trim().min(3, 'Indiquez vos horaires'),
});

type FormData = z.infer<typeof schema>;

const field =
  'w-full rounded-lg border bg-card px-3.5 text-[15px] outline-none transition-colors focus:border-brand-600 focus:ring-[3px] focus:ring-brand-600/15';

function Field({ label, hint, error, htmlFor, className, children }: { label: string; hint?: string; error?: string; htmlFor: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-[13px] text-red-600 dark:text-red-300">{error}</p> : hint ? <p className="mt-1.5 text-[13px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function ProviderServicesPage() {
  const queryClient = useQueryClient();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: profile, isLoading } = useQuery({ queryKey: ['my-provider-profile'], queryFn: providerApi.myProfile });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoryApi.list });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: profile
      ? {
          title: profile.profession,
          categoryId: profile.categoryId,
          description: profile.description,
          startingPrice: profile.startingPrice,
          city: profile.city,
          availability: profile.availability,
        }
      : undefined,
  });
  const { errors, isDirty } = form.formState;
  const description = form.watch('description') ?? '';

  const save = useMutation({
    mutationFn: (data: FormData) => providerApi.patchProfile(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['my-provider-profile'], updated);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    },
  });

  const photos = useMutation({
    mutationFn: (urls: string[]) => providerApi.patchProfile({ photoUrls: urls }),
    onSuccess: (updated) => queryClient.setQueryData(['my-provider-profile'], updated),
    onError: (err) => setUploadError(getApiErrorMessage(err, 'La galerie n’a pas pu être mise à jour.')),
  });

  const [uploading, setUploading] = useState(false);
  const onFiles = async (files: FileList | null) => {
    if (!files?.length || !profile) return;
    setUploadError(null);
    const room = MAX_PHOTOS - profile.portfolio.length;
    const picked = [...files].slice(0, room);
    const tooBig = picked.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) {
      setUploadError(`« ${tooBig.name} » dépasse 5 Mo.`);
      return;
    }
    setUploading(true);
    try {
      const urls = await Promise.all(picked.map((f) => mediaApi.upload(f).then((r) => r.url)));
      photos.mutate([...profile.portfolio, ...urls]);
    } catch (err) {
      setUploadError(getApiErrorMessage(err, 'L’envoi des photos a échoué.'));
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        title="Pas encore de profil prestataire"
        description="Créez votre profil pour apparaître dans la recherche et recevoir des demandes."
        actionLabel="Proposer mes services"
        actionHref="/dashboard/client/become-provider"
      />
    );
  }

  // Ce qui aide vraiment un client à choisir
  const checklist = [
    { label: 'Une photo de profil', done: !!profile.avatarUrl, href: '/dashboard/client/profile' },
    { label: 'Une description de 120 caractères ou plus', done: profile.description.length >= 120 },
    { label: 'Au moins 3 photos de vos travaux', done: profile.portfolio.length >= 3 },
    { label: 'Un premier avis client', done: profile.reviewCount > 0 },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mon profil public"
        description="Ce que les clients voient avant de vous contacter. Un profil complet reçoit plus de demandes."
        actions={
          <Link href={`/providers/${profile.id}`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted">
            Voir comme un client
            <ExternalLink className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <Section title="Votre activité">
            <form id="service-form" onSubmit={form.handleSubmit((d) => save.mutate(d))} className="grid gap-5 sm:grid-cols-2" noValidate>
              <Field label="Métier affiché" htmlFor="title" error={errors.title?.message} hint="Exemple : Électricien bâtiment, Coiffeuse à domicile" className="sm:col-span-2">
                <input id="title" {...form.register('title')} className={cn(field, 'h-11', errors.title ? 'border-red-500' : 'border-border')} />
              </Field>

              <Field label="Catégorie" htmlFor="categoryId" error={errors.categoryId?.message}>
                <select id="categoryId" {...form.register('categoryId')} className={cn(field, 'h-11', errors.categoryId ? 'border-red-500' : 'border-border')}>
                  <option value="">Choisir</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="À partir de" htmlFor="startingPrice" error={errors.startingPrice?.message} hint="Le prix le plus bas pour un déplacement.">
                <div className={cn('flex h-11 items-stretch overflow-hidden rounded-lg border bg-card focus-within:border-brand-600 focus-within:ring-[3px] focus-within:ring-brand-600/15', errors.startingPrice ? 'border-red-500' : 'border-border')}>
                  <input id="startingPrice" type="number" inputMode="numeric" step={500} {...form.register('startingPrice', { valueAsNumber: true })} className="min-w-0 flex-1 bg-transparent px-3.5 text-[15px] tabular outline-none" />
                  <span className="flex items-center border-l border-border bg-paper px-3 text-sm font-semibold text-muted-foreground">FCFA</span>
                </div>
              </Field>

              <Field label="Ville" htmlFor="city" error={errors.city?.message}>
                <input id="city" {...form.register('city')} className={cn(field, 'h-11', errors.city ? 'border-red-500' : 'border-border')} />
              </Field>

              <Field label="Horaires" htmlFor="availability" error={errors.availability?.message}>
                <input id="availability" placeholder="Lun - Sam, 8h - 18h" {...form.register('availability')} className={cn(field, 'h-11', errors.availability ? 'border-red-500' : 'border-border')} />
              </Field>

              <Field
                label="Présentation"
                htmlFor="description"
                error={errors.description?.message}
                hint={`${description.trim().length} caractères. Dites depuis quand vous exercez, ce que vous faites le mieux et où vous vous déplacez.`}
                className="sm:col-span-2"
              >
                <textarea id="description" rows={6} {...form.register('description')} className={cn(field, 'resize-y py-3 leading-relaxed', errors.description ? 'border-red-500' : 'border-border')} />
              </Field>
            </form>
          </Section>

          <ScheduleEditor />

          <Section
            title="Photos de vos travaux"
            description={`${profile.portfolio.length} sur ${MAX_PHOTOS}. Des photos nettes de chantiers terminés rassurent plus qu’un long texte.`}
            action={
              profile.portfolio.length < MAX_PHOTOS && (
                <label className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted focus-within:ring-[3px] focus-within:ring-brand-600/25">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  Ajouter
                  <input type="file" accept="image/*" multiple className="sr-only" disabled={uploading} onChange={(e) => { void onFiles(e.target.files); e.target.value = ''; }} />
                </label>
              )
            }
          >
            {uploadError && (
              <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                {uploadError}
              </p>
            )}
            {profile.portfolio.length === 0 ? (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 px-6 py-12 text-center hover:bg-muted/50 dark:border-gray-700">
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <span className="mt-2 font-semibold">Ajouter des photos</span>
                <span className="mt-0.5 text-[13px] text-muted-foreground">JPG ou PNG, 5 Mo maximum chacune</span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { void onFiles(e.target.files); e.target.value = ''; }} />
              </label>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {profile.portfolio.map((url, i) => (
                  <li key={url} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element -- photo servie par l'API */}
                    <img loading="lazy" decoding="async" src={url} alt={`Réalisation ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => photos.mutate(profile.portfolio.filter((p) => p !== url))}
                      disabled={photos.isPending}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition-opacity hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                      aria-label={`Retirer la photo ${i + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-sans text-base font-semibold tracking-normal">Profil complet</h2>
              <span className="text-sm font-semibold tabular text-muted-foreground">
                {doneCount}/{checklist.length}
              </span>
            </div>
            <div className="mt-3 flex gap-1" aria-hidden="true">
              {checklist.map((c) => (
                <span key={c.label} className={cn('h-1.5 flex-1 rounded-full', c.done ? 'bg-brand-600 dark:bg-brand-400' : 'bg-muted')} />
              ))}
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-start gap-2.5">
                  <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full', c.done ? 'bg-brand-600 text-white dark:bg-brand-400 dark:text-brand-950' : 'border border-gray-300 dark:border-gray-600')}>
                    {c.done && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  {c.href && !c.done ? (
                    <Link href={c.href} className="hover:underline">
                      {c.label}
                    </Link>
                  ) : (
                    <span className={cn(c.done && 'text-muted-foreground')}>{c.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {(isDirty || save.isPending || saved || save.isError) && (
        <div className="sticky bottom-0 z-30 -mx-4 border-t border-border bg-card sm:-mx-6">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <p className={cn('text-sm', save.isError ? 'text-red-600 dark:text-red-300' : 'text-muted-foreground')}>
              {save.isError ? getApiErrorMessage(save.error, 'Enregistrement impossible.') : saved && !isDirty ? 'Modifications enregistrées.' : 'Modifications non enregistrées.'}
            </p>
            {isDirty && (
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => form.reset()} className="h-10 rounded-lg px-4 text-sm font-semibold hover:bg-muted">
                  Annuler
                </button>
                <button type="submit" form="service-form" disabled={save.isPending} className="inline-flex h-10 items-center gap-2 rounded-lg bg-sun-400 px-5 text-sm font-bold text-gray-950 hover:bg-sun-300 disabled:opacity-60">
                  {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
