import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { dictionaries, type TranslationKey } from './translations';

export const LOCALES = [
  { code: 'pt-BR', label: 'Português', short: 'PT' },
  { code: 'en', label: 'English', short: 'EN' },
] as const;

export type LocaleCode = (typeof LOCALES)[number]['code'];

const STORAGE_KEY = 'nexa_locale';

function isLocale(value: string): value is LocaleCode {
  return LOCALES.some((locale) => locale.code === value);
}

/** Falls back to Portuguese, then to the browser preference. */
function detectLocale(): LocaleCode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && isLocale(stored)) {
    return stored;
  }
  const preferred = navigator.language.toLowerCase();
  if (preferred.startsWith('en')) {
    return 'en';
  }
  return 'pt-BR';
}

type Interpolations = Record<string, string | number>;

interface I18nContextValue {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  /** Looks up a key and replaces `{placeholders}`. */
  t: (key: TranslationKey, values?: Interpolations) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(detectLocale);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: LocaleCode) => {
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, values?: Interpolations) => {
      const template = dictionaries[locale][key] ?? dictionaries['pt-BR'][key] ?? key;
      if (!values) {
        return template;
      }
      return template.replace(/\{(\w+)\}/g, (match, name: string) =>
        name in values ? String(values[name]) : match,
      );
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside an I18nProvider');
  }
  return context;
}

/** Picks the singular or plural key based on the count. */
export function plural(
  t: (key: TranslationKey, values?: Interpolations) => string,
  count: number,
  singularKey: TranslationKey,
  pluralKey: TranslationKey,
): string {
  return count === 1 ? t(singularKey, { count }) : t(pluralKey, { count });
}