'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Loader2 } from 'lucide-react';
import { favoriteApi } from '@/services/api';
import { ProviderCard } from '@/components/providers/provider-card';
import { EmptyState, PageHeader } from '@/components/dashboard/page-parts';

export default function FavoritesPage() {
  const queryClient = useQueryClient();
  const { data: favorites = [], isLoading } = useQuery({ queryKey: ['favorites'], queryFn: favoriteApi.list });
  const remove = useMutation({
    mutationFn: (id: string) => favoriteApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Favoris"
        description={
          favorites.length > 0
            ? `${favorites.length} prestataire${favorites.length > 1 ? 's' : ''} que vous gardez sous la main.`
            : 'Les prestataires que vous enregistrez depuis leur profil.'
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-5 w-5" />}
          title="Aucun favori pour l’instant"
          description="Touchez « Enregistrer » sur le profil d’un prestataire pour le retrouver ici et le recontacter vite."
          actionLabel="Trouver un prestataire"
          actionHref="/search"
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {favorites.map((p) => (
            <li key={p.id} className="relative">
              <ProviderCard provider={p} />
              <button
                type="button"
                onClick={() => remove.mutate(p.id)}
                disabled={remove.isPending && remove.variables === p.id}
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-card text-red-600 ring-1 ring-border transition-colors hover:bg-red-50 disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-500/10"
                aria-label={`Retirer ${p.name} des favoris`}
                title="Retirer des favoris"
              >
                {remove.isPending && remove.variables === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4 fill-current" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
