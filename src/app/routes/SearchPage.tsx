import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/app/layouts/PageLayout';
import { LoadMoreButton } from '@/components/LoadMoreButton';
import { PostCard } from '@/features/posts/components/PostCard';
import { PostListSkeleton } from '@/features/posts/components/PostListSkeleton';
import { isSearchType, searchApi, SEARCH_TYPES, type SearchType } from '@/features/search/api/search';
import { CommunityResult, UserResult } from '@/features/search/components/SearchResultItems';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { getApiErrorMessage } from '@/lib/api-client';
import { useI18n } from '@/lib/i18n/I18nContext';
import type { TranslationKey } from '@/lib/i18n/translations';
import type { Community, Post, User } from '@/types/api';

const PAGE_SIZE = 10;

const TAB_LABELS: Record<SearchType, TranslationKey> = {
  posts: 'search.tabPosts',
  communities: 'search.tabCommunities',
  users: 'search.tabUsers',
};

/**
 * `/search?q=react&type=communities`. The term and the tab live in the URL, so
 * a result page is linkable and the back button walks through the tabs.
 */
export function SearchPage() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();
  const typeParam = searchParams.get('type');
  const type: SearchType = isSearchType(typeParam) ? typeParam : 'posts';

  const selectType = (next: SearchType) => {
    setSearchParams(next === 'posts' ? { q: query } : { q: query, type: next });
  };

  return (
    <PageLayout>
      <div className="feed-toolbar">
        <h1 className="feed-heading">
          {query ? t('search.resultsFor', { query }) : t('search.title')}
        </h1>
      </div>

      {!query ? (
        <div className="feed-empty">
          <h2>{t('search.promptTitle')}</h2>
          <p>{t('search.promptBody')}</p>
        </div>
      ) : (
        <>
          <div className="tab-bar" role="tablist" aria-label={t('search.title')}>
            {SEARCH_TYPES.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                id={`search-tab-${option}`}
                aria-selected={option === type}
                aria-controls="search-panel"
                className={`tab ${option === type ? 'active' : ''}`}
                onClick={() => selectType(option)}
              >
                {t(TAB_LABELS[option])}
              </button>
            ))}
          </div>

          <div role="tabpanel" id="search-panel" aria-labelledby={`search-tab-${type}`}>
            <SearchResultList key={`${type}|${query}`} type={type} query={query} />
          </div>
        </>
      )}
    </PageLayout>
  );
}

function SearchResultList({ type, query }: { type: SearchType; query: string }) {
  const { t } = useI18n();
  const { items, total, loading, loadingMore, error, hasMore, loadMore } = usePaginatedList(
    `${type}|${query}`,
    (page) => searchApi.search(type, query, page, PAGE_SIZE),
  );

  if (loading) {
    return <PostListSkeleton label={t('nav.search')} />;
  }

  if (error) {
    return (
      <p className="form-error" role="alert">
        {getApiErrorMessage(error, t('search.failed'))}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="feed-empty">
        <h2>{t('search.emptyTitle')}</h2>
        <p>{t('search.emptyBody')}</p>
      </div>
    );
  }

  return (
    <>
      <p className="feed-count">
        {total === 1
          ? t('search.resultsCount', { count: total })
          : t('search.resultsCountPlural', { count: total })}
      </p>

      {type === 'posts' ? (
        <ul className="post-list">
          {(items as Post[]).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </ul>
      ) : type === 'communities' ? (
        <ul className="search-result-list">
          {(items as Community[]).map((community) => (
            <CommunityResult key={community.id} community={community} />
          ))}
        </ul>
      ) : (
        <ul className="search-result-list">
          {(items as User[]).map((user) => (
            <UserResult key={user.id} user={user} />
          ))}
        </ul>
      )}

      {hasMore && <LoadMoreButton loading={loadingMore} onClick={() => void loadMore()} />}
    </>
  );
}
