import { useCallback, useEffect, useState } from 'react';
import { PageLayout } from '@/app/layouts/PageLayout';
import { LoadMoreButton } from '@/components/LoadMoreButton';
import { communitiesApi } from '@/features/communities/api/communities';
import { CommunitySidebar } from '@/features/communities/components/CommunitySidebar';
import { postsApi } from '@/features/posts/api/posts';
import { CreatePostForm } from '@/features/posts/components/CreatePostForm';
import { PostCard } from '@/features/posts/components/PostCard';
import { PostListSkeleton } from '@/features/posts/components/PostListSkeleton';
import { getApiErrorMessage } from '@/lib/api-client';
import { useI18n } from '@/lib/i18n/I18nContext';
import type { Community, Post } from '@/types/api';

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

  const fetchPage = useCallback(
    (targetPage: number) =>
      selectedCommunityId
        ? postsApi.getByCommunity(selectedCommunityId, targetPage, PAGE_SIZE)
        : postsApi.getAll(targetPage, PAGE_SIZE),
    [selectedCommunityId],
  );

  const loadFeed = useCallback(
    async (targetPage: number) => {
      const response = await fetchPage(targetPage);
      setPosts(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      return response;
    },
    [fetchPage],
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
      const response = await fetchPage(next);
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
    <PageLayout
      topBar={{
        showCreatePost: true,
        onCreatePost: () => setShowComposer((open) => !open),
        composerOpen: showComposer,
      }}
      aside={
        <CommunitySidebar
          communities={communities}
          selectedCommunityId={selectedCommunityId}
          loading={loading && communities.length === 0}
          onSelect={handleSelectCommunity}
        />
      }
    >
      {showComposer && (
        <CreatePostForm
          defaultCommunityId={selectedCommunityId}
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
        <PostListSkeleton label={t('feed.popular')} count={4} />
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

          {hasMore && <LoadMoreButton loading={loadingMore} onClick={() => void handleLoadMore()} />}
        </>
      )}

      {!loading && error && posts.length === 0 && (
        <div className="load-more">
          <button className="btn btn-primary" onClick={() => void handleRefresh()}>
            {t('feed.retry')}
          </button>
        </div>
      )}
    </PageLayout>
  );
}
