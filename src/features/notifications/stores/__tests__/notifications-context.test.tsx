import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import type { AppNotification } from '@/features/notifications/types'

type Handler = (...args: unknown[]) => void

/** Minimal stand-in for a Socket.IO client socket. */
const fakeSocket = vi.hoisted(() => {
  const handlers = new Map<string, Handler[]>()
  return {
    handlers,
    on: (event: string, handler: Handler) => {
      handlers.set(event, [...(handlers.get(event) ?? []), handler])
    },
    emitLocal(event: string, ...args: unknown[]) {
      for (const handler of handlers.get(event) ?? []) handler(...args)
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: () => handlers.clear(),
  }
})

const ioMock = vi.hoisted(() => vi.fn(() => fakeSocket))
vi.mock('socket.io-client', () => ({ io: ioMock }))

const api = vi.hoisted(() => ({
  list: vi.fn(),
  unreadCount: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
  remove: vi.fn(),
  refreshSession: vi.fn(),
}))

vi.mock('@/config/env', () => ({
  API_BASE_URL: 'http://api.test',
}))

vi.mock('@/lib/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api-client')>()),
  refreshSession: api.refreshSession,
}))

vi.mock('@/features/notifications/api/notifications', () => ({
  notificationsApi: {
    list: api.list,
    unreadCount: api.unreadCount,
    markRead: api.markRead,
    markAllRead: api.markAllRead,
    remove: api.remove,
  },
}))

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ user: { id: 1, username: 'alice', email: 'a@test' } }),
}))

import { NotificationsProvider, useNotifications } from '@/features/notifications/stores/NotificationsContext'

function notification(id: string, createdAt: string): AppNotification {
  return {
    id,
    type: 'USER_MENTION',
    title: 'You were mentioned',
    body: '@bob mentioned you',
    resourceType: 'POST',
    resourceId: 3,
    metadata: { postId: 3 },
    isRead: false,
    readAt: null,
    createdAt,
    actor: { id: 2, username: 'bob', displayName: 'Bob', avatarUrl: null },
  }
}

function Probe() {
  const { items, unreadCount } = useNotifications()
  return (
    <div>
      <span data-testid="count">{unreadCount}</span>
      <ul>
        {items.map((item) => (
          <li key={item.id} data-read={String(item.isRead)}>
            {item.id}
          </li>
        ))}
      </ul>
    </div>
  )
}

function renderProvider() {
  return render(
    <NotificationsProvider>
      <Probe />
    </NotificationsProvider>,
  )
}

describe('NotificationsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fakeSocket.handlers.clear()
    api.list.mockResolvedValue({
      data: [notification('old', '2026-10-16T12:00:00.000Z')],
      nextCursor: null,
      hasMore: false,
    })
    api.unreadCount.mockResolvedValue({ count: 1 })
  })

  it('connects to the notifications namespace with the token in auth, not the URL', async () => {
    renderProvider()

    await screen.findByText('old')
    expect(ioMock).toHaveBeenCalledWith(
      'http://api.test/notifications',
      expect.objectContaining({ auth: expect.any(Function), transports: ['websocket'] }),
    )
  })

  it('merges pushed notifications and takes the unread count from the server', async () => {
    renderProvider()
    await screen.findByText('old')

    act(() => {
      fakeSocket.emitLocal('notification:new', notification('new', '2026-10-16T13:00:00.000Z'))
      fakeSocket.emitLocal('notification:new', notification('new', '2026-10-16T13:00:00.000Z'))
      fakeSocket.emitLocal('notification:unread-count', { count: 2 })
    })

    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['new', 'old'])
    expect(screen.getByTestId('count').textContent).toBe('2')
  })

  it('applies read-all only up to its cutoff', async () => {
    renderProvider()
    await screen.findByText('old')

    act(() => {
      fakeSocket.emitLocal('notification:new', notification('new', '2026-10-16T13:00:00.000Z'))
      fakeSocket.emitLocal('notification:read-all', { readAt: '2026-10-16T12:30:00.000Z', unreadCount: 1 })
    })

    expect(screen.getByText('old').dataset.read).toBe('true')
    expect(screen.getByText('new').dataset.read).toBe('false')
  })

  it('refreshes the token and reconnects after the server drops an expired socket', async () => {
    api.refreshSession.mockResolvedValue('fresh-token')
    renderProvider()
    await screen.findByText('old')

    act(() => fakeSocket.emitLocal('disconnect', 'io server disconnect'))

    await waitFor(() => expect(fakeSocket.connect).toHaveBeenCalledTimes(1))
    expect(api.refreshSession).toHaveBeenCalledWith({ force: true })
  })

  it('resyncs the first page on reconnect', async () => {
    renderProvider()
    await screen.findByText('old')
    act(() => fakeSocket.emitLocal('connect'))
    expect(api.list).toHaveBeenCalledTimes(1)

    api.list.mockResolvedValueOnce({
      data: [notification('missed', '2026-10-16T14:00:00.000Z')],
      nextCursor: null,
      hasMore: false,
    })
    act(() => fakeSocket.emitLocal('connect'))

    await screen.findByText('missed')
    expect(screen.getByText('old')).toBeTruthy()
  })
})
