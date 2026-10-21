import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageLayout } from '@/app/layouts/PageLayout';
import { commentsApi } from '@/features/comments/api/comments';
import { CommentCard } from '@/features/comments/components/CommentCard';
import { CommentListSkeleton } from '@/features/comments/components/CommentListSkeleton';
import { postsApi } from '@/features/posts/api/posts';
import { InsightsPanel } from '@/features/posts/components/insights/InsightsPanel';
import { PostDetail, PostDetailSkeleton } from '@/features/posts/components/PostDetail';
import type { PostInsights } from '@/features/posts/types/insights';
import { getApiErrorMessage, getErrorStatus } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n/I18nContext';
import type { Comment, Post } from '@/types/api';

const PAGE_SIZE = 20;

/**
 * A single post with its comments and, for the author and community
 * moderators, the insights panel.
 *
 * Insights are fetched separately and their failure is not fatal: the API
 * answers 403 to a reader who is neither, and that is a normal outcome here,
 * not an error worth showing. The post itself stays readable either way.
 */
export function PostDetailPage() {
  const { t } = useI18n();
  const { user: sessionUser } = useAuth();
  const params = useParams<{ postId: string }>();
  const postId = Number(params.postId);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [insights, setInsights] = useState<PostInsights | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  /** Raw error, kept so switching locale does not need a refetch to retranslate. */
  const [loadError, setLoadError] = useState<unknown>(null);
  const [notFound, setNotFound] = useState(false);

  /**
   * Deliberately does not depend on `t`: the error is stored raw and
   * translated at render time, so a language switch re-renders the message
   * instead of refetching the post.
   */
  const loadPost = useCallback(async (id: number) => {
    setLoading(true);
    setLoadError(null);
    setNotFound(false);

    try {
      setPost(await postsApi.getById(id));
    } catch (err) {
      setPost(null);
      setLoadError(err);
      // 404 means the post is gone, which gets its own copy; anything else is
      // the API's own message.
      setNotFound(getErrorStatus(err) === 404);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!Number.isInteger(postId) || postId <= 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    void loadPost(postId);
  }, [loadPost, postId]);

  // The beacon is fired by the detail page rather than by `GET /posts/:id`,
  // so scrolling the feed does not report a view per card rendered.
  useEffect(() => {
    const postId = post?.id;
    if (!postId) {
      return;
    }
    void postsApi.recordView(postId);
  }, [post]);

  useEffect(() => {
    // Captured as a const so the callbacks below do not depend on `post` still
    // being non-null by the time they run.
    const postId = post?.id;
    if (!postId) {
      return;
    }

    let cancelled = false;

    async function load(id: number) {
      setLoadingComments(true);
      try {
        const response = await commentsApi.getByPost(id, 1, PAGE_SIZE);
        if (!cancelled) {
          setComments(response.data);
        }
      } catch {
        if (!cancelled) {
          setComments([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingComments(false);
        }
      }
    }

    void load(postId);
    return () => {
      cancelled = true;
    };
  }, [post]);

  // Only the author and community moderators get insights. Asking anyway would
  // guarantee a 403 on every post opened by a regular reader, so the request is
  // skipped for anyone else and the panel simply does not render.
  const viewerId = sessionUser?.id;

  useEffect(() => {
    const postId = post?.id;
    if (!postId || !viewerId) {
      return;
    }

    let cancelled = false;

    async function load(id: number) {
      try {
        const response = await postsApi.getInsights(id);
        if (!cancelled) {
          setInsights(response);
        }
      } catch {
        if (!cancelled) {
          setInsights(null);
        }
      }
    }

    void load(postId);
    return () => {
      cancelled = true;
    };
  }, [post, viewerId]);

  return (
    <PageLayout>
      <Link to="/home" className="post-back">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4-4.6-4.6z" />
        </svg>
        {t('post.back')}
      </Link>

      {loading ? (
        <PostDetailSkeleton />
      ) : notFound || !post ? (
        <div className="feed-empty">
          <h2>{t('post.notFoundTitle')}</h2>
          <p>{notFound ? t('post.notFoundBody') : getApiErrorMessage(loadError, t('post.loadFailed'))}</p>
          <Link to="/home" className="btn btn-primary">
            {t('post.back')}
          </Link>
        </div>
      ) : (
        <>
          <PostDetail post={post} />

          {insights && <InsightsPanel insights={insights} />}

          <section className="post-comments" aria-labelledby="comments-heading">
            <h2 className="feed-heading" id="comments-heading">
              {t('post.commentsTitle')}
              <span className="feed-count"> {post.commentCount}</span>
            </h2>

            {loadingComments ? (
              <CommentListSkeleton label={t('post.commentsTitle')} />
            ) : comments.length === 0 ? (
              <div className="feed-empty">
                <p>{t('post.commentsEmpty')}</p>
              </div>
            ) : (
              <ul className="post-list">
                {comments.map((comment) => (
                  <CommentCard key={comment.id} comment={comment} showPost={false} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </PageLayout>
  );
}
