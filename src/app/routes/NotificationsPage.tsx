import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/app/layouts/PageLayout';
import { NotificationItem } from '@/features/notifications/components/NotificationItem';
import { useNotifications } from '@/features/notifications/stores/NotificationsContext';
import type { AppNotification } from '@/features/notifications/types';
import { notificationTarget } from '@/features/notifications/utils/notificationList';
import { useI18n } from '@/lib/i18n/I18nContext';

/**
 * Inbox backed by `NotificationsContext`: history over REST, new items pushed
 * over the `/notifications` socket while the page is open.
 */
export function NotificationsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const {
    items,
    unreadCount,
    hasMore,
    loading,
    loaded,
    error,
    liveUnavailable,
    unreadOnly,
    setUnreadOnly,
    loadMore,
    reload,
    markRead,
    markAllRead,
    remove,
  } = useNotifications();

  const open = (item: AppNotification) => {
    void markRead(item.id);
    const target = notificationTarget(item);
    if (target) {
      navigate(target);
    }
  };

  return (
    <PageLayout>
      <div className="notifications-header">
        <h1 className="page-title">{t('notifications.title')}</h1>
        <button
          type="button"
          className="btn"
          onClick={() => void markAllRead()}
          disabled={unreadCount === 0}
        >
          {t('notifications.markAllRead')}
        </button>
      </div>

      <div className="tab-bar" role="tablist" aria-label={t('notifications.title')}>
        <button
          type="button"
          role="tab"
          aria-selected={!unreadOnly}
          className={`tab ${!unreadOnly ? 'active' : ''}`}
          onClick={() => setUnreadOnly(false)}
        >
          {t('notifications.filterAll')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={unreadOnly}
          className={`tab ${unreadOnly ? 'active' : ''}`}
          onClick={() => setUnreadOnly(true)}
        >
          {t('notifications.filterUnread')}
          {unreadCount > 0 && <span className="tab-count">{unreadCount}</span>}
        </button>
      </div>

      {liveUnavailable && (
        <p className="field-hint notifications-offline" role="status">
          {t('notifications.offline')}
        </p>
      )}

      {error && (
        <div className="feed-error" role="alert">
          <p>{t('notifications.loadFailed')}</p>
          <button type="button" className="btn" onClick={() => void reload()}>
            {t('notifications.retry')}
          </button>
        </div>
      )}

      {!loaded && loading && <p className="field-hint">{t('notifications.loading')}</p>}

      {loaded && items.length === 0 && !error && (
        <div className="feed-empty">
          <h2>{t(unreadOnly ? 'notifications.emptyUnreadTitle' : 'notifications.emptyTitle')}</h2>
          <p>{t(unreadOnly ? 'notifications.emptyUnreadBody' : 'notifications.emptyBody')}</p>
        </div>
      )}

      {items.length > 0 && (
        <ul className="notification-list">
          {items.map((item) => (
            <NotificationItem
              key={item.id}
              item={item}
              onOpen={() => open(item)}
              onMarkRead={() => void markRead(item.id)}
              onRemove={() => void remove(item.id)}
            />
          ))}
        </ul>
      )}

      {hasMore && (
        <button type="button" className="btn notifications-more" onClick={() => void loadMore()} disabled={loading}>
          {loading ? t('notifications.loading') : t('notifications.loadMore')}
        </button>
      )}
    </PageLayout>
  );
}
