import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <div className="landing-container">
      <main className="landing-card not-found-card">
        <p className="not-found-code">404</p>
        <h1 className="landing-title">{t('landing.notFound')}</h1>
        <p className="landing-subtitle">{t('landing.notFoundBody')}</p>
        <Link to="/home" className="btn btn-primary">
          {t('landing.goToNexa')}
        </Link>
      </main>
    </div>
  );
}