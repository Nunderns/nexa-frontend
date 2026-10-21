import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageLayout } from '@/app/layouts/PageLayout';
import { LoadMoreButton } from '@/components/LoadMoreButton';
import { communitiesApi } from '@/features/communities/api/communities';
import { CommunityAbout } from '@/features/communities/components/CommunityAbout';
import { CommunityHero } from '@/features/communities/components/CommunityHero';
import { postsApi } from '@/features/posts/api/posts';
import { CreatePostForm } from '@/features/posts/components/CreatePostForm';
import { PostCard } from '@/features/posts/components/PostCard';
import { getApiErrorMessage, getErrorStatus } from '@/lib/api-client';
import { useI18n } from '@/lib/i18n/I18nContext';
import type { Community, CommunityMembership, CommunityStats, Post } from '@/types/api';

const PAGE_SIZE = 10;

/**
 * `/c/:name`: header with banner and icon, the community's posts, and an
 * "about" card. Notifications, custom feeds, favorites and mute have no API
 * yet, so they render disabled rather than pretending to work.
 */
export function CommunityPage() {
  const { name = '' } = useParams<{ name: string }>();
  const { t } = useI18n();

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
      setPostsLocked(getErrorStatus(postsResult.reason) === 403);
      if (getErrorStatus(postsResult.reason) !== 403) {
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
        if (getErrorStatus(err) === 404) {
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
      <PageLayout>
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
      </PageLayout>
    );
  }

  return (
    <PageLayout
      hero={
        <CommunityHero
          community={community}
          membership={membership}
          actionPending={actionPending}
          composerOpen={showComposer}
          onToggleComposer={() => setShowComposer((open) => !open)}
          onJoin={() => void runAction(communitiesApi.join)}
          onLeave={handleLeave}
        />
      }
      aside={<CommunityAbout community={community} stats={stats} />}
    >
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
            <LoadMoreButton loading={loadingMore} onClick={() => void handleLoadMore()} />
          )}
        </>
      )}
    </PageLayout>
  );
}
