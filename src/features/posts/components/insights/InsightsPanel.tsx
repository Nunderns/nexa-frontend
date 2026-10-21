import { useI18n } from '@/lib/i18n/I18nContext';
import { formatScore } from '@/utils/format';
import type { PostInsights } from '../../types/insights';
import { InsightsChart } from './InsightsChart';
import { InsightsCountries } from './InsightsCountries';
import { InsightsEngagement } from './InsightsEngagement';

interface InsightsPanelProps {
  insights: PostInsights;
}

/**
 * The post detail analytics panel: reach, hourly views, countries and
 * engagement. Rendered only when the API returned insights, which it does for
 * the post author and community moderators.
 */
export function InsightsPanel({ insights }: InsightsPanelProps) {
  const { t } = useI18n();

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
                {formatScore(insights.reach.views)}
              </span>
              {insights.reach.viewsLast24h > 0 && (
                <span className="insights-reach-delta">
                  +{formatScore(insights.reach.viewsLast24h)}{' '}
                  {t('insights.viewsLast24h')}
                </span>
              )}
            </div>
          </div>

          <section className="insights-section">
            <h3 className="insights-section-title">{t('insights.hourly')}</h3>
            <InsightsChart
              hourlyViews={insights.hourlyViews}
              formatCount={formatScore}
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
