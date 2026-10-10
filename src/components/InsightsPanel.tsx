import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { formatScore } from './PostCard';
import type { InsightsHourlyView, PostInsights as PostInsightsData } from '../types';

/** Signature of the `t` function, used by the country-name helper. */
type Translate = ReturnType<typeof useI18n>['t'];

/**
 * Chart geometry, in a fixed viewBox so the bars scale with the container
 * instead of needing a measured width.
 */
const CHART_WIDTH = 640;
const CHART_HEIGHT = 180;
/** Room for the hour labels under the axis. */
const CHART_PADDING_BOTTOM = 26;
/**
 * Gutter on the left reserved for the y-axis labels, so they sit beside the
 * plot instead of on top of the first bars.
 */
const CHART_PADDING_LEFT = 34;
const PLOT_WIDTH = CHART_WIDTH - CHART_PADDING_LEFT;
const PLOT_HEIGHT = CHART_HEIGHT - CHART_PADDING_BOTTOM;

/** Bars thinner than this would render as a smear on narrow screens. */
const MIN_BAR_WIDTH = 2;

/**
 * Target gridline count. The actual number follows from the rounded step, so a
 * peak of 38 gets four gridlines and a peak of 41 gets three, rather than
 * gridlines labelled 13, 25 and 38.
 */
const TARGET_Y_TICKS = 4;

/** Steps a reader recognises as round: 1, 2, 5 and their multiples. */
const NICE_STEPS = [1, 2, 5];

/**
 * Rounds `raw` up to the next 1/2/5 x 10^n, which is what makes the axis
 * labels land on numbers people can hold in their head.
 */
function niceStep(raw: number): number {
  if (raw <= 0) {
    return 1;
  }

  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;

  const nice = NICE_STEPS.find((candidate) => normalized <= candidate) ?? 10;
  return nice * magnitude;
}

interface InsightsChartProps {
  hourlyViews: InsightsHourlyView[];
  formatCount: (value: number) => string;
}

/**
 * Hourly views as a bar chart, drawn as inline SVG.
 *
 * Hand-rolled because the project ships no charting dependency, and a bar
 * chart of 48 values is a few lines of geometry. The chart is decorative: the
 * numbers below it are the accessible source of truth, so the SVG is hidden
 * from assistive tech rather than being given a long `aria-label` nobody can
 * navigate.
 */
export function InsightsChart({ hourlyViews, formatCount }: InsightsChartProps) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState<number | null>(null);

  const chart = useMemo(() => {
    const peak = hourlyViews.reduce((max, point) => Math.max(max, point.views), 0);
    // The step is rounded first, then the ceiling derived from it, so every
    // gridline carries a round label and the tallest bar still fits.
    const step = niceStep(peak / TARGET_Y_TICKS);
    const ceiling = peak === 0 ? step : Math.ceil(peak / step) * step;

    const slotWidth =
      hourlyViews.length > 0 ? PLOT_WIDTH / hourlyViews.length : PLOT_WIDTH;
    const barWidth = Math.max(MIN_BAR_WIDTH, slotWidth * 0.62);

    const bars = hourlyViews.map((point, index) => {
      const ratio = peak === 0 ? 0 : point.views / ceiling;
      // A zero-height rect would be invisible, so it keeps a 1px stub that
      // still reads as "nothing happened here".
      const height = point.views === 0 ? 1 : Math.max(1, ratio * PLOT_HEIGHT);

      return {
        ...point,
        x: CHART_PADDING_LEFT + index * slotWidth + (slotWidth - barWidth) / 2,
        y: PLOT_HEIGHT - height,
        height,
        width: barWidth,
      };
    });

    const ticks: { value: number; y: number }[] = [];
    for (let value = step; value <= ceiling; value += step) {
      ticks.push({ value, y: PLOT_HEIGHT - (value / ceiling) * PLOT_HEIGHT });
    }

    return { bars, ticks };
  }, [hourlyViews]);

  const active = hovered === null ? null : chart.bars[hovered];

  return (
    <div className="insights-chart">
      <div className="insights-chart-scroll">
        <svg
          className="insights-chart-svg"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          role="presentation"
          aria-hidden="true"
        >
          {chart.ticks.map((tick) => (
            <g key={tick.value}>
              <line
                className="insights-chart-grid"
                x1={CHART_PADDING_LEFT}
                x2={CHART_WIDTH}
                y1={tick.y}
                y2={tick.y}
              />
              <text
                className="insights-chart-axis"
                x={CHART_PADDING_LEFT - 6}
                y={tick.y + 3}
                textAnchor="end"
              >
                {formatCount(tick.value)}
              </text>
            </g>
          ))}

          <line
            className="insights-chart-axis-line"
            x1={CHART_PADDING_LEFT}
            x2={CHART_WIDTH}
            y1={PLOT_HEIGHT}
            y2={PLOT_HEIGHT}
          />

          {chart.bars.map((bar, index) => (
            <rect
              key={bar.hour}
              className={`insights-bar ${index === hovered ? 'active' : ''}`}
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
      </div>

      <div className="insights-chart-footer">
        {active ? (
          <p className="insights-chart-tooltip">
            {t('insights.hourLabel', { hour: active.hour })} ·{' '}
            {formatCount(active.views)} {t('post.viewCount')}
          </p>
        ) : (
          <p className="insights-chart-hint">
            {t('insights.hourlyBody', { hours: hourlyViews.length })}
          </p>
        )}
      </div>
    </div>
  );
}

interface InsightsPanelProps {
  insights: PostInsightsData;
}

/**
 * The post detail analytics panel: reach, hourly views, countries and
 * engagement. Rendered only when the API returned insights, which it does for
 * the post author and community moderators.
 */
export function InsightsPanel({ insights }: InsightsPanelProps) {
  const { t } = useI18n();
  const formatCount = useFormatCount();

  const hasViews = insights.reach.views > 0;

  return (
    <section className="insights" aria-labelledby="insights-heading">
      <header className="insights-header">
        <h2 className="insights-heading" id="insights-heading">
          {t('insights.title')}
        </h2>
        <span className="insights-community">r/{insights.communityName}</span>
      </header>

      {!hasViews ? (
        <div className="insights-empty">
          <h3>{t('insights.emptyTitle')}</h3>
          <p>{t('insights.emptyBody')}</p>
        </div>
      ) : (
        <>
          <div className="insights-reach">
            <div className="insights-reach-main">
              <span className="insights-reach-label">{t('insights.reach')}</span>
              <span className="insights-reach-value">
                {formatCount(insights.reach.views)}
              </span>
              {insights.reach.viewsLast24h > 0 && (
                <span className="insights-reach-delta">
                  +{formatCount(insights.reach.viewsLast24h)}{' '}
                  {t('insights.viewsLast24h')}
                </span>
              )}
            </div>
          </div>

          <section className="insights-section">
            <h3 className="insights-section-title">{t('insights.hourly')}</h3>
            <InsightsChart
              hourlyViews={insights.hourlyViews}
              formatCount={formatCount}
            />
          </section>

          <section className="insights-section">
            <h3 className="insights-section-title">{t('insights.countries')}</h3>
            <InsightsCountries insights={insights} />
          </section>

          <section className="insights-section">
            <h3 className="insights-section-title">{t('insights.engagement')}</h3>
            <InsightsEngagement insights={insights} />
          </section>
        </>
      )}
    </section>
  );
}

function InsightsCountries({ insights }: { insights: PostInsightsData }) {
  const { t } = useI18n();

  const rows = [
    ...insights.countries.top,
    insights.countries.other,
  ].filter((row) => row.views > 0);

  if (rows.length === 0) {
    return <p className="insights-muted">{t('insights.emptyBody')}</p>;
  }

  // The widest bar sets the scale for the others, so the rows are comparable
  // with each other rather than each being normalised to 100%.
  const peak = rows.reduce((max, row) => Math.max(max, row.views), 0);

  return (
    <ul className="insights-country-list">
      {rows.map((row) => {
        const isOther = !insights.countries.top.some(
          (top) => top.countryCode === row.countryCode,
        );

        return (
          <li className="insights-country" key={`${isOther}-${row.countryCode}`}>
            <span className="insights-country-flag" aria-hidden="true">
              {countryFlag(row.countryCode)}
            </span>
            <span className="insights-country-name">
              {isOther ? t('insights.other') : countryName(row.countryCode, t)}
            </span>
            <span className="insights-country-share">
              {formatPercentage(row.percentage)}
            </span>
            <span
              className={`insights-country-bar ${barWidthClass(row.views, peak)}`}
              aria-hidden="true"
            />
          </li>
        );
      })}
    </ul>
  );
}

function InsightsEngagement({ insights }: { insights: PostInsightsData }) {
  const { t } = useI18n();
  const formatCount = useFormatCount();
  const { engagement } = insights;

  const stats = [
    { key: 'insights.upvotes', value: formatCount(engagement.upvotes) },
    {
      key: 'insights.upvoteRatio',
      value:
        engagement.upvoteRatio === null
          ? t('insights.noVotes')
          : formatPercentage(engagement.upvoteRatio),
    },
    { key: 'insights.comments', value: formatCount(engagement.comments) },
    { key: 'insights.shares', value: formatCount(engagement.shares) },
    { key: 'insights.reposts', value: formatCount(engagement.reposts) },
    { key: 'insights.awards', value: formatCount(engagement.awards) },
  ];

  return (
    <dl className="insights-engagement">
      {stats.map((stat) => (
        <div className="insights-engagement-item" key={stat.key}>
          <dt>{t(stat.key as Parameters<typeof t>[0])}</dt>
          <dd>{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * `3.1k` style counts. Delegates to the feed's own formatter so a score of
 * 3110 and a view count of 3110 never render differently.
 */
function useFormatCount(): (value: number) => string {
  return formatScore;
}

/**
 * One decimal, with a trailing `.0` dropped, so `32.8%` and `57%` both read
 * cleanly. Anything below a tenth of a percent is noise at this scale.
 */
function formatPercentage(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
}

/** Width of the widest bar, in percent, used as the denominator. */
const BAR_STEPS = 20;

/**
 * Bar widths come from a fixed ladder of classes rather than an inline style,
 * to stay consistent with the rest of the codebase, which carries every visual
 * in `style.css`. Twenty steps is finer than anyone can read off a comparison
 * bar, so the quantisation is not visible.
 */
function barWidthClass(views: number, peak: number): string {
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
function countryFlag(countryCode: string): string {
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
function countryName(countryCode: string, t: Translate): string {
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