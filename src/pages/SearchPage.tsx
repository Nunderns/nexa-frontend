import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { getApiErrorMessage, postsApi } from '../services/api';
import { PostCard } from '../components/PostCard';
import { TopBar } from '../components/TopBar';
import type { Post } from '../types';

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

  const results = useMemo(() => {
    if (!query) {
      return [];
    }
    const needle = query.toLowerCase();
    return posts.filter((post) => {
      const inTitle = post.title?.toLowerCase().includes(needle);
      const inBody = post.content?.toLowerCase().includes(needle);
      const inCommunity = post.community?.name.toLowerCase().includes(needle);
      const inCommunityDisplay = post.community?.displayName.toLowerCase().includes(needle);
      const inAuthor = post.author?.username.toLowerCase().includes(needle);
      return Boolean(inTitle || inBody || inCommunity || inCommunityDisplay || inAuthor);
    });
  }, [posts, query]);

  return (
    <div className="home-shell">
      <TopBar />

      <div className="home-layout">
        <main className="home-main">
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
        </main>
      </div>
    </div>
  );
}

function PostListSkeleton({ label }: { label: string }) {
  return (
    <ul className="post-list" aria-busy="true" aria-label={label}>
      {[0, 1, 2].map((index) => (
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