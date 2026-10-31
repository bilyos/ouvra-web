import { api } from './client';
import type {
  BookingItem,
  CreateBookingRequest,
  InitPaymentRequest,
  PaymentItem,
  PlatformStats,
} from '@/types';

export const bookingApi = {
  create: (data: CreateBookingRequest) =>
    api.post<BookingItem>('/bookings', data).then((r) => r.data),

  mine: () =>
    api.get<BookingItem[]>('/bookings/mine').then((r) => r.data),

  received: () =>
    api.get<BookingItem[]>('/bookings/received').then((r) => r.data),

  detail: (id: string) =>
    api.get<BookingItem>(`/bookings/${id}`).then((r) => r.data),

  updateStatus: (id: string, status: string, cancelReason?: string) =>
    api.patch<BookingItem>(`/bookings/${id}/status`, { status, cancelReason }).then((r) => r.data),

  cancel: (id: string, reason?: string) =>
    api.post<BookingItem>(`/bookings/${id}/cancel`, { reason }).then((r) => r.data),

  initPayment: (bookingId: string, data: InitPaymentRequest) =>
    api.post<PaymentItem>(`/bookings/${bookingId}/pay`, data).then((r) => r.data),

  confirmPayment: (paymentId: string) =>
    api.post<PaymentItem>(`/bookings/payments/${paymentId}/confirm`).then((r) => r.data),

  payments: (bookingId: string) =>
    api.get<PaymentItem[]>(`/bookings/${bookingId}/payments`).then((r) => r.data),

  /** Prestataire : saisit le code du client, il est payé tout de suite */
  complete: (id: string, code: string) =>
    api.post<BookingItem>(`/bookings/${id}/complete`, { code }).then((r) => r.data),

  /** Le prestataire part chez le client */
  onTheWay: (id: string) =>
    api.post<BookingItem>(`/bookings/${id}/on-the-way`).then((r) => r.data),

  /** Prestataire : client absent, versement automatique sous 48 h sauf signalement */
  markDone: (id: string) =>
    api.post<BookingItem>(`/bookings/${id}/mark-done`).then((r) => r.data),

  /** Client : confirme la fin du travail, le prestataire est payé */
  confirmCompletion: (id: string) =>
    api.post<BookingItem>(`/bookings/${id}/confirm-completion`).then((r) => r.data),

  /** Client : signale un problème, l'argent reste bloqué */
  dispute: (id: string, reason: string) =>
    api.post<BookingItem>(`/bookings/${id}/dispute`, { reason }).then((r) => r.data),

  urgent: () =>
    api.get<BookingItem[]>('/bookings/urgent').then((r) => r.data),

  acceptUrgent: (bookingId: string) =>
    api.post<BookingItem>(`/bookings/${bookingId}/accept`).then((r) => r.data),

  platformStats: () =>
    api.get<PlatformStats>('/bookings/stats/platform').then((r) => r.data),
};
