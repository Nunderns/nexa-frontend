import { useI18n } from '../i18n/I18nContext';
import type { Community } from '../types';

interface CommunitySidebarProps {
  communities: Community[];
  selectedCommunityId: number | null;
  loading: boolean;
  onSelect: (communityId: number | null) => void;
}

/**
 * Community rail for the home page. Selecting one filters the feed through
 * `GET /posts/community/:communityId`, so the choice maps to a real endpoint
 * instead of a client-side string match.
 */
export function CommunitySidebar({
  communities,
  selectedCommunityId,
  loading,
  onSelect,
}: CommunitySidebarProps) {
  const { t } = useI18n();

  return (
    <section className="sidebar-card">
      <header className="sidebar-card-header">
        <h2>{t('community.title')}</h2>
      </header>

      {loading ? (
        <ul className="community-list" aria-busy="true">
          {[0, 1, 2, 3].map((index) => (
            <li key={index} className="community-item">
              <div className="skeleton-line skeleton-line-md" />
            </li>
          ))}
        </ul>
      ) : communities.length === 0 ? (
        <p className="sidebar-empty">{t('community.empty')}</p>
      ) : (
        <ul className="community-list">
          <li>
            <button
              type="button"
              className={`community-item ${selectedCommunityId === null ? 'active' : ''}`}
              onClick={() => onSelect(null)}
            >
              <span className="community-item-body">
                <span className="community-name">{t('community.allPosts')}</span>
                <span className="community-meta">{t('community.allPostsMeta')}</span>
              </span>
            </button>
          </li>
          {communities.map((community) => (
            <li key={community.id}>
              <button
                type="button"
                className={`community-item ${selectedCommunityId === community.id ? 'active' : ''}`}
                onClick={() => onSelect(community.id)}
              >
                {community.iconUrl ? (
                  <img className="community-icon" src={community.iconUrl} alt="" />
                ) : (
                  <span className="community-icon community-icon-fallback" aria-hidden="true">
                    {community.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="community-item-body">
                  <span className="community-name">
                    {community.displayName}
                    {community.isPrivate && (
                      <span className="badge badge-private">{t('community.private')}</span>
                    )}
                  </span>
                  <span className="community-meta">
                    {community.memberCount === 1
                      ? t('community.oneMember', { count: community.memberCount })
                      : t('community.members', { count: community.memberCount })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}