import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api-client';
import { useI18n } from '@/lib/i18n/I18nContext';
import type { TranslationKey } from '@/lib/i18n/translations';
import { notificationsApi } from '../api/notifications';
import type { NotificationPreferences as Preferences } from '../types';

const PREFERENCE_FIELDS: { key: keyof Preferences; label: TranslationKey }[] = [
  { key: 'postReplies', label: 'notifications.prefsPostReplies' },
  { key: 'commentReplies', label: 'notifications.prefsCommentReplies' },
  { key: 'mentions', label: 'notifications.prefsMentions' },
  { key: 'votes', label: 'notifications.prefsVotes' },
  { key: 'directMessages', label: 'notifications.prefsDirectMessages' },
];

/**
 * Backed by `GET`/`PATCH /notifications/preferences`. Each switch saves on
 * its own, optimistically, and rolls back if the API refuses it.
 */
export function NotificationPreferences() {
  const { t } = useI18n();
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [pending, setPending] = useState<keyof Preferences | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    notificationsApi
      .getPreferences()
      .then((result) => {
        if (!cancelled) setPrefs(result);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, t('notifications.prefsLoadFailed')));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const toggle = async (key: keyof Preferences) => {
    if (!prefs) {
      return;
    }
    const previous = prefs;
    const nextValue = !prefs[key];
    setPrefs({ ...prefs, [key]: nextValue });
    setPending(key);
    setError(null);
    try {
      setPrefs(await notificationsApi.updatePreferences({ [key]: nextValue }));
    } catch (err) {
      setPrefs(previous);
      setError(getApiErrorMessage(err, t('notifications.prefsSaveFailed')));
    } finally {
      setPending(null);
    }
  };

  return (
    <section className="settings-block">
      <h2 className="composer-title">{t('notifications.prefsTitle')}</h2>
      <p className="field-hint">{t('notifications.prefsHint')}</p>

      {PREFERENCE_FIELDS.map(({ key, label }) => (
        <label key={key} className="pref-toggle">
          <input
            type="checkbox"
            checked={prefs?.[key] ?? false}
            disabled={!prefs || pending !== null}
            onChange={() => void toggle(key)}
          />
          <span>{t(label)}</span>
        </label>
      ))}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
