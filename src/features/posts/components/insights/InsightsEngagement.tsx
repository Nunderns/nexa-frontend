import { useI18n } from '@/lib/i18n/I18nContext';
import { formatScore } from '@/utils/format';
import type { PostInsights } from '../../types/insights';
import { formatPercentage } from '../../utils/insights';

export function InsightsEngagement({ insights }: { insights: PostInsights }) {
  const { t } = useI18n();
  const { engagement } = insights;

  const stats = [
    { key: 'insights.upvotes', value: formatScore(engagement.upvotes) },
    {
      key: 'insights.upvoteRatio',
      value:
        engagement.upvoteRatio === null
          ? t('insights.noVotes')
          : formatPercentage(engagement.upvoteRatio),
    },
    { key: 'insights.comments', value: formatScore(engagement.comments) },
    { key: 'insights.shares', value: formatScore(engagement.shares) },
    { key: 'insights.reposts', value: formatScore(engagement.reposts) },
    { key: 'insights.awards', value: formatScore(engagement.awards) },
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
