import { Link } from 'react-router-dom';
import { PageLayout } from '@/app/layouts/PageLayout';
import { useI18n } from '@/lib/i18n/I18nContext';

/**
 * Drafts. The API has no draft concept (no model, no endpoint), so this is a
 * plain empty state until the backend adds one.
 */
export function DraftsPage() {
  const { t } = useI18n();

  return (
    <PageLayout>
      <h1 className="page-title">{t('drafts.title')}</h1>

      <div className="feed-empty">
        <h2>{t('drafts.emptyTitle')}</h2>
        <p>{t('drafts.emptyBody')}</p>
        <Link to="/home" className="btn btn-primary">
          {t('profile.goToFeed')}
        </Link>
      </div>
    </PageLayout>
  );
}