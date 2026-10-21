/** Placeholder rows shown while a comment list loads. */
export function CommentListSkeleton({ label }: { label: string }) {
  return (
    <ul className="post-list" aria-busy="true" aria-label={label}>
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
