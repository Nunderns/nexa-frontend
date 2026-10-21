import type { AppNotification } from '../types';

/**
 * Pure list operations behind the notifications context. REST pages and
 * socket pushes can deliver the same notification, so every write merges by
 * `id` and re-sorts by `(createdAt, id)` descending, the API's own order.
 */

function compare(a: AppNotification, b: AppNotification): number {
  if (a.createdAt !== b.createdAt) {
    return a.createdAt < b.createdAt ? 1 : -1;
  }
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

/** Incoming items win over stored ones: they are the fresher copy. */
export function mergeNotifications(
  current: AppNotification[],
  incoming: AppNotification[],
): AppNotification[] {
  if (incoming.length === 0) {
    return current;
  }
  const byId = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) {
    byId.set(item.id, item);
  }
  return [...byId.values()].sort(compare);
}

export function markReadById(
  current: AppNotification[],
  id: string,
  readAt: string,
): AppNotification[] {
  return current.map((item) =>
    item.id === id && !item.isRead ? { ...item, isRead: true, readAt } : item,
  );
}

/**
 * `notification:read-all` covers rows created up to `readAt`; anything newer
 * arrived concurrently and is still unread on the server.
 */
export function markReadUpTo(current: AppNotification[], readAt: string): AppNotification[] {
  const cutoff = Date.parse(readAt);
  return current.map((item) =>
    !item.isRead && Date.parse(item.createdAt) <= cutoff ? { ...item, isRead: true, readAt } : item,
  );
}

/** Where opening a notification should take the user, or `null` if nowhere. */
export function notificationTarget(item: AppNotification): string | null {
  const meta = item.metadata ?? {};
  const postId = typeof meta.postId === 'number' ? meta.postId : null;
  const chatId = typeof meta.chatId === 'number' ? meta.chatId : null;

  switch (item.type) {
    case 'DIRECT_MESSAGE':
      return chatId !== null ? `/chat?chat=${chatId}` : '/chat';
    case 'POST_REPLY':
    case 'COMMENT_REPLY':
    case 'USER_MENTION':
    case 'POST_UPVOTE':
    case 'COMMENT_UPVOTE':
      return postId !== null ? `/posts/${postId}` : null;
    default:
      return null;
  }
}
