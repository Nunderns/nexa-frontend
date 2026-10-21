import { useCallback, useEffect, useState } from 'react';
import { PageLayout } from '@/app/layouts/PageLayout';
import { CommentCard } from '@/features/comments/components/CommentCard';
import { CommentListSkeleton } from '@/features/comments/components/CommentListSkeleton';
import { PostCard } from '@/features/posts/components/PostCard';
import { PostListSkeleton } from '@/features/posts/components/PostListSkeleton';
import { usersApi } from '@/features/users/api/users';
import { ProfileCard, ProfileSkeleton } from '@/features/users/components/ProfileCard';
import { ProfileTabBar, UnsupportedTab } from '@/features/users/components/ProfileTabs';
import { isSupported, type TabId } from '@/features/users/utils/profile-tabs';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n/I18nContext';
import type { Comment, Post, User } from '@/types/api';
import { ActivityTab } from './ActivityTab';
import { OverviewTab } from './OverviewTab';

const PAGE_SIZE = 10;

const renderPost = (post: Post) => <PostCard key={post.id} post={post} />;
const renderComment = (comment: Comment) => <CommentCard key={comment.id} comment={comment} />;

/**
 * The signed-in user's own profile: account details plus a tabbed view of
 * their activity.
 */
export function ProfilePage() {
  const { user: sessionUser } = useAuth();
  const { t } = useI18n();
  const [tab, setTab] = useState<TabId>('overview');

  const [profile, setProfile] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const userId = sessionUser?.id;

  // Hooks stay unconditional: an early return above them would change the hook
  // count between renders and crash when the session is cleared in place.
  const loadProfile = useCallback(async () => {
    if (!userId) {
      return;
    }
    setLoadingProfile(true);
    try {
      setProfile(await usersApi.getById(userId));
    } catch {
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (!userId) {
    return (
      <PageLayout>
        <p className="form-error">{t('profile.needLogin')}</p>
      </PageLayout>
    );
  }

  const postSkeleton = <PostListSkeleton label={t('profile.yourPosts')} />;

  return (
    <PageLayout>
      {loadingProfile ? (
        <ProfileSkeleton />
      ) : profile ? (
        <ProfileCard profile={profile} />
      ) : (
        <div className="feed-empty">
          <h2>{t('profile.unavailableTitle')}</h2>
          <p>{t('profile.unavailableBody')}</p>
          <button className="btn btn-primary" onClick={() => void loadProfile()}>
            Tentar de novo
          </button>
        </div>
      )}

      <ProfileTabBar active={tab} onSelect={setTab} />

      {tab === 'overview' && <OverviewTab userId={userId} profile={profile} />}
      {tab === 'posts' && (
        <ActivityTab
          tab="posts"
          userId={userId}
          fetchPage={(page) => usersApi.getPosts(userId, page, PAGE_SIZE)}
          renderItem={renderPost}
          skeleton={postSkeleton}
          emptyTitle="profile.noPostsTitle"
          emptyBody="profile.noPostsBody"
          errorFallback="profile.loadPostsFailed"
        />
      )}
      {tab === 'comments' && (
        <ActivityTab
          tab="comments"
          userId={userId}
          fetchPage={(page) => usersApi.getComments(userId, page, PAGE_SIZE)}
          renderItem={renderComment}
          skeleton={<CommentListSkeleton label={t('profile.tabComments')} />}
          emptyTitle="profile.noCommentsTitle"
          emptyBody="profile.noCommentsBody"
          errorFallback="profile.loadCommentsFailed"
        />
      )}
      {tab === 'upvoted' && (
        <ActivityTab
          tab="upvoted"
          userId={userId}
          fetchPage={(page) => usersApi.getUpvoted(userId, page, PAGE_SIZE)}
          renderItem={renderPost}
          skeleton={postSkeleton}
          emptyTitle="profile.noUpvotedTitle"
          emptyBody="profile.noUpvotedBody"
          errorFallback="profile.loadPostsFailed"
        />
      )}
      {tab === 'downvoted' && (
        <ActivityTab
          tab="downvoted"
          userId={userId}
          fetchPage={(page) => usersApi.getDownvoted(userId, page, PAGE_SIZE)}
          renderItem={renderPost}
          skeleton={postSkeleton}
          emptyTitle="profile.noDownvotedTitle"
          emptyBody="profile.noDownvotedBody"
          errorFallback="profile.loadPostsFailed"
        />
      )}
      {!isSupported(tab) && <UnsupportedTab tab={tab} />}
    </PageLayout>
  );
}
