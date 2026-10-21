import { request } from '@/lib/api-client';
import type { Paginated } from '@/types/api';
import type { Chat, ChatList, Message } from '../types';

export const chatApi = {
  /** Idempotent: returns the existing chat for the pair when there is one. */
  create: (targetUserId: number) =>
    request<Chat>({ method: 'POST', url: '/chats', data: { targetUserId } }),

  getAll: (page = 1, limit = 20) =>
    request<ChatList>({ method: 'GET', url: '/chats', params: { page, limit } }),

  getById: (chatId: number) => request<Chat>({ method: 'GET', url: `/chats/${chatId}` }),

  getMessages: (chatId: number, page = 1, limit = 50) =>
    request<Paginated<Message>>({
      method: 'GET',
      url: `/chats/${chatId}/messages`,
      params: { page, limit },
    }),

  sendMessage: (chatId: number, content: string) =>
    request<Message>({ method: 'POST', url: `/chats/${chatId}/messages`, data: { content } }),
};
