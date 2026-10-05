import { useState } from 'react';
import { getApiErrorMessage, postsApi } from '../services/api';
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
      setError(getApiErrorMessage(err, 'Could not publish your post. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <h2 className="composer-title">Create a post</h2>

      <label className="field">
        <span className="field-label">Community</span>
        <select
          className="field-control"
          value={communityId ?? ''}
          onChange={(event) => setCommunityId(Number(event.target.value) || null)}
          required
        >
          <option value="" disabled>
            Choose a community
          </option>
          {communities.map((community) => (
            <option key={community.id} value={community.id}>
              {community.displayName}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field-label">Title</span>
        <input
          className="field-control"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="An interesting title"
          maxLength={300}
          required
        />
      </label>

      <label className="field">
        <span className="field-label">
          Body <span className="field-hint">(optional)</span>
        </span>
        <textarea
          className="field-control field-textarea"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Share the details"
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
          {submitting ? 'Publishing...' : 'Publish'}
        </button>
        <button type="button" className="btn" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}