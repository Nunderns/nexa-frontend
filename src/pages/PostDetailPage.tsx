import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { commentsApi, getApiErrorMessage, postsApi } from '../services/api';
import { CommentCard } from '../components/CommentCard';
import { InsightsPanel } from '../components/InsightsPanel';
import { formatScore, getTimeAgo } from '../components/PostCard';
import { TopBar } from '../components/TopBar';
import { useI18n } from '../i18n/I18nContext';
import type { Comment, Post, PostInsights } from '../types';

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
      setNotFound((err as { response?: { status?: number } })?.response?.status === 404);
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
    <div className="home-shell">
      <TopBar />

      <div className="home-layout">
        <main className="home-main">
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
          ) : notFound ? (
            <div className="feed-empty">
              <h2>{t('post.notFoundTitle')}</h2>
              <p>{t('post.notFoundBody')}</p>
              <Link to="/home" className="btn btn-primary">
                {t('post.back')}
              </Link>
            </div>
          ) : !post ? (
            <div className="feed-empty">
              <h2>{t('post.notFoundTitle')}</h2>
              <p>{getApiErrorMessage(loadError, t('post.loadFailed'))}</p>
              <Link to="/home" className="btn btn-primary">
                {t('post.back')}
              </Link>
            </div>
          ) : (
            <>
              <PostDetailHeader post={post} />

              {insights && <InsightsPanel insights={insights} />}

              <section className="post-comments" aria-labelledby="comments-heading">
                <h2 className="feed-heading" id="comments-heading">
                  {t('post.commentsTitle')}
                  <span className="feed-count"> {post.commentCount}</span>
                </h2>

                {loadingComments ? (
                  <CommentListSkeleton />
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
        </main>
      </div>
    </div>
  );
}

function PostDetailHeader({ post }: { post: Post }) {
  const { t } = useI18n();

  return (
    <article className="post-detail">
      <div className="post-meta">
        <span className="community-chip">
          {post.community?.iconUrl ? (
            <img className="community-chip-icon" src={post.community.iconUrl} alt="" />
          ) : null}
          {post.community?.displayName ?? t('feed.unknownCommunity')}
        </span>
        <span className="separator">•</span>
        <span className="author">
          u/{post.author?.username ?? t('feed.unknownAuthor')}
        </span>
        <span className="separator">•</span>
        <time className="time" dateTime={post.createdAt}>
          {getTimeAgo(post.createdAt, t)}
        </time>
        {post.isPinned && <span className="badge">{t('feed.pinned')}</span>}
        {post.isLocked && <span className="badge">{t('feed.locked')}</span>}
      </div>

      <h1 className="post-title post-title-lg">{post.title}</h1>
      {post.content && <p className="post-body">{post.content}</p>}

      <div className="post-actions">
        <span className="action-btn action-btn-static">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 4l-8 8h6v8h4v-8h6z" />
          </svg>
          <span>{formatScore(post.score)}</span>
        </span>

        <span className="action-btn action-btn-static">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 4.5A7.5 7.5 0 0 0 4.5 12c0 5.25 7.5 11.25 7.5 11.25S19.5 17.25 19.5 12A7.5 7.5 0 0 0 12 4.5zm0 10a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
          </svg>
          <span>
            {post.viewCount > 0
              ? `${formatScore(post.viewCount)} ${t('post.viewCount')}`
              : null}
          </span>
        </span>

        <span className="action-btn action-btn-static">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{post.commentCount}</span>
        </span>
      </div>
    </article>
  );
}

function PostDetailSkeleton() {
  const { t } = useI18n();
  return (
    <div className="post-detail skeleton" aria-busy="true" aria-label={t('post.back')}>
      <div className="skeleton-line skeleton-line-sm" />
      <div className="skeleton-line skeleton-line-lg" />
      <div className="skeleton-line skeleton-line-md" />
    </div>
  );
}

function CommentListSkeleton() {
  const { t } = useI18n();
  return (
    <ul className="post-list" aria-busy="true" aria-label={t('post.commentsTitle')}>
      {[0, 1, 2].map((index) => (
        <li key={index} className="comment-card">
          <div className="comment-card-body">
            <div className="skeleton-line skeleton-line-sm" />
            <div className="skeleton-line skeleton-line-lg" />
          </div>
        </li>
      ))}
    </ul>
  );
}

