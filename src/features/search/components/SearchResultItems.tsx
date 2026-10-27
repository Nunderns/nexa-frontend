import { Link } from 'react-router-dom';
import { communityPath } from '@/config/paths';
import { useI18n } from '@/lib/i18n/I18nContext';
import type { Community, User } from '@/types/api';

export function CommunityResult({ community }: { community: Community }) {
  const { t } = useI18n();

  return (
    <li className="search-result">
      <Link to={communityPath(community.name)} className="search-result-link">
        <SearchResultImage src={community.iconUrl} fallback={community.name} />
        <span className="search-result-text">
          <span className="search-result-title">{community.displayName}</span>
          <span className="search-result-meta">
            c/{community.name} · {t('community.members', { count: community.memberCount })}
          </span>
          {community.description && (
            <span className="search-result-body">{community.description}</span>
          )}
        </span>
      </Link>
    </li>
  );
}

/** Not a link: there is no public profile page for other users yet. */
export function UserResult({ user }: { user: User }) {
  const { t } = useI18n();

  return (
    <li className="search-result">
      <div className="search-result-link">
        <SearchResultImage src={user.avatarUrl} fallback={user.username} round />
        <span className="search-result-text">
          <span className="search-result-title">{user.displayName}</span>
          <span className="search-result-meta">
            u/{user.username} · {t('profile.karma')} {user.karma}
          </span>
          {user.bio && <span className="search-result-body">{user.bio}</span>}
        </span>
      </div>
    </li>
  );
}

function SearchResultImage({
  src,
  fallback,
  round = false,
}: {
  src?: string | null;
  fallback: string;
  round?: boolean;
}) {
  const className = `search-result-image${round ? ' search-result-image-round' : ''}`;

  return src ? (
    <img className={className} src={src} alt="" />
  ) : (
    <span className={className} aria-hidden="true">
      {fallback.charAt(0).toUpperCase()}
    </span>
  );
}
