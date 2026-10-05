import { useState } from 'react';
import { getApiErrorMessage, votesApi } from '../services/api';
import type { Post, VoteValue } from '../types';

interface PostCardProps {
  post: Post;
}

/** The backend never returns the caller's own vote inside the post payload. */
type LocalVote = VoteValue;

export function PostCard({ post }: PostCardProps) {
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
      setVoteError(getApiErrorMessage(err, 'Your vote could not be saved.'));
    } finally {
      setPending(false);
    }
  };

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
          <span className="community-chip">
            {post.community?.iconUrl ? (
              <img className="community-chip-icon" src={post.community.iconUrl} alt="" />
            ) : null}
            {post.community?.displayName ?? 'Unknown community'}
          </span>
          <span className="separator">•</span>
          <span className="author">u/{post.author?.username ?? 'unknown'}</span>
          <span className="separator">•</span>
          <time className="time" dateTime={post.createdAt}>
            {getTimeAgo(post.createdAt)}
          </time>
          {post.isPinned && <span className="badge">Pinned</span>}
          {post.isLocked && <span className="badge">Locked</span>}
        </div>

        <h2 className="post-title">{post.title}</h2>
        {post.content && <p className="post-body">{post.content}</p>}

        {voteError && (
          <p className="post-vote-error" role="alert">
            {voteError}
          </p>
        )}

        <div className="post-actions">
          <span className="action-btn action-btn-static">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>
              {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
            </span>
          </span>
        </div>
      </div>
    </li>
  );
}

function formatScore(score: number): string {
  const absolute = Math.abs(score);
  if (absolute >= 1_000_000) {
    return `${(score / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (absolute >= 1_000) {
    return `${(score / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(score);
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

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}