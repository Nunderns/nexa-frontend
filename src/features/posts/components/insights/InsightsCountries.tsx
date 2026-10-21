import { useI18n } from '@/lib/i18n/I18nContext';
import type { PostInsights } from '../../types/insights';
import { barWidthClass, countryFlag, countryName, formatPercentage } from '../../utils/insights';

export function InsightsCountries({ insights }: { insights: PostInsights }) {
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
