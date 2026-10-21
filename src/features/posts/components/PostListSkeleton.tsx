interface PostListSkeletonProps {
  label: string;
  count?: number;
}

/** Placeholder cards shown while a feed loads. */
export function PostListSkeleton({ label, count = 3 }: PostListSkeletonProps) {
  return (
    <ul className="post-list" aria-busy="true" aria-label={label}>
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="post-card skeleton">
          <div className="post-vote" />
          <div className="post-content">
            <div className="skeleton-line skeleton-line-sm" />
            <div className="skeleton-line skeleton-line-lg" />
            <div className="skeleton-line skeleton-line-md" />
          </div>
        </li>
      ))}
    </ul>
  );
}
