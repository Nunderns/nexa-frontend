import type { Translate } from '@/lib/i18n/I18nContext';
import type { TranslationKey } from '@/lib/i18n/translations';
import type { AppNotification } from '../types';

/**
 * The server's `body` is English only, so known types are rendered from the
 * local dictionary and `body` is the fallback (e.g. `SYSTEM`).
 */
export function describe(item: AppNotification, t: Translate): string {
  if (item.type === 'SYSTEM') {
    return item.body;
  }
  const actor = item.actor ? `@${item.actor.username}` : t('notifications.someone');
  return t(`notifications.type.${item.type}` as TranslationKey, { actor });
}

export function relativeTime(iso: string, t: Translate): string {
  const minutes = Math.floor((Date.now() - Date.parse(iso)) / 60_000);
  if (minutes < 1) return t('notifications.justNow');
  if (minutes < 60) return t('notifications.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('notifications.hoursAgo', { count: hours });
  return t('notifications.daysAgo', { count: Math.floor(hours / 24) });
}
