import { request } from '@/lib/api-client';
import type { AppNotification, NotificationPage, NotificationPreferences, NotificationType } from '../types';

export const notificationsApi = {
  /** Pass the previous page's `nextCursor` as `cursor` for older items. */
  list: (params: { cursor?: string; limit?: number; unreadOnly?: boolean; type?: NotificationType } = {}) =>
    request<NotificationPage>({ method: 'GET', url: '/notifications', params }),

  unreadCount: () => request<{ count: number }>({ method: 'GET', url: '/notifications/unread-count' }),

  markRead: (id: string) =>
    request<AppNotification>({ method: 'PATCH', url: `/notifications/${id}/read` }),

  markAllRead: () =>
    request<{ updated: number; unreadCount: number }>({ method: 'PATCH', url: '/notifications/read-all' }),

  remove: (id: string) => request<void>({ method: 'DELETE', url: `/notifications/${id}` }),

  getPreferences: () =>
    request<NotificationPreferences>({ method: 'GET', url: '/notifications/preferences' }),

  updatePreferences: (data: Partial<NotificationPreferences>) =>
    request<NotificationPreferences>({ method: 'PATCH', url: '/notifications/preferences', data }),
};
