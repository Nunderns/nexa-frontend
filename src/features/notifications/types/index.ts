/** See backend/docs/notifications-websocket.md. */

export type NotificationType =
  | 'POST_REPLY'
  | 'COMMENT_REPLY'
  | 'USER_MENTION'
  | 'POST_UPVOTE'
  | 'COMMENT_UPVOTE'
  | 'DIRECT_MESSAGE'
  | 'SYSTEM';

export type NotificationResourceType = 'POST' | 'COMMENT' | 'CHAT';

/** Same shape over REST and the `notification:new` push, so both merge by `id`. */
export interface AppNotification {
  id: string;
  type: NotificationType;
  /** Plain text built by the server: render as text, never as HTML. */
  title: string;
  body: string;
  resourceType: NotificationResourceType | null;
  resourceId: number | null;
  /** Navigation ids only (postId, commentId, chatId, messageId). */
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  actor: { id: number; username: string; displayName: string; avatarUrl: string | null } | null;
}

/** Cursor paginated, newest first. */
export interface NotificationPage {
  data: AppNotification[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface NotificationPreferences {
  postReplies: boolean;
  commentReplies: boolean;
  mentions: boolean;
  votes: boolean;
  directMessages: boolean;
}
