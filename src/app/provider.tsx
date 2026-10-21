import type { ReactNode } from 'react';
import { NotificationsProvider } from '@/features/notifications/stores/NotificationsContext';
import { AuthProvider } from '@/lib/auth';
import { I18nProvider } from '@/lib/i18n/I18nContext';

/** App-wide context. Order matters: notifications read the auth user. */
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <NotificationsProvider>{children}</NotificationsProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
