import { useState } from 'react';
import { Link } from 'react-router-dom';
import { communityPath, postPath } from '@/config/paths';
import { getApiErrorMessage } from '@/lib/api-client';
import { useI18n } from '@/lib/i18n/I18nContext';
import type { Post, VoteValue } from '@/types/api';
import { formatScore, getTimeAgo } from '@/utils/format';
import { votesApi } from '../api/votes';

interface PostCardProps {
  post: Post;
}

/** The backend never returns the caller's own vote inside the post payload. */
type LocalVote = VoteValue;

export function PostCard({ post }: PostCardProps) {
  const { t } = useI18n();
  const [vote, setVote] = useState<LocalVote>(0);
  const [score, setScore] = useState(post.score);
  const [pending, setPending] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  /**
   * Sends `1`, `-1` or `0` (which removes the vote) and mirrors the change
   * locally. The delta is derived from the previous value so switching
   * straight from up to down cannot drift the score.
   */
  const handleVote = async (next: LocalVote) => {
    if (pending) {
      return;
    }

    const previous = vote;
    const resolved = previous === next ? 0 : next;
    const delta = resolved - previous;

    setPending(true);
    setVoteError(null);
    setVote(resolved);
    setScore((current) => current + delta);

    try {
      await votesApi.voteOnPost(post.id, resolved);
    } catch (err) {
      // Roll back so the UI never shows a vote the API rejected.
      setVote(previous);
      setScore((current) => current - delta);
      setVoteError(getApiErrorMessage(err, t('vote.failed')));
    } finally {
      setPending(false);
    }
  };

  const commentLabel =
    post.commentCount === 1
      ? t('feed.comment', { count: post.commentCount })
      : t('feed.comments', { count: post.commentCount });

  return (
    <li className="post-card" data-post-id={post.id}>
      <div className="post-vote">
        <button
          type="button"
          className={`vote-btn upvote ${vote === 1 ? 'active' : ''}`}
          onClick={() => void handleVote(1)}
          disabled={pending}
          aria-label="Upvote"
          aria-pressed={vote === 1}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 4l-8 8h6v8h4v-8h6z" />
          </svg>
        </button>

        <span className="vote-score" aria-live="polite">
          {formatScore(score)}
        </span>

        <button
          type="button"
          className={`vote-btn downvote ${vote === -1 ? 'active' : ''}`}
          onClick={() => void handleVote(-1)}
          disabled={pending}
          aria-label="Downvote"
          aria-pressed={vote === -1}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 20l8-8h-6v-8h-4v8h-6z" />
          </svg>
        </button>
      </div>

      <div className="post-content">
        <div className="post-meta">
          {post.community ? (
            <Link to={communityPath(post.community.name)} className="community-chip community-chip-link">
              {post.community.iconUrl ? (
                <img className="community-chip-icon" src={post.community.iconUrl} alt="" />
              ) : null}
              {post.community.displayName}
            </Link>
          ) : (
            <span className="community-chip">{t('feed.unknownCommunity')}</span>
          )}
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

        <h2 className="post-title">
          <Link to={postPath(post.id)} className="post-title-link">
            {post.title}
          </Link>
        </h2>
        {post.content && <p className="post-body">{post.content}</p>}

        {voteError && (
          <p className="post-vote-error" role="alert">
            {voteError}
          </p>
        )}

        <div className="post-actions">
          <Link to={postPath(post.id)} className="action-btn action-btn-static">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 4.5A7.5 7.5 0 0 0 4.5 12c0 5.25 7.5 11.25 7.5 11.25S19.5 17.25 19.5 12A7.5 7.5 0 0 0 12 4.5zm0 10a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
            </svg>
            {post.viewCount > 0 ? formatScore(post.viewCount) : null}
          </Link>

          <Link to={postPath(post.id)} className="action-btn action-btn-static">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>{commentLabel}</span>
          </Link>
        </div>
      </div>
    </li>
  );
}
