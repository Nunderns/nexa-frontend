import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function UserMenu({
  onCreatePost,
  composerOpen,
}: {
  onCreatePost: () => void;
  composerOpen: boolean;
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleGoToProfile = () => {
    setOpen(false);
    navigate('/profile');
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="btn btn-primary home-header-cta"
        onClick={onCreatePost}
        aria-expanded={composerOpen}
      >
        {composerOpen ? 'Close' : 'New post'}
      </button>

      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="avatar" aria-hidden="true">
          {(user?.username ?? '?').charAt(0).toUpperCase()}
        </span>
        <span className="user-menu-name">u/{user?.username ?? 'guest'}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {open && (
        <div className="user-menu-panel" role="menu">
          <div className="user-menu-panel-header">
            <span className="avatar avatar-lg" aria-hidden="true">
              {(user?.username ?? '?').charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="user-menu-panel-name">u/{user?.username}</p>
              <p className="user-menu-panel-email">{user?.email}</p>
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            className="user-menu-item"
            onClick={handleGoToProfile}
          >
            My profile
          </button>

          <button type="button" role="menuitem" className="user-menu-item" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}