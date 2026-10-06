import type { Comment } from '../types';

interface CommentCardProps {
  comment: Comment;
  /** Hides the "on <post>" line, used by the Overview tab. */
  showPost?: boolean;
}

export function CommentCard({ comment, showPost = true }: CommentCardProps) {
  return (
    <li className="comment-card">
      <div className="comment-card-body">
        <div className="comment-meta">
          <span className="comment-author">u/{comment.author?.username ?? 'unknown'}</span>
          <span className="separator">•</span>
          <time className="time" dateTime={comment.createdAt}>
            {getTimeAgo(comment.createdAt)}
          </time>
          {comment.parentId && <span className="badge">resposta</span>}
        </div>

        {showPost && comment.post && (
          <p className="comment-on">
            em <span className="comment-on-title">{comment.post.title}</span>
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
          {comment.upvoteCount > 0 && (
            <span className="comment-stat">{comment.upvoteCount} votos</span>
          )}
        </div>
      </div>
    </li>
  );
}

function getTimeAgo(isoString: string): string {
  const past = new Date(isoString);
  if (Number.isNaN(past.getTime())) {
    return '';
  }

  const diffMs = Date.now() - past.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours} h`;
  if (diffDays < 7) return `há ${diffDays} d`;
  return past.toLocaleDateString();
}