import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { ProfilePage } from '../pages/ProfilePage'

// Mock the hooks
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser', displayName: 'Test User' },
  }),
}))

vi.mock('../i18n/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../services/api', () => ({
  usersApi: {
    getById: vi.fn().mockResolvedValue({
      id: 1,
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      karma: 100,
      isActive: true,
      createdAt: new Date().toISOString(),
    }),
    getPosts: vi.fn().mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    }),
    getComments: vi.fn().mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    }),
    getUpvoted: vi.fn().mockResolvedValue({
      data: [
        { id: 1, title: 'Upvoted Post 1', content: 'Content 1' },
        { id: 2, title: 'Upvoted Post 2', content: 'Content 2' },
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    }),
    getDownvoted: vi.fn().mockResolvedValue({
      data: [
        { id: 3, title: 'Downvoted Post 1', content: 'Content 3' },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    }),
  },
  getApiErrorMessage: vi.fn(() => 'Error message'),
}))

vi.mock('../components/TopBar', () => ({
  TopBar: () => <div data-testid="topbar">TopBar</div>,
}))

vi.mock('../components/PostCard', () => ({
  PostCard: ({ post }: { post: any }) => (
    <div data-testid="post-card">{post.title}</div>
  ),
}))

vi.mock('../components/CommentCard', () => ({
  CommentCard: ({ comment }: { comment: any }) => (
    <div data-testid="comment-card">{comment.content}</div>
  ),
}))

describe('ProfilePage - Upvoted and Downvoted Tabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render upvoted tab with posts', async () => {
    const { usersApi } = await import('../services/api')

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    )

    const upvotedTab = screen.getByText('profile.tabUpvoted')
    await userEvent.click(upvotedTab)

    await waitFor(() => {
      expect(usersApi.getUpvoted).toHaveBeenCalledWith(1, 1, 10)
    })

    await waitFor(() => {
      const postCards = screen.getAllByTestId('post-card')
      expect(postCards).toHaveLength(2)
      expect(postCards[0]).toHaveTextContent('Upvoted Post 1')
      expect(postCards[1]).toHaveTextContent('Upvoted Post 2')
    })
  })

  it('should render downvoted tab with posts', async () => {
    const { usersApi } = await import('../services/api')

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    )

    const downvotedTab = screen.getByText('profile.tabDownvoted')
    await userEvent.click(downvotedTab)

    await waitFor(() => {
      expect(usersApi.getDownvoted).toHaveBeenCalledWith(1, 1, 10)
    })

    await waitFor(() => {
      const postCards = screen.getAllByTestId('post-card')
      expect(postCards).toHaveLength(1)
      expect(postCards[0]).toHaveTextContent('Downvoted Post 1')
    })
  })

  it('should show empty state when no upvoted posts', async () => {
    const { usersApi } = await import('../services/api')
    vi.mocked(usersApi.getUpvoted).mockResolvedValueOnce({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    })

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    )

    const upvotedTab = screen.getByText('profile.tabUpvoted')
    await userEvent.click(upvotedTab)

    await waitFor(() => {
      expect(screen.getByText('profile.noUpvotedTitle')).toBeInTheDocument()
      expect(screen.getByText('profile.noUpvotedBody')).toBeInTheDocument()
    })
  })

  it('should show empty state when no downvoted posts', async () => {
    const { usersApi } = await import('../services/api')
    vi.mocked(usersApi.getDownvoted).mockResolvedValueOnce({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    })

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    )

    const downvotedTab = screen.getByText('profile.tabDownvoted')
    await userEvent.click(downvotedTab)

    await waitFor(() => {
      expect(screen.getByText('profile.noDownvotedTitle')).toBeInTheDocument()
      expect(screen.getByText('profile.noDownvotedBody')).toBeInTheDocument()
    })
  })
})
