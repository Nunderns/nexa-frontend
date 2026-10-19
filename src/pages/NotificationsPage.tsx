import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';
import { TopBar } from '../components/TopBar';
import { useNotifications } from '../context/NotificationsContext';
import { notificationTarget } from '../services/notificationList';
import type { AppNotification } from '../types';

type Translate = ReturnType<typeof useI18n>['t'];

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
    <div className="home-shell">
      <TopBar />

      <div className="home-layout">
        <main className="home-main">
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
                <li key={item.id} className={`notification-item ${item.isRead ? '' : 'unread'}`}>
                  <button type="button" className="notification-main" onClick={() => open(item)}>
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
                        onClick={() => void markRead(item.id)}
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
                      onClick={() => void remove(item.id)}
                      aria-label={t('notifications.delete')}
                      title={t('notifications.delete')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {hasMore && (
            <button type="button" className="btn notifications-more" onClick={() => void loadMore()} disabled={loading}>
              {loading ? t('notifications.loading') : t('notifications.loadMore')}
            </button>
          )}
        </main>
      </div>
    </div>
  );
}

/**
 * The server's `body` is English only, so known types are rendered from the
 * local dictionary and `body` is the fallback (e.g. `SYSTEM`).
 */
export function describe(item: AppNotification, t: Translate): string {
  if (item.type === 'SYSTEM') {
    return item.body;
  }
  const actor = item.actor ? `@${item.actor.username}` : t('notifications.someone');
  return t(`notifications.type.${item.type}` as TranslationKey, { actor });
}

function relativeTime(iso: string, t: Translate): string {
  const minutes = Math.floor((Date.now() - Date.parse(iso)) / 60_000);
  if (minutes < 1) return t('notifications.justNow');
  if (minutes < 60) return t('notifications.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('notifications.hoursAgo', { count: hours });
  return t('notifications.daysAgo', { count: Math.floor(hours / 24) });
}
