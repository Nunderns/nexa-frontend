import { Link } from 'react-router-dom';
import { communityPath } from '@/config/paths';
import { useI18n } from '@/lib/i18n/I18nContext';
import type { Community, CommunityMembership } from '@/types/api';
import { isModerator } from '../utils/membership';
import { CommunityOptionsMenu } from './CommunityOptionsMenu';

interface CommunityHeroProps {
  community: Community;
  membership: CommunityMembership | null;
  actionPending: boolean;
  composerOpen: boolean;
  onToggleComposer: () => void;
  onJoin: () => void;
  onLeave: () => void;
}

/**
 * Banner, icon, name and the membership actions. Notifications has no API
 * yet, so it renders disabled rather than pretending to work.
 */
export function CommunityHero({
  community,
  membership,
  actionPending,
  composerOpen,
  onToggleComposer,
  onJoin,
  onLeave,
}: CommunityHeroProps) {
  const { t } = useI18n();

  const isMember = membership?.role != null;
  const canJoin = !isMember && !membership?.isBanned && !community.isPrivate;

  return (
    <header className="community-hero">
      <div
        className="community-banner"
        style={community.bannerUrl ? { backgroundImage: `url(${JSON.stringify(community.bannerUrl)})` } : undefined}
        role="img"
        aria-label={t('communityPage.bannerAlt', { community: community.displayName })}
      />
      <div className="community-hero-inner">
        {community.iconUrl ? (
          <img className="community-hero-icon" src={community.iconUrl} alt="" />
        ) : (
          <span className="community-hero-icon community-icon-fallback" aria-hidden="true">
            {community.displayName.charAt(0).toUpperCase()}
          </span>
        )}

        <div className="community-hero-titles">
          <h1 className="community-hero-name">{community.displayName}</h1>
          <span className="community-hero-handle">c/{community.name}</span>
        </div>

        <div className="community-hero-actions">
          {isMember && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onToggleComposer}
              aria-expanded={composerOpen}
            >
              {t('communityPage.post')}
            </button>
          )}

          {canJoin && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onJoin}
              disabled={actionPending}
            >
              {t('communityPage.join')}
            </button>
          )}

          {isMember && (
            <button
              type="button"
              className="btn"
              disabled
              title={t('communityPage.comingSoon')}
            >
              {t('communityPage.notifications')}
            </button>
          )}

          {isModerator(membership) && (
            <Link to={`${communityPath(community.name)}/mod`} className="btn">
              {t('communityPage.moderation')}
            </Link>
          )}

          <CommunityOptionsMenu
            canLeave={isMember}
            isOwner={membership?.role === 'OWNER'}
            pending={actionPending}
            onLeave={onLeave}
          />
        </div>
      </div>
    </header>
  );
}
