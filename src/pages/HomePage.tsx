import { useCallback, useEffect, useState } from 'react';
import { communitiesApi, getApiErrorMessage, postsApi } from '../services/api';
import { CommunitySidebar } from '../components/CommunitySidebar';
import { CreatePostForm } from '../components/CreatePostForm';
import { PostCard } from '../components/PostCard';
import { TopBar } from '../components/TopBar';
import { useI18n } from '../i18n/I18nContext';
import type { Community, Post } from '../types';

const PAGE_SIZE = 10;

/**
 * The authenticated landing view: the post feed plus the community list, both
 * served by the API. They are independent requests, so they load together.
 */
export function HomePage() {
  const { t } = useI18n();
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [showComposer, setShowComposer] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(
    async (targetPage: number) => {
      const response = selectedCommunityId
        ? await postsApi.getByCommunity(selectedCommunityId, targetPage, PAGE_SIZE)
        : await postsApi.getAll(targetPage, PAGE_SIZE);

      setPosts(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      return response;
    },
    [selectedCommunityId],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [communityResponse] = await Promise.all([
          communitiesApi.getAll(1, 20),
          loadFeed(page),
        ]);

        if (cancelled) {
          return;
        }
        setCommunities(communityResponse.data);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, t('feed.loadFailed')));
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
  }, [loadFeed, page]);

  const handleSelectCommunity = (communityId: number | null) => {
    setSelectedCommunityId(communityId);
    setPage(1);
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await loadFeed(page);
    } catch (err) {
      setError(getApiErrorMessage(err, t('feed.loadFailed')));
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    const next = page + 1;
    setLoadingMore(true);
    setError(null);

    try {
      const response = selectedCommunityId
        ? await postsApi.getByCommunity(selectedCommunityId, next, PAGE_SIZE)
        : await postsApi.getAll(next, PAGE_SIZE);

      setPosts((current) => [...current, ...response.data]);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      setPage(next);
    } catch (err) {
      setError(getApiErrorMessage(err, t('feed.loadFailed')));
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePostCreated = async () => {
    setShowComposer(false);
    setPage(1);
    setLoading(true);
    try {
      await loadFeed(1);
    } catch (err) {
      setError(getApiErrorMessage(err, t('feed.loadFailed')));
    } finally {
      setLoading(false);
    }
  };

  const selectedCommunity = communities.find(
    (community) => community.id === selectedCommunityId,
  );

  const hasMore = page < totalPages && posts.length < total;

  return (
    <div className="home-shell">
      <TopBar
        showCreatePost
        onCreatePost={() => setShowComposer((open) => !open)}
        composerOpen={showComposer}
      />

      <div className="home-layout">
        <main className="home-main">
          {showComposer && communities.length > 0 && (
            <CreatePostForm
              communities={communities}
              defaultCommunityId={selectedCommunityId ?? communities[0]?.id ?? null}
              onCreated={handlePostCreated}
              onCancel={() => setShowComposer(false)}
            />
          )}

          <div className="feed-toolbar">
            <h1 className="feed-heading">
              {selectedCommunity ? selectedCommunity.displayName : t('feed.popular')}
            </h1>
            <span className="feed-count">{loading ? '' : `${total} posts`}</span>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {loading ? (
            <PostListSkeleton label={t('feed.popular')} />
          ) : posts.length === 0 ? (
            <div className="feed-empty">
              <h2>{t('feed.emptyTitle')}</h2>
              <p>
                {selectedCommunity
                  ? t('feed.emptyCommunityBody', { community: selectedCommunity.displayName })
                  : t('feed.emptyBody')}
              </p>
            </div>
          ) : (
            <>
              <ul className="post-list">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </ul>

              {hasMore && (
                <div className="load-more">
                  <button className="btn" onClick={() => void handleLoadMore()} disabled={loadingMore}>
                    {loadingMore ? t('feed.loading') : t('feed.loadMore')}
                  </button>
                </div>
              )}
            </>
          )}

          {!loading && error && posts.length === 0 && (
            <div className="load-more">
              <button className="btn btn-primary" onClick={() => void handleRefresh()}>
                {t('feed.retry')}
              </button>
            </div>
          )}
        </main>

        <aside className="home-sidebar">
          <CommunitySidebar
            communities={communities}
            selectedCommunityId={selectedCommunityId}
            loading={loading && communities.length === 0}
            onSelect={handleSelectCommunity}
          />
        </aside>
      </div>
    </div>
  );
}

function PostListSkeleton({ label }: { label: string }) {
  return (
    <ul className="post-list" aria-busy="true" aria-label={label}>
      {[0, 1, 2, 3].map((index) => (
        <li key={index} className="post-card skeleton">
          <div className="post-vote" />
          <div className="post-content">
            <div className="skeleton-line skeleton-line-sm" />
            <div className="skeleton-line skeleton-line-lg" />
            <div className="skeleton-line skeleton-line-md" />
          </div>
        </li>
      ))}
    </ul>
  );
}