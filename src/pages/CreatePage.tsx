import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { CreatePostForm } from '../components/CreatePostForm';
import { TopBar } from '../components/TopBar';

/** Dedicated "new post" page, the target of the topbar create action. */
export function CreatePage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="home-shell">
      <TopBar />

      <div className="home-layout">
        <main className="home-main">
          <h1 className="page-title">{t('composer.newPostTitle')}</h1>

          <CreatePostForm
            defaultCommunityId={null}
            onCreated={() => navigate('/home')}
            onCancel={() => navigate(-1)}
          />
        </main>
      </div>
    </div>
  );
}
