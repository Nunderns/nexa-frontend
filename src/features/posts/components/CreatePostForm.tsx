import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '@/lib/api-client';
import { useI18n } from '@/lib/i18n/I18nContext';
import type { Community, PostType } from '@/types/api';
import { getJoinedCommunities } from '../api/joined-communities';
import { mediaApi } from '../api/media';
import { postsApi } from '../api/posts';
import { isHttpUrl, isMediaType, MB, MEDIA_RULES } from '../utils/media-rules';
import { MediaField } from './MediaField';
import { PostTypeBar } from './PostTypeBar';

/** Joined communities can exceed one page in theory; 100 is the API maximum. */
const JOINED_LIMIT = 100;

interface CreatePostFormProps {
  /** Preselected when the user is a member of it, otherwise the first joined one. */
  defaultCommunityId: number | null;
  onCreated: () => void;
  onCancel: () => void;
}

/**
 * Composer backed by `POST /posts`. Only communities the user has joined are
 * offered, since the backend rejects posts from non-members with a 403.
 *
 * Image and video posts are created first and the file is then sent to
 * `POST /media/upload`, which needs the post id. If the upload fails the post
 * is deleted again so no empty media post is left in the feed.
 */
export function CreatePostForm({ defaultCommunityId, onCreated, onCancel }: CreatePostFormProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  // The raw error, translated at render time so a language switch does not refetch.
  const [loadError, setLoadError] = useState<unknown>(null);

  const [postType, setPostType] = useState<PostType>('TEXT');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [communityId, setCommunityId] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingCommunities(true);
      setLoadError(null);
      try {
        const response = await getJoinedCommunities(1, JOINED_LIMIT);
        if (cancelled) {
          return;
        }
        setCommunities(response.data);
        const preselected = response.data.some((community) => community.id === defaultCommunityId)
          ? defaultCommunityId
          : (response.data[0]?.id ?? null);
        setCommunityId(preselected);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err ?? new Error('load failed'));
        }
      } finally {
        if (!cancelled) {
          setLoadingCommunities(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [defaultCommunityId]);

  // Object URLs hold the file in memory until revoked.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const mediaRules = isMediaType(postType) ? MEDIA_RULES[postType] : null;
  const trimmedUrl = url.trim();
  const urlInvalid = postType === 'LINK' && trimmedUrl.length > 0 && !isHttpUrl(trimmedUrl);

  const fileError = (() => {
    if (!file || !mediaRules) {
      return null;
    }
    if (!mediaRules.accept.split(',').includes(file.type)) {
      return t('composer.fileUnsupported');
    }
    if (file.size > mediaRules.maxBytes) {
      return t('composer.fileTooLarge', { size: String(mediaRules.maxBytes / MB) });
    }
    return null;
  })();

  const contentReady =
    postType === 'TEXT' ||
    (postType === 'LINK' && trimmedUrl.length > 0 && !urlInvalid) ||
    (mediaRules !== null && file !== null && fileError === null);

  const canSubmit =
    title.trim().length > 0 && communityId !== null && contentReady && !submitting;

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTypeChange = (type: PostType) => {
    // A picked image is never a valid video and vice versa.
    if (type !== postType) {
      clearFile();
    }
    setPostType(type);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || communityId === null) {
      return;
    }

    setSubmitting(true);
    setError(null);

    let createdPostId: number | null = null;
    try {
      const post = await postsApi.create({
        title: title.trim(),
        content: postType === 'LINK' ? trimmedUrl : content.trim(),
        communityId,
        postType,
      });
      createdPostId = post.id;

      if (mediaRules && file) {
        setUploadProgress(0);
        await mediaApi.uploadFile(post.id, file, setUploadProgress);
      }

      onCreated();
    } catch (err) {
      if (createdPostId !== null && mediaRules) {
        await postsApi.remove(createdPostId).catch(() => undefined);
      }
      setError(
        getApiErrorMessage(err, t(mediaRules ? 'composer.uploadFailed' : 'composer.failed')),
      );
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (loadingCommunities) {
    return (
      <div className="composer" aria-busy="true">
        <div className="skeleton-line skeleton-line-md" />
        <div className="skeleton-line skeleton-line-sm" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="composer">
        <p className="composer-error" role="alert">
          {getApiErrorMessage(loadError, t('feed.loadFailed'))}
        </p>
        <div className="composer-actions">
          <button type="button" className="btn" onClick={onCancel}>
            {t('composer.cancel')}
          </button>
        </div>
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <div className="composer composer-empty">
        <h2 className="composer-title">{t('composer.noJoinedTitle')}</h2>
        <p>{t('composer.noJoinedBody')}</p>
        <div className="composer-actions">
          <Link to="/home" className="btn btn-primary">
            {t('composer.browseCommunities')}
          </Link>
          <button type="button" className="btn" onClick={onCancel}>
            {t('composer.cancel')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <h2 className="composer-title">{t('composer.title')}</h2>

      <PostTypeBar value={postType} onChange={handleTypeChange} disabled={submitting} />

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

      {mediaRules && isMediaType(postType) && (
        <MediaField
          postType={postType}
          rules={mediaRules}
          file={file}
          previewUrl={previewUrl}
          error={fileError}
          disabled={submitting}
          inputRef={fileInputRef}
          onSelect={setFile}
          onClear={clearFile}
        />
      )}

      {postType === 'LINK' && (
        <label className="field">
          <span className="field-label">{t('composer.url')}</span>
          <input
            className="field-control"
            type="url"
            inputMode="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder={t('composer.linkUrlPlaceholder')}
            aria-invalid={urlInvalid}
            required
          />
          {urlInvalid && <span className="field-error">{t('composer.invalidUrl')}</span>}
        </label>
      )}

      {postType !== 'LINK' && (
        <label className="field">
          <span className="field-label">
            {t(postType === 'TEXT' ? 'composer.body' : 'composer.caption')}{' '}
            <span className="field-hint">{t('composer.optional')}</span>
          </span>
          <textarea
            className="field-control field-textarea"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={t('composer.bodyPlaceholder')}
            rows={postType === 'TEXT' ? 5 : 3}
          />
        </label>
      )}

      {uploadProgress !== null && (
        <div className="upload-progress" role="status">
          <progress max={100} value={uploadProgress} />
          <span>{t('composer.uploading', { percent: String(uploadProgress) })}</span>
        </div>
      )}

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
