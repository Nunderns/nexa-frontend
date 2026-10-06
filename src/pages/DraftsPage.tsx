import { Link } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useI18n } from '../i18n/I18nContext';

/**
 * Drafts. The API has no draft concept (no model, no endpoint), so this is a
 * plain empty state until the backend adds one.
 */
export function DraftsPage() {
  const { t } = useI18n();

  return (
    <div className="home-shell">
      <TopBar />

      <div className="home-layout">
        <main className="home-main">
          <h1 className="page-title">{t('drafts.title')}</h1>

          <div className="feed-empty">
            <h2>{t('drafts.emptyTitle')}</h2>
            <p>{t('drafts.emptyBody')}</p>
            <Link to="/home" className="btn btn-primary">
              {t('profile.goToFeed')}
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}