import type { Translate } from '@/lib/i18n/I18nContext';

/**
 * Chart geometry, in a fixed viewBox so the bars scale with the container
 * instead of needing a measured width.
 */
export const CHART_WIDTH = 640;
export const CHART_HEIGHT = 180;
/** Room for the hour labels under the axis. */
const CHART_PADDING_BOTTOM = 26;
/**
 * Gutter on the left reserved for the y-axis labels, so they sit beside the
 * plot instead of on top of the first bars.
 */
export const CHART_PADDING_LEFT = 34;
export const PLOT_WIDTH = CHART_WIDTH - CHART_PADDING_LEFT;
export const PLOT_HEIGHT = CHART_HEIGHT - CHART_PADDING_BOTTOM;

/** Bars thinner than this would render as a smear on narrow screens. */
export const MIN_BAR_WIDTH = 2;

/**
 * Target gridline count. The actual number follows from the rounded step, so a
 * peak of 38 gets four gridlines and a peak of 41 gets three, rather than
 * gridlines labelled 13, 25 and 38.
 */
export const TARGET_Y_TICKS = 4;

/** Steps a reader recognises as round: 1, 2, 5 and their multiples. */
const NICE_STEPS = [1, 2, 5];

/**
 * Rounds `raw` up to the next 1/2/5 x 10^n, which is what makes the axis
 * labels land on numbers people can hold in their head.
 */
export function niceStep(raw: number): number {
  if (raw <= 0) {
    return 1;
  }

  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;

  const nice = NICE_STEPS.find((candidate) => normalized <= candidate) ?? 10;
  return nice * magnitude;
}


/**
 * One decimal, with a trailing `.0` dropped, so `32.8%` and `57%` both read
 * cleanly. Anything below a tenth of a percent is noise at this scale.
 */
export function formatPercentage(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
}

/** Width of the widest bar, in percent, used as the denominator. */
const BAR_STEPS = 20;

/**
 * Bar widths come from a fixed ladder of classes rather than an inline style,
 * to stay consistent with the rest of the codebase, which carries every visual
 * in the stylesheets (see `insights.css`). Twenty steps is finer than anyone can read off a comparison
 * bar, so the quantisation is not visible.
 */
export function barWidthClass(views: number, peak: number): string {
  if (peak <= 0 || views <= 0) {
    return 'w-0';
  }
  const step = Math.round((views / peak) * BAR_STEPS);
  return `w-${Math.min(BAR_STEPS, Math.max(1, step))}`;
}

/**
 * Regional indicator symbols, which render as a flag on platforms with an
 * emoji flag font. `XX` has no flag, so it falls back to a globe.
 */
export function countryFlag(countryCode: string): string {
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return '🏳️';
  }

  const base = 0x1f1e6;
  const upper = countryCode.toUpperCase();

  return String.fromCodePoint(
    base + (upper.charCodeAt(0) - 65),
    base + (upper.charCodeAt(1) - 65),
  );
}

/**
 * Country names via `Intl.DisplayNames`, so the panel is localised without a
 * hand-maintained table of 250 entries. Unsupported in older runtimes and for
 * the `XX` sentinel, where it degrades to the raw code.
 */
export function countryName(countryCode: string, t: Translate): string {
  if (countryCode === 'XX') {
    return t('insights.unknownCountry');
  }

  try {
    const displayNames = new Intl.DisplayNames(
      [document.documentElement.lang || 'pt-BR'],
      { type: 'region' },
    );
    return displayNames.of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}
