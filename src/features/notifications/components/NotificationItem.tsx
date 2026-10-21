import { useI18n } from '@/lib/i18n/I18nContext';
import type { AppNotification } from '../types';
import { describe, relativeTime } from '../utils/describe';

interface NotificationItemProps {
  item: AppNotification;
  onOpen: () => void;
  onMarkRead: () => void;
  onRemove: () => void;
}

export function NotificationItem({ item, onOpen, onMarkRead, onRemove }: NotificationItemProps) {
  const { t } = useI18n();

  return (
    <li className={`notification-item ${item.isRead ? '' : 'unread'}`}>
      <button type="button" className="notification-main" onClick={onOpen}>
        <span className="avatar avatar-md" aria-hidden="true">
          {(item.actor?.username ?? '•').charAt(0).toUpperCase()}
        </span>
        <span className="notification-text">
          {/* Plain text by contract: never render as HTML. */}
          <span className="notification-body">{describe(item, t)}</span>
          <span className="notification-meta">
            {!item.isRead && <span className="visually-hidden">{t('notifications.unread')}. </span>}
            <time dateTime={item.createdAt}>{relativeTime(item.createdAt, t)}</time>
          </span>
        </span>
      </button>

      <div className="notification-actions">
        {!item.isRead && (
          <button
            type="button"
            className="icon-btn"
            onClick={onMarkRead}
            aria-label={t('notifications.markRead')}
            title={t('notifications.markRead')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </button>
        )}
        <button
          type="button"
          className="icon-btn"
          onClick={onRemove}
          aria-label={t('notifications.delete')}
          title={t('notifications.delete')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </li>
  );
}
