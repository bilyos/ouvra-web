import { api } from './client';
import type {
  ProviderCard,
  ProviderDetail,
  ProviderStats,
  BecomeProviderRequest,
  UpdateProviderRequest,
  PageResponse,
  ProviderSearchParams,
} from '@/types';

export const providerApi = {
  search: (params: ProviderSearchParams) =>
    api.get<PageResponse<ProviderCard>>('/providers', { params }).then((r) => r.data),

  detail: (id: string, lat?: number, lng?: number) =>
    api.get<ProviderDetail>(`/providers/${id}`, { params: { lat, lng } }).then((r) => r.data),

  reviews: (id: string, page = 0, size = 20) =>
    api.get(`/providers/${id}/reviews`, { params: { page, size } }).then((r) => r.data),

  addReview: (id: string, data: { rating: number; comment?: string }) =>
    api.post(`/providers/${id}/reviews`, data).then((r) => r.data),

  becomeProvider: (data: BecomeProviderRequest) =>
    api.post<ProviderDetail>('/me/become-provider', data).then((r) => r.data),

  myProfile: () =>
    api.get<ProviderDetail>('/me/provider-profile').then((r) => r.data),

  patchProfile: (data: UpdateProviderRequest) =>
    api.patch<ProviderDetail>('/me/provider-profile', data).then((r) => r.data),

  updateStatus: (data: { online?: boolean; available?: boolean }) =>
    api.put<ProviderDetail>('/me/provider-status', data).then((r) => r.data),

  stats: () =>
    api.get<ProviderStats>('/me/provider-stats').then((r) => r.data),
};
