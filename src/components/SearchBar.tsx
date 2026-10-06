import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';

/**
 * Topbar search. The term lives in the URL (`/search?q=...`) so a result page
 * is linkable and survives a refresh.
 */
export function SearchBar() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const queryFromUrl = searchParams.get('q') ?? '';
  const [term, setTerm] = useState(queryFromUrl);

  // Keep the field in sync when the URL changes (back/forward, or a new search).
  useEffect(() => {
    setTerm(queryFromUrl);
  }, [queryFromUrl]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = term.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  };

  return (
    <form className="search-bar" role="search" onSubmit={handleSubmit}>
      <svg className="search-bar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        type="search"
        className="search-bar-input"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder={t('nav.searchPlaceholder')}
        aria-label={t('nav.searchLabel')}
      />
    </form>
  );
}