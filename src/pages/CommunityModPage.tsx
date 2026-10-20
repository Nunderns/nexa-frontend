import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { communitiesApi } from '../services/api';
import { communityPath } from '../components/PostCard';
import { TopBar } from '../components/TopBar';
import { useI18n } from '../i18n/I18nContext';
import type { Community } from '../types';
import { isModerator } from './CommunityPage';

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
    <div className="home-shell">
      <TopBar />
      <div className="home-layout">
        <main className="home-main">
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
        </main>
      </div>
    </div>
  );
}
