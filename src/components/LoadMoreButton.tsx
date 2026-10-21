import { useI18n } from '@/lib/i18n/I18nContext';

interface LoadMoreButtonProps {
  loading: boolean;
  onClick: () => void;
}

/** "Load more" footer shared by every paginated list. */
export function LoadMoreButton({ loading, onClick }: LoadMoreButtonProps) {
  const { t } = useI18n();

  return (
    <div className="load-more">
      <button className="btn" onClick={onClick} disabled={loading}>
        {loading ? t('feed.loading') : t('feed.loadMore')}
      </button>
    </div>
  );
}
