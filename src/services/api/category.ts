import { api } from './client';
import type { Category } from '@/types';

export const categoryApi = {
  list: () =>
    api.get<Category[]>('/categories').then((r) => r.data),
};
