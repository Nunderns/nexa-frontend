import { useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';
import type { InsightsHourlyView } from '../../types/insights';
import {
  CHART_HEIGHT,
  CHART_PADDING_LEFT,
  CHART_WIDTH,
  MIN_BAR_WIDTH,
  niceStep,
  PLOT_HEIGHT,
  PLOT_WIDTH,
  TARGET_Y_TICKS,
} from '../../utils/insights';

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
