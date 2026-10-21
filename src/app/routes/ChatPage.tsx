import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/app/layouts/PageLayout';
import { chatApi } from '@/features/chat/api/chat';
import { ChatList } from '@/features/chat/components/ChatList';
import { MessageThread } from '@/features/chat/components/MessageThread';
import type { Chat, Message } from '@/features/chat/types';
import { getApiErrorMessage } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n/I18nContext';

/**
 * Direct messages, backed by `/chats`. Conversations live in the left rail and
 * the selected thread on the right. `?chat=<id>` (used by message
 * notifications) opens that thread.
 */
export function ChatPage() {
  const { t } = useI18n();
  const { user } = useAuth();

  const [chats, setChats] = useState<Chat[]>([]);
  const [searchParams] = useSearchParams();
  const requestedChatId = Number(searchParams.get('chat')) || null;
  const [activeChatId, setActiveChatId] = useState<number | null>(requestedChatId);
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

  // Following a second message notification while already on /chat.
  useEffect(() => {
    if (requestedChatId !== null) {
      setActiveChatId(requestedChatId);
    }
  }, [requestedChatId]);

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
    <PageLayout mainClassName="home-main-flush">
      <h1 className="page-title">{t('chat.title')}</h1>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="chat-layout">
        <ChatList
          chats={chats}
          activeChatId={activeChatId}
          loading={loadingChats}
          onSelect={setActiveChatId}
        />

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
    </PageLayout>
  );
}
