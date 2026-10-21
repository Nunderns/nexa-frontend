import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LoadMoreButton } from '@/components/LoadMoreButton';
import { ProfileTabPanel } from '@/features/users/components/ProfileTabs';
import type { TabId } from '@/features/users/utils/profile-tabs';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { getApiErrorMessage } from '@/lib/api-client';
import { useI18n } from '@/lib/i18n/I18nContext';
import type { TranslationKey } from '@/lib/i18n/translations';
import type { Paginated } from '@/types/api';

interface ActivityTabProps<T> {
  tab: TabId;
  userId: number;
  fetchPage: (page: number) => Promise<Paginated<T>>;
  renderItem: (item: T) => ReactNode;
  skeleton: ReactNode;
  emptyTitle: TranslationKey;
  emptyBody: TranslationKey;
  errorFallback: TranslationKey;
}

/** One paginated list of the user's activity: posts, comments or votes. */
export function ActivityTab<T>({
  tab,
  userId,
  fetchPage,
  renderItem,
  skeleton,
  emptyTitle,
  emptyBody,
  errorFallback,
}: ActivityTabProps<T>) {
  const { t } = useI18n();
  const { items, loading, loadingMore, error, hasMore, loadMore } = usePaginatedList(userId, fetchPage);

  return (
    <ProfileTabPanel tab={tab}>
      {error != null && (
        <p className="form-error" role="alert">
          {getApiErrorMessage(error, t(errorFallback))}
        </p>
      )}

      {loading ? (
        skeleton
      ) : items.length === 0 ? (
        <div className="feed-empty">
          <h2>{t(emptyTitle)}</h2>
          <p>{t(emptyBody)}</p>
          <Link to="/home" className="btn btn-primary">
            {t('profile.goToFeed')}
          </Link>
        </div>
      ) : (
        <>
          <ul className="post-list">{items.map(renderItem)}</ul>
          {hasMore && <LoadMoreButton loading={loadingMore} onClick={() => void loadMore()} />}
        </>
      )}
    </ProfileTabPanel>
  );
}
