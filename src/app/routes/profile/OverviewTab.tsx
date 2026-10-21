import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CommentCard } from '@/features/comments/components/CommentCard';
import { PostCard } from '@/features/posts/components/PostCard';
import { PostListSkeleton } from '@/features/posts/components/PostListSkeleton';
import { usersApi } from '@/features/users/api/users';
import { ProfileTabPanel } from '@/features/users/components/ProfileTabs';
import { formatCount } from '@/features/users/utils/format';
import { useI18n } from '@/lib/i18n/I18nContext';
import type { Comment, Post, User } from '@/types/api';

const OVERVIEW_PREVIEW = 3;

/**
 * Overview is a composition of the two lists the API does serve, so both
 * requests run together and each preview shows its own loading state.
 */
export function OverviewTab({ userId, profile }: { userId: number; profile: User | null }) {
  const { t } = useI18n();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [postTotal, setPostTotal] = useState(0);
  const [commentTotal, setCommentTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [postResponse, commentResponse] = await Promise.all([
          usersApi.getPosts(userId, 1, OVERVIEW_PREVIEW),
          usersApi.getComments(userId, 1, OVERVIEW_PREVIEW),
        ]);
        if (cancelled) {
          return;
        }
        setPosts(postResponse.data);
        setPostTotal(postResponse.total);
        setComments(commentResponse.data);
        setCommentTotal(commentResponse.total);
      } catch {
        if (!cancelled) {
          setPosts([]);
          setComments([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <ProfileTabPanel tab="overview">
      {profile && (
        <dl className="profile-stats profile-stats-overview">
          <div className="profile-stat">
            <dt>{t('profile.statsPosts')}</dt>
            <dd>{loading ? '—' : postTotal}</dd>
          </div>
          <div className="profile-stat">
            <dt>{t('profile.statsComments')}</dt>
            <dd>{loading ? '—' : commentTotal}</dd>
          </div>
          <div className="profile-stat">
            <dt>{t('profile.karma')}</dt>
            <dd>{formatCount(profile.karma)}</dd>
          </div>
        </dl>
      )}

      <section className="overview-section">
        <header className="overview-section-header">
          <h2 className="feed-heading">{t('profile.recentActivity')}</h2>
        </header>

        {loading ? (
          <PostListSkeleton label={t('profile.yourPosts')} />
        ) : posts.length === 0 && comments.length === 0 ? (
          <div className="feed-empty">
            <h2>{t('profile.nothingYet')}</h2>
            <p>{t('profile.nothingYetBody')}</p>
            <Link to="/home" className="btn btn-primary">
              {t('profile.goToFeed')}
            </Link>
          </div>
        ) : (
          <>
            {posts.length > 0 && (
              <>
                <h3 className="overview-subheading">{t('profile.latestPosts')}</h3>
                <ul className="post-list">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </ul>
              </>
            )}

            {comments.length > 0 && (
              <>
                <h3 className="overview-subheading">{t('profile.latestComments')}</h3>
                <ul className="post-list">
                  {comments.map((comment) => (
                    <CommentCard key={comment.id} comment={comment} />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>
    </ProfileTabPanel>
  );
}
