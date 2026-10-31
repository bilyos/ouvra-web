'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { categoryApi, providerApi } from '@/services/api';
import { PageHeader } from '@/components/dashboard/page-parts';
import { getApiErrorMessage } from '@/utils/api-error';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingOverlay } from '@/components/ui/spinner';

const schema = z.object({
  categoryId: z.string().min(1, 'Sélectionnez une catégorie'),
  title: z.string().min(3, 'Titre requis (min. 3 caractères)'),
  description: z.string().min(20, 'Décrivez votre activité (min. 20 caractères)'),
  startingPrice: z.string().refine((v) => Number(v) > 0, 'Tarif de départ invalide'),
  city: z.string().min(1, 'La ville est requise'),
  availability: z.string().min(3, 'Indiquez vos disponibilités'),
});

type FormValues = z.infer<typeof schema>;

const AVAILABILITY_PRESETS = ['Lun - Sam, 8h - 18h', 'Tous les jours, 7h - 20h', 'Week-end uniquement', 'Soirs et week-end'];

const STEPS = [
  {
    title: 'Votre profil est en ligne',
    text: 'Les clients de votre ville vous trouvent dans la recherche et sur la carte.',
  },
  {
    title: 'Vous recevez des demandes',
    text: 'Vous acceptez ou refusez, et vous discutez avec le client avant de vous déplacer.',
  },
  {
    title: 'Le client paie avant',
    text: 'L’argent est bloqué chez Ouvra. Il vous est versé quand le client vous donne son code de fin.',
  },
];

export default function BecomeProviderPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [redirecting, setRedirecting] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.list,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: '',
      title: '',
      description: '',
      startingPrice: '',
      city: user?.city ?? '',
      availability: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      providerApi.becomeProvider({
        categoryId: data.categoryId,
        title: data.title.trim(),
        description: data.description.trim(),
        startingPrice: Number(data.startingPrice),
        city: data.city.trim(),
        availability: data.availability.trim(),
      }),
    onSuccess: () => {
      if (user) {
        setUser({ ...user, role: 'PROVIDER', providerEnabled: true });
      }
      setRedirecting(true);
      router.push('/dashboard/provider');
    },
  });

  const onSubmit = (data: FormValues) => mutation.mutate(data);
  const availability = watch('availability');

  return (
    <div className="space-y-8">
      {(isSubmitting || mutation.isPending || redirecting) && <LoadingOverlay label="Création de votre profil prestataire…" />}

      <PageHeader title="Proposer mes services" description="Créez votre profil prestataire. Vous gardez votre compte client et passez de l’un à l’autre quand vous voulez." />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-7">
          <h2 className="font-sans text-base font-semibold tracking-normal">Votre activité</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Ces informations apparaissent sur votre profil public. Vous pourrez les modifier plus tard.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
            {mutation.isError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                {getApiErrorMessage(mutation.error, 'Le profil n’a pas pu être créé. Réessayez dans un instant.')}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="categoryId">Catégorie de service</Label>
              <select
                id="categoryId"
                className={`flex h-11 w-full rounded-lg border bg-transparent px-3.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:border-brand-600 focus-visible:ring-1 focus-visible:ring-brand-600 ${
                  errors.categoryId ? 'border-red-500' : 'border-border'
                }`}
                {...register('categoryId')}
              >
                <option value="">Sélectionner une catégorie</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Titre de votre activité</Label>
              <Input id="title" placeholder="Ex : Plombier professionnel" error={!!errors.title} {...register('title')} />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={4}
                placeholder="Ce que vous faites, depuis combien de temps, les quartiers où vous vous déplacez"
                className={`flex w-full rounded-lg border bg-transparent px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:border-brand-600 focus-visible:ring-1 focus-visible:ring-brand-600 resize-none ${
                  errors.description ? 'border-red-500' : 'border-border'
                }`}
                {...register('description')}
              />
              {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="startingPrice">Tarif de départ (FCFA)</Label>
                <Input id="startingPrice" type="number" min="0" placeholder="5000" error={!!errors.startingPrice} {...register('startingPrice')} />
                {errors.startingPrice && <p className="text-xs text-red-500">{errors.startingPrice.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city">Ville</Label>
                <Input id="city" placeholder="Douala" error={!!errors.city} {...register('city')} />
                {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="availability">Disponibilités</Label>
              <Input id="availability" placeholder="Lun - Sam, 8h - 18h" error={!!errors.availability} {...register('availability')} />
              <div className="flex flex-wrap gap-1.5">
                {AVAILABILITY_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setValue('availability', p, { shouldValidate: true })}
                    aria-pressed={availability === p}
                    className={cn(
                      'h-8 rounded-full px-3 text-[13px] font-medium transition-colors',
                      availability === p ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {errors.availability && <p className="text-xs text-red-500">{errors.availability.message}</p>}
            </div>

            <Button type="submit" className="mt-2 h-12 w-full gap-2 bg-sun-400 text-[15px] font-bold text-gray-950 hover:bg-sun-300" disabled={isSubmitting || mutation.isPending}>
              Activer mon profil prestataire
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <aside className="h-fit lg:sticky lg:top-6">
          <h2 className="font-sans text-base font-semibold tracking-normal">Ensuite</h2>
          <ol className="mt-4 space-y-5">
            {STEPS.map((step, n) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-800 text-[13px] font-bold text-white tabular dark:bg-brand-300 dark:text-brand-950">
                  {n + 1}
                </span>
                <span>
                  <span className="block font-semibold">{step.title}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-6 border-t border-border pt-4 text-[13px] leading-snug text-muted-foreground">
            Ouvra garde 10 % de chaque prestation payée sur la plateforme. L’inscription est gratuite.
          </p>
        </aside>
      </div>
    </div>
  );
}
