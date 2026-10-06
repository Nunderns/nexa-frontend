import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useDismissable } from '../hooks/useDismissable';
import { LanguageMenu } from './LanguageMenu';
import { SearchBar } from './SearchBar';

interface TopBarProps {
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
            className={({ isActive }) => `icon-btn ${isActive ? 'active' : ''}`}
            aria-label={t('nav.notifications')}
            title={t('nav.notifications')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
              <path d="M13.7 20a2 2 0 0 1-3.4 0" />
            </svg>
          </NavLink>

          <AccountMenu />
        </nav>
      </div>
    </header>
  );
}

type MenuItemId = 'profile' | 'drafts' | 'signout' | 'settings';

function AccountMenu() {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useDismissable<HTMLDivElement>(open, () => setOpen(false));

  const items: { id: MenuItemId; label: string; to?: string }[] = [
    { id: 'profile', label: t('menu.viewProfile', { username: user?.username ?? '' }), to: '/profile' },
    { id: 'drafts', label: t('menu.drafts'), to: '/drafts' },
    { id: 'signout', label: t('menu.signOut') },
    { id: 'settings', label: t('menu.settings'), to: '/settings' },
  ];

  const handleSelect = async (item: (typeof items)[number]) => {
    setOpen(false);
    if (item.id === 'signout') {
      await signOut();
      navigate('/login', { replace: true });
      return;
    }
    if (item.to) {
      navigate(item.to);
    }
  };

  return (
    <div className="menu-anchor" ref={ref}>
      <button
        type="button"
        className="user-menu-trigger user-menu-trigger-avatar"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('nav.accountMenu', { username: user?.username ?? '' })}
      >
        <span className="avatar avatar-md" aria-hidden="true">
          {(user?.username ?? '?').charAt(0).toUpperCase()}
        </span>
      </button>

      {open && (
        <div className="menu-pop menu-pop-right user-menu-panel" role="menu">
          <div className="user-menu-panel-header">
            <span className="avatar avatar-lg" aria-hidden="true">
              {(user?.username ?? '?').charAt(0).toUpperCase()}
            </span>
            <div className="user-menu-panel-identity">
              <p className="user-menu-panel-name">u/{user?.username}</p>
              <p className="user-menu-panel-email">{user?.email}</p>
            </div>
          </div>

          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={`user-menu-item ${item.id === 'signout' ? 'user-menu-item-danger' : ''}`}
              onClick={() => void handleSelect(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}