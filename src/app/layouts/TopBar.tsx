import { Link, NavLink } from 'react-router-dom';
import { LanguageMenu } from '@/components/LanguageMenu';
import { SearchBar } from '@/features/search/components/SearchBar';
import { useNotifications } from '@/features/notifications/stores/NotificationsContext';
import { useI18n } from '@/lib/i18n/I18nContext';
import { AccountMenu } from './AccountMenu';

export interface TopBarProps {
  showCreatePost?: boolean;
  onCreatePost?: () => void;
  composerOpen?: boolean;
}

/**
 * Shared page header. Order: brand, search, language, chat, create post,
 * notifications, account. Every action lives in its own control so the bar
 * stays consistent across pages.
 */
export function TopBar({ showCreatePost = false, onCreatePost, composerOpen }: TopBarProps) {
  const { t } = useI18n();
  const { unreadCount } = useNotifications();
  const notificationsLabel =
    unreadCount > 0
      ? t('notifications.navUnread', { count: String(unreadCount) })
      : t('nav.notifications');

  return (
    <header className="home-header">
      <div className="home-header-inner home-header-inner-wide">
        <Link className="brand" to="/home">
          <svg className="brand-mark" width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="5" />
            <path d="M32 16L32 48M16 32L48 32" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          </svg>
          <span className="brand-name">{t('app.name')}</span>
        </Link>

        <div className="home-header-search">
          <SearchBar />
        </div>

        <nav className="topbar-actions" aria-label={t('nav.home')}>
          <LanguageMenu />

          <NavLink
            to="/popular"
            className={({ isActive }) => `icon-btn ${isActive ? 'active' : ''}`}
            aria-label={t('nav.popular')}
            title={t('nav.popular')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />
            </svg>
          </NavLink>

          <NavLink
            to="/chat"
            className={({ isActive }) => `icon-btn ${isActive ? 'active' : ''}`}
            aria-label={t('nav.chat')}
            title={t('nav.chat')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.5A8 8 0 1 1 21 12z" />
            </svg>
          </NavLink>

          {showCreatePost ? (
            <button
              type="button"
              className="btn btn-primary home-header-cta"
              onClick={onCreatePost}
              aria-expanded={composerOpen}
            >
              {composerOpen ? t('nav.close') : t('nav.newPost')}
            </button>
          ) : (
            <NavLink
              to="/create"
              className={({ isActive }) => `btn btn-primary home-header-cta ${isActive ? 'active' : ''}`}
            >
              {t('nav.newPost')}
            </NavLink>
          )}

          <NavLink
            to="/notifications"
            className={({ isActive }) => `icon-btn icon-btn-badged ${isActive ? 'active' : ''}`}
            aria-label={notificationsLabel}
            title={notificationsLabel}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
              <path d="M13.7 20a2 2 0 0 1-3.4 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="nav-badge" aria-hidden="true">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>

          <AccountMenu />
        </nav>
      </div>
    </header>
  );
}
