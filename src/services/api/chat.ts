import { api } from './client';
import type { Conversation, ChatMessage, SendMessageRequest } from '@/types';

export const chatApi = {
  listConversations: () =>
    api.get<Conversation[]>('/conversations').then((r) => r.data),

  unreadCount: () =>
    api.get<{ count: number }>('/conversations/unread-count').then((r) => r.data.count),

  startConversation: (providerId: string) =>
    api.post<Conversation>('/conversations', { providerId }).then((r) => r.data),

  messages: (conversationId: string) =>
    api.get<ChatMessage[]>(`/conversations/${conversationId}/messages`).then((r) => r.data),

  sendMessage: (conversationId: string, data: SendMessageRequest) =>
    api.post<ChatMessage>(`/conversations/${conversationId}/messages`, data).then((r) => r.data),
};
