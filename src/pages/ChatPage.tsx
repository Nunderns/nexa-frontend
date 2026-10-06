import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from '../context/AuthContext';
import { chatApi, getApiErrorMessage } from '../services/api';
import { TopBar } from '../components/TopBar';
import type { Chat, Message } from '../types';

/**
 * Direct messages, backed by `/chats`. Conversations live in the left rail and
 * the selected thread on the right.
 */
export function ChatPage() {
  const { t } = useI18n();
  const { user } = useAuth();

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChats = useCallback(async () => {
    setLoadingChats(true);
    setError(null);
    try {
      const response = await chatApi.getAll(1, 20);
      setChats(response.data);
      setActiveChatId((current) => current ?? response.data[0]?.id ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err, t('chat.loadFailed')));
    } finally {
      setLoadingChats(false);
    }
  }, [t]);

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (activeChatId === null) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setLoadingMessages(true);

    chatApi
      .getMessages(activeChatId, 1, 50)
      .then((response) => {
        if (!cancelled) {
          setMessages(response.data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, t('chat.messagesFailed')));
          setMessages([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeChatId, t]);

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;

  return (
    <div className="home-shell">
      <TopBar />

      <div className="home-layout">
        <main className="home-main home-main-flush">
          <h1 className="page-title">{t('chat.title')}</h1>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="chat-layout">
            <aside className="chat-list" aria-label={t('chat.conversations')}>
              <h2 className="chat-list-title">{t('chat.conversations')}</h2>

              {loadingChats ? (
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
                        onClick={() => setActiveChatId(chat.id)}
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

            <section className="chat-thread" aria-label={t('chat.title')}>
              {activeChat ? (
                <MessageThread
                  chat={activeChat}
                  currentUserId={user?.id ?? null}
                  messages={messages}
                  loading={loadingMessages}
                  onSent={(message) => {
                    setMessages((current) => [...current, message]);
                  }}
                />
              ) : (
                <div className="chat-placeholder">
                  <h2>{t('chat.selectTitle')}</h2>
                  <p>{t('chat.selectBody')}</p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function MessageThread({
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

function ChatListSkeleton() {
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