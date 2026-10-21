import { useCallback, useState } from 'react';
import { useDismissable } from '@/hooks/useDismissable';
import { useI18n } from '@/lib/i18n/I18nContext';

interface CommunityOptionsMenuProps {
  canLeave: boolean;
  isOwner: boolean;
  pending: boolean;
  onLeave: () => void;
}

/** The "⋯" menu. Only Leave is backed by the API today. */
export function CommunityOptionsMenu({ canLeave, isOwner, pending, onLeave }: CommunityOptionsMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismissable<HTMLDivElement>(open, close);

  const soonItems = [
    t('communityPage.addToCustomFeed'),
    t('communityPage.removeFromFavorites'),
    t('communityPage.mute'),
  ];

  return (
    <div className="menu-anchor" ref={ref}>
      <button
        type="button"
        className="btn community-more-btn"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('communityPage.moreOptions')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {open && (
        <div className="menu-pop menu-pop-right community-menu" role="menu">
          {soonItems.map((label) => (
            <button key={label} type="button" role="menuitem" className="menu-pop-item" disabled>
              {label}
              <span className="badge badge-soon">{t('communityPage.soon')}</span>
            </button>
          ))}

          {canLeave && (
            <button
              type="button"
              role="menuitem"
              className="menu-pop-item menu-pop-item-danger"
              disabled={isOwner || pending}
              title={isOwner ? t('communityPage.ownerCannotLeave') : undefined}
              onClick={() => {
                close();
                onLeave();
              }}
            >
              {t('communityPage.leave')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
