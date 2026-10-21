import { PageLayout } from '@/app/layouts/PageLayout';
import { NotificationPreferences } from '@/features/notifications/components/NotificationPreferences';
import { ProfileSettings } from '@/features/users/components/ProfileSettings';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n/I18nContext';

/** Account settings: profile fields, account details and notification switches. */
export function SettingsPage() {
  const { user: sessionUser } = useAuth();
  const { t } = useI18n();

  if (!sessionUser) {
    return (
      <PageLayout>
        <p className="form-error">{t('settings.needLogin')}</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <h1 className="page-title">{t('settings.title')}</h1>
      {/* Keyed by user so a different account never sees the previous draft. */}
      <ProfileSettings key={sessionUser.id} userId={sessionUser.id} sessionEmail={sessionUser.email} />
      <NotificationPreferences />
    </PageLayout>
  );
}
