import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/config/env';
import { refreshSession } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { getAccessToken } from '@/lib/session';
import { notificationsApi } from '../api/notifications';
import type { AppNotification } from '../types';
import { markReadById, markReadUpTo, mergeNotifications } from '../utils/notificationList';

const PAGE_SIZE = 20;

interface NotificationsContextValue {
  items: AppNotification[];
  unreadCount: number;
  hasMore: boolean;
  loading: boolean;
  /** True once the first page for the current filter has arrived. */
  loaded: boolean;
  error: boolean;
  /**
   * The socket dropped or was refused. REST still works; the page tells the
   * user to reload. Stays false while the first connection is in flight.
   */
  liveUnavailable: boolean;
  unreadOnly: boolean;
  setUnreadOnly: (value: boolean) => void;
  loadMore: () => Promise<void>;
  reload: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

/**
 * Notification state for the signed-in user: REST for history, the
 * `/notifications` Socket.IO namespace for live updates.
 *
 * The database is the source of truth and the socket only a hint (see
 * `backend/docs/notifications-websocket.md`), so every (re)connect re-reads
 * the first page and merges it by id, and the unread count is always taken
 * from the server rather than incremented locally.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [liveUnavailable, setLiveUnavailable] = useState(false);
  const [unreadOnly, setUnreadOnlyState] = useState(false);

  // Bumped whenever the user or filter changes so a slow response for the
  // previous one cannot overwrite the current list.
  const generation = useRef(0);
  // Read by the fetchers, which must not be recreated when the filter flips.
  const unreadOnlyRef = useRef(unreadOnly);

  /** First page: replaces the list on a fresh load, merges on a resync. */
  const fetchFirstPage = useCallback(async (mode: 'replace' | 'merge') => {
    const gen = generation.current;
    setLoading(true);
    setError(false);
    try {
      const page = await notificationsApi.list({ limit: PAGE_SIZE, unreadOnly: unreadOnlyRef.current });
      if (gen !== generation.current) {
        return;
      }
      if (mode === 'replace') {
        setItems(page.data);
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);
      } else {
        // Older pages already loaded stay put; only the head is refreshed.
        setItems((current) => mergeNotifications(current, page.data));
        setNextCursor((current) => current ?? page.nextCursor);
        setHasMore((current) => current || page.hasMore);
      }
      setLoaded(true);
    } catch {
      if (gen === generation.current) {
        setError(true);
      }
    } finally {
      if (gen === generation.current) {
        setLoading(false);
      }
    }
  }, []);

  const refreshCount = useCallback(async () => {
    try {
      const { count } = await notificationsApi.unreadCount();
      setUnreadCount(count);
    } catch {
      // The badge keeps its last value; the socket corrects it on connect.
    }
  }, []);

  // Reset and load whenever the account changes.
  useEffect(() => {
    generation.current += 1;
    setItems([]);
    setNextCursor(null);
    setHasMore(false);
    setLoaded(false);
    setError(false);
    setUnreadCount(0);
    setUnreadOnlyState(false);
    unreadOnlyRef.current = false;

    if (userId === null) {
      return;
    }
    void fetchFirstPage('replace');
    void refreshCount();
  }, [userId, fetchFirstPage, refreshCount]);

  // Live updates.
  useEffect(() => {
    if (userId === null) {
      return;
    }

    const socket: Socket = io(`${API_BASE_URL}/notifications`, {
      // A function, so every reconnect sends the current token.
      auth: (cb) => cb({ token: getAccessToken() }),
      transports: ['websocket'],
    });

    let firstConnect = true;
    // One refresh-and-retry per failure streak, so a refused account cannot
    // spin in a reconnect loop.
    let retriedAuth = false;
    let disposed = false;

    async function reconnectWithFreshToken() {
      if (retriedAuth) {
        setLiveUnavailable(true);
        return;
      }
      retriedAuth = true;
      // Forced: the server's clock decides expiry, and a client clock that
      // runs slightly behind would otherwise hand back the dead token.
      const token = await refreshSession({ force: true });
      if (disposed) {
        return;
      }
      if (token) {
        socket.connect();
      } else {
        setLiveUnavailable(true);
      }
    }

    socket.on('connect', () => {
      setLiveUnavailable(false);
      retriedAuth = false;
      // Recover anything pushed while we were away.
      if (!firstConnect) {
        void fetchFirstPage('merge');
      }
      firstConnect = false;
    });

    socket.on('disconnect', (reason) => {
      // The server drops the socket when the access token expires, and
      // Socket.IO does not reconnect after a server-side disconnect.
      if (reason === 'io server disconnect') {
        void reconnectWithFreshToken();
      } else {
        // Network loss: Socket.IO is already retrying on its own.
        setLiveUnavailable(true);
      }
    });

    socket.on('connect_error', (err) => {
      if (err.message === 'Unauthorized') {
        void reconnectWithFreshToken();
      } else {
        setLiveUnavailable(true);
      }
    });

    socket.on('notification:new', (notification: AppNotification) => {
      setItems((current) => mergeNotifications(current, [notification]));
    });

    socket.on('notification:read', (payload: { id: string; readAt: string; unreadCount: number }) => {
      setItems((current) => markReadById(current, payload.id, payload.readAt));
      setUnreadCount(payload.unreadCount);
    });

    socket.on('notification:read-all', (payload: { readAt: string; unreadCount: number }) => {
      setItems((current) => markReadUpTo(current, payload.readAt));
      setUnreadCount(payload.unreadCount);
    });

    socket.on('notification:unread-count', (payload: { count: number }) => {
      setUnreadCount(payload.count);
    });

    return () => {
      disposed = true;
      socket.removeAllListeners();
      socket.disconnect();
      setLiveUnavailable(false);
    };
  }, [userId, fetchFirstPage]);

  const setUnreadOnly = useCallback(
    (value: boolean) => {
      if (value === unreadOnlyRef.current) {
        return;
      }
      generation.current += 1;
      unreadOnlyRef.current = value;
      setUnreadOnlyState(value);
      setItems([]);
      setNextCursor(null);
      setHasMore(false);
      setLoaded(false);
      void fetchFirstPage('replace');
    },
    [fetchFirstPage],
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) {
      return;
    }
    const gen = generation.current;
    setLoading(true);
    setError(false);
    try {
      const page = await notificationsApi.list({
        limit: PAGE_SIZE,
        cursor: nextCursor,
        unreadOnly: unreadOnlyRef.current,
      });
      if (gen !== generation.current) {
        return;
      }
      setItems((current) => mergeNotifications(current, page.data));
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch {
      if (gen === generation.current) {
        setError(true);
      }
    } finally {
      if (gen === generation.current) {
        setLoading(false);
      }
    }
  }, [nextCursor, loading]);

  const reload = useCallback(async () => {
    generation.current += 1;
    await Promise.all([fetchFirstPage('replace'), refreshCount()]);
  }, [fetchFirstPage, refreshCount]);

  const markRead = useCallback(
    async (id: string) => {
      const target = items.find((item) => item.id === id);
      if (!target || target.isRead) {
        return;
      }
      // Optimistic; the server's `notification:read` push carries the real count.
      setItems((current) => markReadById(current, id, new Date().toISOString()));
      setUnreadCount((count) => Math.max(0, count - 1));
      try {
        const updated = await notificationsApi.markRead(id);
        setItems((current) => mergeNotifications(current, [updated]));
      } catch {
        void reload();
      }
    },
    [items, reload],
  );

  const markAllRead = useCallback(async () => {
    try {
      const { unreadCount: count } = await notificationsApi.markAllRead();
      setItems((current) => markReadUpTo(current, new Date().toISOString()));
      setUnreadCount(count);
    } catch {
      setError(true);
    }
  }, []);

  const remove = useCallback(
    async (id: string) => {
      const previous = items;
      setItems((current) => current.filter((item) => item.id !== id));
      try {
        await notificationsApi.remove(id);
        void refreshCount();
      } catch {
        setItems(previous);
        setError(true);
      }
    },
    [items, refreshCount],
  );

  const value = useMemo<NotificationsContextValue>(
    () => ({
      items,
      unreadCount,
      hasMore,
      loading,
      loaded,
      error,
      liveUnavailable,
      unreadOnly,
      setUnreadOnly,
      loadMore,
      reload,
      markRead,
      markAllRead,
      remove,
    }),
    [
      items,
      unreadCount,
      hasMore,
      loading,
      loaded,
      error,
      liveUnavailable,
      unreadOnly,
      setUnreadOnly,
      loadMore,
      reload,
      markRead,
      markAllRead,
      remove,
    ],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used inside a NotificationsProvider');
  }
  return context;
}
