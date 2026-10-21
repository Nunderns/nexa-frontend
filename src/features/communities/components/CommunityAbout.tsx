import { useI18n } from '@/lib/i18n/I18nContext';
import type { Community, CommunityStats } from '@/types/api';
import { formatScore } from '@/utils/format';

interface CommunityAboutProps {
  community: Community;
  /** Null hides the weekly block, e.g. when the stats request failed. */
  stats: CommunityStats | null;
}

/** "About" card in the community sidebar. */
export function CommunityAbout({ community, stats }: CommunityAboutProps) {
  const { t, locale } = useI18n();

  return (
    <section className="sidebar-card community-about">
      <header className="sidebar-card-header">
        <h2>{t('communityPage.about')}</h2>
      </header>

      <div className="community-about-body">
        <p className="community-about-description">
          {community.description || t('communityPage.noDescription')}
        </p>

        <dl className="community-facts">
          <div>
            <dt>{t('communityPage.created')}</dt>
            <dd>
              <time dateTime={community.createdAt}>
                {new Date(community.createdAt).toLocaleDateString(locale, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
            </dd>
          </div>
          <div>
            <dt>{t('communityPage.visibility')}</dt>
            <dd>{community.isPrivate ? t('community.private') : t('communityPage.public')}</dd>
          </div>
          <div>
            <dt>{t('communityPage.contentType')}</dt>
            <dd>
              {community.isNsfw ? (
                <span className="badge badge-nsfw">{t('communityPage.adult')}</span>
              ) : (
                t('communityPage.general')
              )}
            </dd>
          </div>
        </dl>

        {stats && (
          <div className="community-stats">
            <h3>{t('communityPage.thisWeek')}</h3>
            <dl className="community-stats-grid">
              <div>
                <dt>{t('communityPage.visitors')}</dt>
                <dd>{formatScore(stats.visitors)}</dd>
              </div>
              <div>
                <dt>{t('communityPage.contributions')}</dt>
                <dd>{formatScore(stats.contributions)}</dd>
              </div>
            </dl>
          </div>
        )}

        <span className="community-about-link is-disabled" aria-disabled="true">
          {t('communityPage.modGuide')}
          <span className="badge badge-soon">{t('communityPage.soon')}</span>
        </span>
      </div>
    </section>
  );
}
