import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/app/layouts/PageLayout';
import { CreatePostForm } from '@/features/posts/components/CreatePostForm';
import { useI18n } from '@/lib/i18n/I18nContext';

/** Dedicated "new post" page, the target of the topbar create action. */
export function CreatePage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <PageLayout>
      <h1 className="page-title">{t('composer.newPostTitle')}</h1>

      <CreatePostForm
        defaultCommunityId={null}
        onCreated={() => navigate('/home')}
        onCancel={() => navigate(-1)}
      />
    </PageLayout>
  );
}
