import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageLayout } from '@/app/layouts/PageLayout';
import { communityPath } from '@/config/paths';
import { communitiesApi } from '@/features/communities/api/communities';
import { isModerator } from '@/features/communities/utils/membership';
import { useI18n } from '@/lib/i18n/I18nContext';
import type { Community } from '@/types/api';

type AccessState = 'loading' | 'allowed' | 'denied';

/**
 * `/c/:name/mod`: placeholder for the moderation tools. The role check here
 * is only about what to render; the API enforces it on every moderation call.
 */
export function CommunityModPage() {
  const { name = '' } = useParams<{ name: string }>();
  const { t } = useI18n();
  const [community, setCommunity] = useState<Community | null>(null);
  const [access, setAccess] = useState<AccessState>('loading');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setAccess('loading');
      try {
        const found = await communitiesApi.getByName(name);
        const membership = await communitiesApi.getMembership(found.id);
        if (!cancelled) {
          setCommunity(found);
          setAccess(isModerator(membership) ? 'allowed' : 'denied');
        }
      } catch {
        if (!cancelled) {
          setAccess('denied');
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [name]);

  return (
    <PageLayout>
      {access === 'loading' ? (
        <p className="feed-empty" aria-busy="true">{t('feed.loading')}</p>
      ) : (
        <div className="feed-empty">
          <h1 className="page-title">
            {t('modPage.title', { community: community?.displayName ?? name })}
          </h1>
          <p>{access === 'allowed' ? t('modPage.comingSoon') : t('modPage.forbidden')}</p>
          <p>
            <Link to={communityPath(name)}>{t('modPage.back')}</Link>
          </p>
        </div>
      )}
    </PageLayout>
  );
}
