import { useState, type FormEvent } from 'react';
import { getApiErrorMessage } from '@/lib/api-client';
import { useI18n } from '@/lib/i18n/I18nContext';
import { chatApi } from '../api/chat';
import type { Chat, Message } from '../types';
import { ChatListSkeleton } from './ChatListSkeleton';

/** The open conversation: header, messages and the composer. */
export function MessageThread({
  chat,
  currentUserId,
  messages,
  loading,
  onSent,
}: {
  chat: Chat;
  currentUserId: number | null;
  messages: Message[];
  loading: boolean;
  onSent: (message: Message) => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) {
      return;
    }

    setSending(true);
    setError(null);
    try {
      const message = await chatApi.sendMessage(chat.id, content);
      onSent(message);
      setDraft('');
    } catch (err) {
      setError(getApiErrorMessage(err, t('chat.sendFailed')));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <header className="chat-thread-header">
        <span className="avatar" aria-hidden="true">
          {(chat.otherParticipant?.displayName ?? '?').charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="chat-thread-name">
            {chat.otherParticipant?.displayName ?? `u/${chat.otherParticipant?.username ?? ''}`}
          </p>
          <p className="chat-thread-handle">u/{chat.otherParticipant?.username}</p>
        </div>
      </header>

      <div className="chat-messages">
        {loading ? (
          <ChatListSkeleton />
        ) : messages.length === 0 ? (
          <p className="chat-messages-empty">{t('chat.noMessages')}</p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === currentUserId;
            return (
              <div key={message.id} className={`chat-bubble-row ${mine ? 'mine' : ''}`}>
                <div className="chat-bubble">{message.content}</div>
              </div>
            );
          })
        )}
      </div>

      <form className="chat-composer" onSubmit={handleSubmit}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="chat-composer-row">
          <input
            className="field-control"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('chat.messagePlaceholder')}
            maxLength={5000}
            aria-label={t('chat.messagePlaceholder')}
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !draft.trim()}>
            {t('chat.send')}
          </button>
        </div>
      </form>
    </>
  );
}
