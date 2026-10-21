import type { Translate } from '@/lib/i18n/I18nContext';

export function formatJoinDate(isoString: string, t: Translate): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return t('profile.recently');
  }
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(value);
}
