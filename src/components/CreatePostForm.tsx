import { useState } from 'react';
import { getApiErrorMessage, postsApi } from '../services/api';
import { useI18n } from '../i18n/I18nContext';
import type { Community } from '../types';

interface CreatePostFormProps {
  communities: Community[];
  defaultCommunityId: number | null;
  onCreated: () => void;
  onCancel: () => void;
}

/**
 * Composer backed by `POST /posts`. The backend only lets members post, so a
 * 403 is surfaced as-is instead of a generic failure.
 */
export function CreatePostForm({
  communities,
  defaultCommunityId,
  onCreated,
  onCancel,
}: CreatePostFormProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [communityId, setCommunityId] = useState<number | null>(defaultCommunityId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = title.trim().length > 0 && communityId !== null && !submitting;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || communityId === null) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await postsApi.create({
        title: title.trim(),
        content: content.trim(),
        communityId,
      });
      onCreated();
    } catch (err) {
      setError(getApiErrorMessage(err, t('composer.failed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <h2 className="composer-title">{t('composer.title')}</h2>

      <label className="field">
        <span className="field-label">{t('composer.community')}</span>
        <select
          className="field-control"
          value={communityId ?? ''}
          onChange={(event) => setCommunityId(Number(event.target.value) || null)}
          required
        >
          <option value="" disabled>
            {t('composer.chooseCommunity')}
          </option>
          {communities.map((community) => (
            <option key={community.id} value={community.id}>
              {community.displayName}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field-label">{t('composer.postTitle')}</span>
        <input
          className="field-control"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t('composer.titlePlaceholder')}
          maxLength={300}
          required
        />
      </label>

      <label className="field">
        <span className="field-label">
          {t('composer.body')} <span className="field-hint">{t('composer.optional')}</span>
        </span>
        <textarea
          className="field-control field-textarea"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={t('composer.bodyPlaceholder')}
          rows={5}
        />
      </label>

      {error && (
        <p className="composer-error" role="alert">
          {error}
        </p>
      )}

      <div className="composer-actions">
        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          {submitting ? t('composer.publishing') : t('composer.publish')}
        </button>
        <button type="button" className="btn" onClick={onCancel} disabled={submitting}>
          {t('composer.cancel')}
        </button>
      </div>
    </form>
  );
}