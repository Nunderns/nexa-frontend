import type { IconType } from 'react-icons';
import { RiFileTextLine, RiImageLine, RiLink, RiVideoLine } from 'react-icons/ri';
import { useI18n } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';
import type { PostType } from '../types';

const POST_TYPES: { id: PostType; label: TranslationKey; icon: IconType }[] = [
  { id: 'TEXT', label: 'composer.typeText', icon: RiFileTextLine },
  { id: 'IMAGE', label: 'composer.typeImage', icon: RiImageLine },
  { id: 'VIDEO', label: 'composer.typeVideo', icon: RiVideoLine },
  { id: 'LINK', label: 'composer.typeLink', icon: RiLink },
];

interface PostTypeBarProps {
  value: PostType;
  onChange: (type: PostType) => void;
  disabled?: boolean;
}

/** Segmented control for the composer, one tab per backend `PostType`. */
export function PostTypeBar({ value, onChange, disabled = false }: PostTypeBarProps) {
  const { t } = useI18n();

  return (
    <div className="tab-bar post-type-bar" role="tablist" aria-label={t('composer.typeLabel')}>
      {POST_TYPES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          className={`tab post-type-tab ${value === id ? 'active' : ''}`}
          onClick={() => onChange(id)}
          disabled={disabled}
        >
          <Icon aria-hidden="true" />
          {t(label)}
        </button>
      ))}
    </div>
  );
}
