import type { Translate } from '@/lib/i18n/I18nContext';

/** `3.1k` style counts, shared so a score and a view count never render differently. */
export function formatScore(score: number): string {
  const absolute = Math.abs(score);
  if (absolute >= 1_000_000) {
    return `${(score / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (absolute >= 1_000) {
    return `${(score / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(score);
}

export function getTimeAgo(isoString: string, t: Translate): string {
  const past = new Date(isoString);
  if (Number.isNaN(past.getTime())) {
    return '';
  }

  const diffMs = Date.now() - past.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return t('time.now');
  if (diffMins < 60) return t('time.minutesAgo', { count: diffMins });
  if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
  if (diffDays < 7) return t('time.daysAgo', { count: diffDays });
  return past.toLocaleDateString();
}
