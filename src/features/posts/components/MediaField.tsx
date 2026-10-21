import type { RefObject } from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { MB, type MediaPostType, type MediaRule } from '../utils/media-rules';

interface MediaFieldProps {
  postType: MediaPostType;
  rules: MediaRule;
  file: File | null;
  previewUrl: string | null;
  error: string | null;
  disabled: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onSelect: (file: File | null) => void;
  onClear: () => void;
}

/** File picker for image and video posts, with a local preview once chosen. */
export function MediaField({
  postType,
  rules,
  file,
  previewUrl,
  error,
  disabled,
  inputRef,
  onSelect,
  onClear,
}: MediaFieldProps) {
  const { t } = useI18n();

  return (
    <div className="field">
      <span className="field-label">
        {t(postType === 'VIDEO' ? 'composer.videoFile' : 'composer.imageFile')}
      </span>

      {file && previewUrl ? (
        <div className="media-preview">
          {postType === 'VIDEO' ? (
            <video src={previewUrl} controls preload="metadata" />
          ) : (
            <img src={previewUrl} alt={file.name} />
          )}
          <div className="media-preview-meta">
            <span className="media-preview-name">{file.name}</span>
            <button type="button" className="btn" onClick={onClear} disabled={disabled}>
              {t('composer.removeFile')}
            </button>
          </div>
        </div>
      ) : (
        <label className="media-dropzone">
          <input
            ref={inputRef}
            type="file"
            className="visually-hidden"
            accept={rules.accept}
            onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
            required
          />
          <span className="media-dropzone-title">{t('composer.chooseFile')}</span>
          <span className="field-hint">
            {t('composer.fileHint', { size: String(rules.maxBytes / MB) })}
          </span>
        </label>
      )}

      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
