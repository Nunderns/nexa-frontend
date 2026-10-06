import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { communitiesApi, getApiErrorMessage } from '../services/api';
import { CreatePostForm } from '../components/CreatePostForm';
import { TopBar } from '../components/TopBar';
import type { Community } from '../types';

/** Dedicated "new post" page, the target of the topbar create action. */
export function CreatePage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCommunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await communitiesApi.getAll(1, 50);
      setCommunities(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err, t('feed.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadCommunities();
  }, [loadCommunities]);

  return (
    <div className="home-shell">
      <TopBar />

      <div className="home-layout">
        <main className="home-main">
          <h1 className="page-title">{t('composer.newPostTitle')}</h1>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {loading ? (
            <div className="composer" aria-busy="true">
              <div className="skeleton-line skeleton-line-md" />
              <div className="skeleton-line skeleton-line-sm" />
            </div>
          ) : communities.length === 0 ? (
            <div className="feed-empty">
              <h2>{t('community.empty')}</h2>
            </div>
          ) : (
            <CreatePostForm
              communities={communities}
              defaultCommunityId={communities[0]?.id ?? null}
              onCreated={() => navigate('/home')}
              onCancel={() => navigate(-1)}
            />
          )}
        </main>
      </div>
    </div>
  );
}