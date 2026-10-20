import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PostCard } from '../components/PostCard'
import type { Post } from '../types'

vi.mock('../i18n/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../services/api', () => ({
  votesApi: { voteOnPost: vi.fn() },
  getApiErrorMessage: vi.fn(),
}))

const post = {
  id: 1,
  title: 'Hello',
  score: 0,
  commentCount: 0,
  viewCount: 0,
  isPinned: false,
  isLocked: false,
  createdAt: new Date().toISOString(),
  community: { id: 5, name: 'typescript', displayName: 'TypeScript', iconUrl: null },
  author: { id: 1, username: 'ada', displayName: 'Ada' },
} as Post

describe('PostCard', () => {
  it("links the community name to the community's page", () => {
    render(
      <MemoryRouter>
        <ul>
          <PostCard post={post} />
        </ul>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'TypeScript' })).toHaveAttribute('href', '/c/typescript')
  })
})
