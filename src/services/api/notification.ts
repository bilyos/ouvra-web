import { api } from './client';
import type { NotificationItem, PageResponse } from '@/types';

export const notificationApi = {
  list: (page = 0, size = 20) =>
    api.get<PageResponse<NotificationItem>>('/notifications', { params: { page, size } }).then((r) => r.data),

  unreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),

  markRead: (id: string) =>
    api.put(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    api.put('/notifications/read-all').then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/notifications/${id}`).then((r) => r.data),

  registerPushToken: (token: string, platform: string) =>
    api.post('/notifications/push-token', { token, platform }).then((r) => r.data),

  unregisterPushToken: (token: string) =>
    api.delete(`/notifications/push-token/${token}`).then((r) => r.data),
};
