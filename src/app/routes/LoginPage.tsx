import { AuthForm } from '@/features/auth/components/AuthForm';
import { useI18n } from '@/lib/i18n/I18nContext';

/**
 * First screen a visitor sees. Stays reachable only while signed out: the
 * `PublicOnlyRoute` guard redirects an authenticated user to `/home`.
 */
export function LoginPage() {
  const { t } = useI18n();

  return (
    <div className="landing-container">
      <main className="landing-card">
        <div className="landing-brand">
          <svg className="landing-logo" width="52" height="52" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="5" />
            <path d="M32 16L32 48M16 32L48 32" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          </svg>
          <h1 className="landing-title">{t('app.name')}</h1>
          <p className="landing-subtitle">{t('landing.subtitle')}</p>
        </div>

        <AuthForm />
      </main>
    </div>
  );
}
