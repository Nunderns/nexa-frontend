import { useState } from 'react';
import { LOCALES, useI18n } from '@/lib/i18n/I18nContext';
import { useDismissable } from '@/hooks/useDismissable';
import { RiGlobalLine } from "react-icons/ri";

/**
 * Language switcher. The choice is persisted in localStorage and mirrored onto
 * `document.documentElement.lang`.
 */
export function LanguageMenu() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useDismissable<HTMLDivElement>(open, () => setOpen(false));

  const current = LOCALES.find((entry) => entry.code === locale) ?? LOCALES[0];

  return (
    <div className="menu-anchor" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('nav.language')}
        title={current.label}
      >
        <RiGlobalLine />
        <span className="icon-btn-tag">{current.short}</span>
      </button>

      {open && (
        <div className="menu-pop menu-pop-right" role="menu">
          <p className="menu-pop-title">{t('nav.language')}</p>
          {LOCALES.map((entry) => (
            <button
              key={entry.code}
              type="button"
              role="menuitemradio"
              aria-checked={entry.code === locale}
              className={`menu-pop-item ${entry.code === locale ? 'active' : ''}`}
              onClick={() => {
                setLocale(entry.code);
                setOpen(false);
              }}
            >
              <span className="menu-pop-check" aria-hidden="true">
                {entry.code === locale ? '✓' : ''}
              </span>
              {entry.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}