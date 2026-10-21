import { useI18n } from '@/lib/i18n/I18nContext';
import type { Post } from '@/types/api';
import { formatScore, getTimeAgo } from '@/utils/format';

/** The post itself on its detail page: meta line, title, body and counters. */
export function PostDetail({ post }: { post: Post }) {
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

export function PostDetailSkeleton() {
  const { t } = useI18n();
  return (
    <div className="post-detail skeleton" aria-busy="true" aria-label={t('post.back')}>
      <div className="skeleton-line skeleton-line-sm" />
      <div className="skeleton-line skeleton-line-lg" />
      <div className="skeleton-line skeleton-line-md" />
    </div>
  );
}
