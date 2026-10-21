export function ChatListSkeleton() {
  return (
    <ul className="chat-list-items" aria-busy="true">
      {[0, 1, 2].map((index) => (
        <li key={index} className="chat-list-item">
          <div className="skeleton-line skeleton-line-md" />
        </li>
      ))}
    </ul>
  );
}
