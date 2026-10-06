import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage, usersApi } from '../services/api';
import { TopBar } from '../components/TopBar';
import { useI18n } from '../i18n/I18nContext';
import type { User } from '../types';

interface ProfileDraft {
  displayName: string;
  bio: string;
  avatarUrl: string;
}

/**
 * Account settings. Backed by `PUT /users/:id`, which accepts displayName, bio
 * and avatarUrl (all optional server-side, so the draft is sent as-is).
 */
export function SettingsPage() {
  const { user: sessionUser } = useAuth();
  const { t } = useI18n();

  const [profile, setProfile] = useState<User | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>({ displayName: '', bio: '', avatarUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const userId = sessionUser?.id;

  // Hooks stay unconditional; the guard below renders after them.
  const loadProfile = useCallback(async () => {
    if (!userId) {
      return;
    }
    setLoading(true);
    try {
      const result = await usersApi.getById(userId);
      setProfile(result);
      setDraft({
        displayName: result.displayName ?? '',
        bio: result.bio ?? '',
        avatarUrl: result.avatarUrl ?? '',
      });
    } catch (err) {
      setError(getApiErrorMessage(err, t('settings.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (!userId) {
    return (
      <div className="home-shell">
        <TopBar />
        <div className="home-layout">
          <main className="home-main">
            <p className="form-error">{t('settings.needLogin')}</p>
          </main>
        </div>
      </div>
    );
  }

  const update = (field: keyof ProfileDraft) => (value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const updated = await usersApi.update(userId, {
        displayName: draft.displayName.trim(),
        bio: draft.bio.trim(),
        avatarUrl: draft.avatarUrl.trim(),
      });
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      // A 401 here means the guard refused the account (e.g. an unverified
      // email), not that the fields were wrong. Show the API's own message.
      setError(getApiErrorMessage(err, t('settings.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const canSave =
    !saving && draft.displayName.trim().length > 0 && !isUnchanged(profile, draft);

  return (
    <div className="home-shell">
      <TopBar />

      <div className="home-layout">
        <main className="home-main">
          <h1 className="page-title">{t('settings.title')}</h1>

          <form className="composer" onSubmit={handleSubmit}>
            <h2 className="composer-title">{t('settings.profile')}</h2>

            <label className="field">
              <span className="field-label">{t('settings.displayName')}</span>
              <input
                className="field-control"
                value={draft.displayName}
                onChange={(event) => update('displayName')(event.target.value)}
                maxLength={100}
                required
              />
            </label>

            <label className="field">
              <span className="field-label">{t('settings.bio')}</span>
              <textarea
                className="field-control field-textarea"
                value={draft.bio}
                onChange={(event) => update('bio')(event.target.value)}
                placeholder={t('settings.bioPlaceholder')}
                rows={4}
              />
            </label>

            <label className="field">
              <span className="field-label">
                {t('settings.avatarUrl')} <span className="field-hint">{t('composer.optional')}</span>
              </span>
              <input
                className="field-control"
                value={draft.avatarUrl}
                onChange={(event) => update('avatarUrl')(event.target.value)}
                placeholder={t('settings.avatarPlaceholder')}
                inputMode="url"
              />
            </label>

            {draft.avatarUrl && (
              <div className="avatar-preview">
                <img className="avatar-preview-img" src={draft.avatarUrl} alt="" />
                <span className="field-hint">{t('settings.avatarPreview')}</span>
              </div>
            )}

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            {saved && !error && (
              <p className="form-success" role="status">
                {t('settings.saved')}
              </p>
            )}

            <div className="composer-actions">
              <button type="submit" className="btn btn-primary" disabled={!canSave}>
                {saving ? t('settings.saving') : t('settings.save')}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => void loadProfile()}
                disabled={saving || loading}
              >
                {t('settings.discard')}
              </button>
            </div>
          </form>

          <section className="settings-block">
            <h2 className="composer-title">{t('settings.account')}</h2>
            <dl className="profile-stats">
              <div className="profile-stat">
                <dt>{t('settings.user')}</dt>
                <dd className="profile-stat-email">u/{profile?.username ?? '—'}</dd>
              </div>
              <div className="profile-stat">
                <dt>Email</dt>
                <dd className="profile-stat-email">{profile?.email ?? '—'}</dd>
              </div>
              <div className="profile-stat">
                <dt>{t('profile.karma')}</dt>
                <dd>{profile ? profile.karma : '—'}</dd>
              </div>
            </dl>
            <p className="field-hint">
              {t('settings.immutableNote')}{' '}
              <Link to="/profile" className="link-button">
                {t('settings.viewProfile')}
              </Link>
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}

function isUnchanged(profile: User | null, draft: ProfileDraft): boolean {
  if (!profile) {
    return true;
  }
  return (
    (profile.displayName ?? '') === draft.displayName.trim() &&
    (profile.bio ?? '') === draft.bio.trim() &&
    (profile.avatarUrl ?? '') === draft.avatarUrl.trim()
  );
}