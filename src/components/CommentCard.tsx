import { useI18n } from '../i18n/I18nContext';
import { getTimeAgo } from './PostCard';
import type { Comment } from '../types';

interface CommentCardProps {
  comment: Comment;
  /** Hides the "on <post>" line, used where the post title is not useful. */
  showPost?: boolean;
}

export function CommentCard({ comment, showPost = true }: CommentCardProps) {
  const { t } = useI18n();

  const voteLabel =
    comment.upvoteCount === 1
      ? t('comment.vote', { count: comment.upvoteCount })
      : t('comment.votes', { count: comment.upvoteCount });

  return (
    <li className="comment-card">
      <div className="comment-card-body">
        <div className="comment-meta">
          <span className="comment-author">u/{comment.author?.username ?? '—'}</span>
          <span className="separator">•</span>
          <time className="time" dateTime={comment.createdAt}>
            {getTimeAgo(comment.createdAt, t)}
          </time>
          {comment.parentId && <span className="badge">{t('profile.reply')}</span>}
        </div>

        {showPost && comment.post && (
          <p className="comment-on">
            {t('comment.onPost')}{' '}
            <span className="comment-on-title">{comment.post.title}</span>
          </p>
        )}

        <p className="comment-content">{comment.content}</p>

        <div className="comment-footer">
          <span className="comment-score">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 4l-8 8h6v8h4v-8h6z" />
            </svg>
            {comment.score}
          </span>
          {comment.upvoteCount > 0 && <span className="comment-stat">{voteLabel}</span>}
        </div>
      </div>
    </li>
  );
}