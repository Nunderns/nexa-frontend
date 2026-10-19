import { describe, it, expect } from 'vitest'
import {
  markReadById,
  markReadUpTo,
  mergeNotifications,
  notificationTarget,
} from '../services/notificationList'
import type { AppNotification } from '../types'

function make(id: string, createdAt: string, overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id,
    type: 'POST_REPLY',
    title: 'New comment',
    body: '@bob commented on your post',
    resourceType: 'COMMENT',
    resourceId: 1,
    metadata: { postId: 7, commentId: 1, parentId: null },
    isRead: false,
    readAt: null,
    createdAt,
    actor: { id: 2, username: 'bob', displayName: 'Bob', avatarUrl: null },
    ...overrides,
  }
}

describe('mergeNotifications', () => {
  it('deduplicates by id, keeping the incoming copy', () => {
    const stored = make('a', '2026-10-16T12:00:00.000Z')
    const fresher = { ...stored, isRead: true, readAt: '2026-10-16T12:05:00.000Z' }

    const merged = mergeNotifications([stored], [fresher])

    expect(merged).toHaveLength(1)
    expect(merged[0].isRead).toBe(true)
  })

  it('sorts newest first, breaking ties by id descending', () => {
    const merged = mergeNotifications(
      [make('a', '2026-10-16T12:00:00.000Z')],
      [make('c', '2026-10-16T13:00:00.000Z'), make('b', '2026-10-16T12:00:00.000Z')],
    )

    expect(merged.map((item) => item.id)).toEqual(['c', 'b', 'a'])
  })
})

describe('read state', () => {
  it('marks a single notification read', () => {
    const result = markReadById([make('a', '2026-10-16T12:00:00.000Z')], 'a', '2026-10-16T12:01:00.000Z')
    expect(result[0]).toMatchObject({ isRead: true, readAt: '2026-10-16T12:01:00.000Z' })
  })

  it('read-all leaves notifications created after the cutoff unread', () => {
    const result = markReadUpTo(
      [make('new', '2026-10-16T12:10:00.000Z'), make('old', '2026-10-16T12:00:00.000Z')],
      '2026-10-16T12:05:00.000Z',
    )

    expect(result.find((item) => item.id === 'new')?.isRead).toBe(false)
    expect(result.find((item) => item.id === 'old')?.isRead).toBe(true)
  })
})

describe('notificationTarget', () => {
  it('opens the post for replies, mentions and votes', () => {
    expect(notificationTarget(make('a', '2026-10-16T12:00:00.000Z'))).toBe('/posts/7')
    expect(
      notificationTarget(make('a', '2026-10-16T12:00:00.000Z', { type: 'POST_UPVOTE', metadata: { postId: 9 } })),
    ).toBe('/posts/9')
  })

  it('opens the chat thread for a direct message', () => {
    const dm = make('a', '2026-10-16T12:00:00.000Z', {
      type: 'DIRECT_MESSAGE',
      resourceType: 'CHAT',
      metadata: { chatId: 4, messageId: 11 },
    })
    expect(notificationTarget(dm)).toBe('/chat?chat=4')
  })

  it('has no target for system notifications', () => {
    expect(
      notificationTarget(make('a', '2026-10-16T12:00:00.000Z', { type: 'SYSTEM', metadata: null })),
    ).toBeNull()
  })
})
