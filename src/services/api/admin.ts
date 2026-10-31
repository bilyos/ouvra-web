import { api } from './client';
import type {
  AdminUser,
  AdminStats,
  BookingItem,
  PaymentItem,
  Category,
  SubscriptionPlan,
  SubscriptionInfo,
  PageResponse,
  Role,
} from '@/types';

export const adminApi = {
  // ── Users ──
  listUsers: (params?: { role?: string; suspended?: boolean; search?: string; page?: number; size?: number }) =>
    api.get<PageResponse<AdminUser>>('/admin/users', { params }).then((r) => r.data),

  getUser: (id: string) =>
    api.get<AdminUser>(`/admin/users/${id}`).then((r) => r.data),

  changeRole: (id: string, role: Role) =>
    api.put<AdminUser>(`/admin/users/${id}/role`, { role }).then((r) => r.data),

  suspendUser: (id: string, reason?: string) =>
    api.put<AdminUser>(`/admin/users/${id}/suspend`, { reason }).then((r) => r.data),

  activateUser: (id: string) =>
    api.put<AdminUser>(`/admin/users/${id}/activate`).then((r) => r.data),

  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`),

  // ── Categories ──
  createCategory: (data: { id: string; label: string; icon: string; sortOrder: number }) =>
    api.post<Category>('/admin/categories', data).then((r) => r.data),

  updateCategory: (id: string, data: { label?: string; icon?: string; sortOrder?: number }) =>
    api.put<Category>(`/admin/categories/${id}`, data).then((r) => r.data),

  deleteCategory: (id: string) =>
    api.delete(`/admin/categories/${id}`),

  // ── Bookings ──
  listBookings: (params?: { status?: string; page?: number; size?: number }) =>
    api.get<PageResponse<BookingItem>>('/admin/bookings', { params }).then((r) => r.data),

  forceCancel: (id: string, reason?: string) =>
    api.put<BookingItem>(`/admin/bookings/${id}/cancel`, null, { params: { reason } }).then((r) => r.data),

  /** Réservations dont le client a signalé un problème : paiement bloqué */
  disputes: (page = 0) =>
    api.get<PageResponse<BookingItem>>('/admin/bookings/disputes', { params: { page } }).then((r) => r.data),

  resolveDispute: (id: string, decision: 'RELEASE' | 'REFUND', note?: string) =>
    api.post<BookingItem>(`/admin/bookings/${id}/resolve`, null, { params: { decision, note } }).then((r) => r.data),

  // ── Payments ──
  listPayments: (params?: { status?: string; page?: number; size?: number }) =>
    api.get<PageResponse<PaymentItem>>('/admin/payments', { params }).then((r) => r.data),

  // ── Subscriptions ──
  updatePlan: (id: string, data: { name?: string; price?: number; durationDays?: number; maxServices?: number; boostFactor?: number; description?: string }) =>
    api.put<SubscriptionPlan>(`/admin/subscriptions/plans/${id}`, data).then((r) => r.data),

  listSubscriptions: (params?: { page?: number; size?: number }) =>
    api.get<PageResponse<SubscriptionInfo>>('/admin/subscriptions', { params }).then((r) => r.data),

  // ── Stats ──
  getStats: () =>
    api.get<AdminStats>('/admin/stats').then((r) => r.data),
};
