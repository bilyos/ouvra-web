import { api } from './client';
import type { BookingItem, CreateJobRequest, JobRequestItem, QuoteItem, RequestTiming, SendQuoteRequest } from '@/types';

/** Fil de demandes : le client montre son problème, les prestataires du coin envoient un devis. */
export const requestApi = {
  create: (data: CreateJobRequest) =>
    api.post<{ request: JobRequestItem; notifiedProviders: number }>('/requests', data).then((r) => r.data),

  mine: () => api.get<JobRequestItem[]>('/requests/mine').then((r) => r.data),

  /** Prestataire : demandes ouvertes de son métier, près de lui */
  feed: (timing?: RequestTiming) =>
    api.get<JobRequestItem[]>('/requests/feed', { params: { timing } }).then((r) => r.data),

  detail: (id: string) => api.get<JobRequestItem>(`/requests/${id}`).then((r) => r.data),

  cancel: (id: string) => api.post<JobRequestItem>(`/requests/${id}/cancel`).then((r) => r.data),

  relaunch: (id: string) => api.post<JobRequestItem>(`/requests/${id}/relaunch`).then((r) => r.data),

  /** Client : les devis reçus pour sa demande */
  quotes: (id: string) => api.get<QuoteItem[]>(`/requests/${id}/quotes`).then((r) => r.data),

  sendQuote: (id: string, data: SendQuoteRequest) =>
    api.post<QuoteItem>(`/requests/${id}/quotes`, data).then((r) => r.data),

  myQuotes: () => api.get<QuoteItem[]>('/quotes/mine').then((r) => r.data),

  withdrawQuote: (quoteId: string) => api.post<QuoteItem>(`/quotes/${quoteId}/withdraw`).then((r) => r.data),

  /** Client : choisit ce devis, la réservation est créée et attend le paiement */
  acceptQuote: (quoteId: string) => api.post<BookingItem>(`/quotes/${quoteId}/accept`).then((r) => r.data),
};
