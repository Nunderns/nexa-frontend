import { useI18n } from '@/lib/i18n/I18nContext';
import type { Chat } from '../types';
import { ChatListSkeleton } from './ChatListSkeleton';

interface ChatListProps {
  chats: Chat[];
  activeChatId: number | null;
  loading: boolean;
  onSelect: (chatId: number) => void;
}

/** Left rail of the chat page: one row per conversation. */
export function ChatList({ chats, activeChatId, loading, onSelect }: ChatListProps) {
  const { t } = useI18n();

  return (
    <aside className="chat-list" aria-label={t('chat.conversations')}>
      <h2 className="chat-list-title">{t('chat.conversations')}</h2>

      {loading ? (
        <ChatListSkeleton />
      ) : chats.length === 0 ? (
        <div className="chat-list-empty">
          <p className="chat-list-empty-title">{t('chat.emptyTitle')}</p>
          <p className="chat-list-empty-body">{t('chat.emptyBody')}</p>
        </div>
      ) : (
        <ul className="chat-list-items">
          {chats.map((chat) => (
            <li key={chat.id}>
              <button
                type="button"
                className={`chat-list-item ${chat.id === activeChatId ? 'active' : ''}`}
                onClick={() => onSelect(chat.id)}
              >
                <span className="avatar" aria-hidden="true">
                  {(chat.otherParticipant?.displayName ?? '?').charAt(0).toUpperCase()}
                </span>
                <span className="chat-list-item-body">
                  <span className="chat-list-item-name">
                    {chat.otherParticipant?.displayName ?? `u/${chat.otherParticipant?.username ?? ''}`}
                  </span>
                  <span className="chat-list-item-preview">
                    {chat.lastMessage?.content ?? ''}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
