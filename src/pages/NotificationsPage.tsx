import { useI18n } from '../i18n/I18nContext';
import { TopBar } from '../components/TopBar';

/** No notification model or endpoint exists on the API yet. */
export function NotificationsPage() {
  const { t } = useI18n();

  return (
    <div className="home-shell">
      <TopBar />

      <div className="home-layout">
        <main className="home-main">
          <h1 className="page-title">{t('notifications.title')}</h1>

          <div className="feed-empty">
            <h2>{t('notifications.emptyTitle')}</h2>
            <p>{t('notifications.emptyBody')}</p>
          </div>
        </main>
      </div>
    </div>
  );
}