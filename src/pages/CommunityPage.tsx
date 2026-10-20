import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { communitiesApi, getApiErrorMessage, postsApi } from '../services/api';
import { CreatePostForm } from '../components/CreatePostForm';
import { communityPath, formatScore, PostCard } from '../components/PostCard';
import { TopBar } from '../components/TopBar';
import { useDismissable } from '../hooks/useDismissable';
import { useI18n } from '../i18n/I18nContext';
import type { Community, CommunityMembership, CommunityStats, Post } from '../types';

const PAGE_SIZE = 10;

function statusOf(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}

export function isModerator(membership: CommunityMembership | null): boolean {
  return membership?.role === 'OWNER' || membership?.role === 'MODERATOR';
}

/**
 * `/c/:name`: header with banner and icon, the community's posts, and an
 * "about" card. Notifications, custom feeds, favorites and mute have no API
 * yet, so they render disabled rather than pretending to work.
 */
export function CommunityPage() {
  const { name = '' } = useParams<{ name: string }>();
  const { t, locale } = useI18n();

  const [community, setCommunity] = useState<Community | null>(null);
  const [membership, setMembership] = useState<CommunityMembership | null>(null);
  const [stats, setStats] = useState<CommunityStats | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [postsLocked, setPostsLocked] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  /** Everything below the community record depends on membership, so it reloads together. */
  const loadDetails = useCallback(async (target: Community) => {
    const [membershipResult, statsResult, postsResult] = await Promise.allSettled([
      communitiesApi.getMembership(target.id),
      communitiesApi.getStats(target.id),
      postsApi.getByCommunity(target.id, 1, PAGE_SIZE),
    ]);

    setMembership(membershipResult.status === 'fulfilled' ? membershipResult.value : null);
    // Stats are secondary: a failure only hides the block.
    setStats(statsResult.status === 'fulfilled' ? statsResult.value : null);

    if (postsResult.status === 'fulfilled') {
      setPosts(postsResult.value.data);
      setTotalPages(postsResult.value.totalPages);
      setPostsLocked(false);
    } else {
      setPosts([]);
      setTotalPages(1);
      setPostsLocked(statusOf(postsResult.reason) === 403);
      if (statusOf(postsResult.reason) !== 403) {
        setError(getApiErrorMessage(postsResult.reason, t('communityPage.loadFailed')));
      }
    }
    setPage(1);
  }, [t]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setNotFound(false);
      setShowComposer(false);

      try {
        const found = await communitiesApi.getByName(name);
        if (cancelled) {
          return;
        }
        setCommunity(found);
        await loadDetails(found);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setCommunity(null);
        if (statusOf(err) === 404) {
          setNotFound(true);
        } else {
          setError(getApiErrorMessage(err, t('communityPage.loadFailed')));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // `t` is left out on purpose: switching language must not refetch.
  }, [name]);

  const runAction = async (action: (id: number) => Promise<void>) => {
    if (!community || actionPending) {
      return;
    }
    setActionPending(true);
    setError(null);
    try {
      await action(community.id);
      const refreshed = await communitiesApi.getById(community.id);
      setCommunity(refreshed);
      await loadDetails(refreshed);
    } catch (err) {
      setError(getApiErrorMessage(err, t('communityPage.actionFailed')));
    } finally {
      setActionPending(false);
    }
  };

  const handleLeave = () => {
    if (community && window.confirm(t('communityPage.leaveConfirm', { community: community.displayName }))) {
      void runAction(communitiesApi.leave);
    }
  };

  const handleLoadMore = async () => {
    if (!community) {
      return;
    }
    const next = page + 1;
    setLoadingMore(true);
    try {
      const response = await postsApi.getByCommunity(community.id, next, PAGE_SIZE);
      setPosts((current) => [...current, ...response.data]);
      setTotalPages(response.totalPages);
      setPage(next);
    } catch (err) {
      setError(getApiErrorMessage(err, t('communityPage.loadFailed')));
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePostCreated = async () => {
    setShowComposer(false);
    if (community) {
      await loadDetails(community);
    }
  };

  if (loading || notFound || !community) {
    return (
      <div className="home-shell">
        <TopBar />
        <div className="home-layout">
          <main className="home-main">
            {loading ? (
              <p className="feed-empty" aria-busy="true">{t('feed.loading')}</p>
            ) : (
              <div className="feed-empty">
                <h2>{notFound ? t('communityPage.notFound') : t('communityPage.loadFailed')}</h2>
                {error && <p role="alert">{error}</p>}
                <p>
                  <Link to="/home">{t('communityPage.backHome')}</Link>
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  const isMember = membership?.role != null;
  const canJoin = !isMember && !membership?.isBanned && !community.isPrivate;

  return (
    <div className="home-shell">
      <TopBar />

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
                onClick={() => setShowComposer((open) => !open)}
                aria-expanded={showComposer}
              >
                {t('communityPage.post')}
              </button>
            )}

            {canJoin && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void runAction(communitiesApi.join)}
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
              onLeave={handleLeave}
            />
          </div>
        </div>
      </header>

      <div className="home-layout">
        <main className="home-main">
          {showComposer && (
            <CreatePostForm
              defaultCommunityId={community.id}
              onCreated={() => void handlePostCreated()}
              onCancel={() => setShowComposer(false)}
            />
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {membership?.isBanned && (
            <p className="form-error" role="status">
              {t('communityPage.banned')}
            </p>
          )}

          {postsLocked ? (
            <div className="feed-empty">
              <h2>{t('community.private')}</h2>
              <p>{t('communityPage.privateLocked')}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="feed-empty">
              <h2>{t('feed.emptyTitle')}</h2>
              <p>{t('feed.emptyCommunityBody', { community: community.displayName })}</p>
            </div>
          ) : (
            <>
              <ul className="post-list">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </ul>
              {page < totalPages && (
                <div className="load-more">
                  <button className="btn" onClick={() => void handleLoadMore()} disabled={loadingMore}>
                    {loadingMore ? t('feed.loading') : t('feed.loadMore')}
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        <aside className="home-sidebar">
          <section className="sidebar-card community-about">
            <header className="sidebar-card-header">
              <h2>{t('communityPage.about')}</h2>
            </header>

            <div className="community-about-body">
              <p className="community-about-description">
                {community.description || t('communityPage.noDescription')}
              </p>

              <dl className="community-facts">
                <div>
                  <dt>{t('communityPage.created')}</dt>
                  <dd>
                    <time dateTime={community.createdAt}>
                      {new Date(community.createdAt).toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt>{t('communityPage.visibility')}</dt>
                  <dd>{community.isPrivate ? t('community.private') : t('communityPage.public')}</dd>
                </div>
                <div>
                  <dt>{t('communityPage.contentType')}</dt>
                  <dd>
                    {community.isNsfw ? (
                      <span className="badge badge-nsfw">{t('communityPage.adult')}</span>
                    ) : (
                      t('communityPage.general')
                    )}
                  </dd>
                </div>
              </dl>

              {stats && (
                <div className="community-stats">
                  <h3>{t('communityPage.thisWeek')}</h3>
                  <dl className="community-stats-grid">
                    <div>
                      <dt>{t('communityPage.visitors')}</dt>
                      <dd>{formatScore(stats.visitors)}</dd>
                    </div>
                    <div>
                      <dt>{t('communityPage.contributions')}</dt>
                      <dd>{formatScore(stats.contributions)}</dd>
                    </div>
                  </dl>
                </div>
              )}

              <span className="community-about-link is-disabled" aria-disabled="true">
                {t('communityPage.modGuide')}
                <span className="badge badge-soon">{t('communityPage.soon')}</span>
              </span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

interface CommunityOptionsMenuProps {
  canLeave: boolean;
  isOwner: boolean;
  pending: boolean;
  onLeave: () => void;
}

/** The "⋯" menu. Only Leave is backed by the API today. */
function CommunityOptionsMenu({ canLeave, isOwner, pending, onLeave }: CommunityOptionsMenuProps) {
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
