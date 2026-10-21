import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDismissable } from '@/hooks/useDismissable';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n/I18nContext';

type MenuItemId = 'profile' | 'drafts' | 'signout' | 'settings';

/** Avatar button in the top bar with the account actions. */
export function AccountMenu() {
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