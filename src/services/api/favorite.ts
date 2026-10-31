import { api } from './client';
import type { ProviderCard } from '@/types';

export const favoriteApi = {
  list: () =>
    api.get<ProviderCard[]>('/me/favorites').then((r) => r.data),

  add: (providerId: string) =>
    api.post(`/me/favorites/${providerId}`).then((r) => r.data),

  remove: (providerId: string) =>
    api.delete(`/me/favorites/${providerId}`).then((r) => r.data),
};
