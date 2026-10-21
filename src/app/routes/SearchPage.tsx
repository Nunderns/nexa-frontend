import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/app/layouts/PageLayout';
import { postsApi } from '@/features/posts/api/posts';
import { PostCard } from '@/features/posts/components/PostCard';
import { PostListSkeleton } from '@/features/posts/components/PostListSkeleton';
import { matchPosts } from '@/features/search/utils/match-posts';
import { getApiErrorMessage } from '@/lib/api-client';
import { useI18n } from '@/lib/i18n/I18nContext';
import type { Post } from '@/types/api';

/**
 * The API has no search endpoint, so results are matched client-side over a
 * single large page of posts (`limit` is capped at 100 by `PaginationDto`).
 * The scope is therefore "the most recent posts", not the whole archive.
 */
const SEARCH_WINDOW = 100;

export function SearchPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query) {
      setPosts([]);
      setSearched(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    postsApi
      .getAll(1, SEARCH_WINDOW)
      .then((response) => {
        if (!cancelled) {
          setPosts(response.data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, t('search.failed')));
          setPosts([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setSearched(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query, t]);

  const results = useMemo(() => matchPosts(posts, query), [posts, query]);

  return (
    <PageLayout>
      <div className="feed-toolbar">
        <h1 className="feed-heading">
          {query ? t('search.resultsFor', { query }) : t('search.title')}
        </h1>
        {query && !loading && searched && (
          <span className="feed-count">
            {results.length === 1
              ? t('search.resultsCount', { count: results.length })
              : t('search.resultsCountPlural', { count: results.length })}
          </span>
        )}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!query ? (
        <div className="feed-empty">
          <h2>{t('search.promptTitle')}</h2>
          <p>{t('search.promptBody')}</p>
        </div>
      ) : loading ? (
        <PostListSkeleton label={t('nav.search')} />
      ) : results.length === 0 ? (
        <div className="feed-empty">
          <h2>{t('search.emptyTitle')}</h2>
          <p>{t('search.emptyBody')}</p>
        </div>
      ) : (
        <ul className="post-list">
          {results.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </ul>
      )}
    </PageLayout>
  );
}
