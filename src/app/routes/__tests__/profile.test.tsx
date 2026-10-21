import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ProfilePage } from '@/app/routes/profile/ProfilePage'

// Mock the hooks
vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser', displayName: 'Test User' },
  }),
}))

vi.mock('@/lib/i18n/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/features/users/api/users', () => ({
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
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    }),
    getDownvoted: vi.fn().mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    }),
  },
}))

vi.mock('@/lib/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api-client')>()),
  getApiErrorMessage: vi.fn(() => 'Error message'),
}))

vi.mock('@/app/layouts/TopBar', () => ({
  TopBar: () => <div data-testid="topbar">TopBar</div>,
}))

vi.mock('@/features/posts/components/PostCard', () => ({
  PostCard: ({ post }: { post: any }) => <div data-testid="post-card">{post.title}</div>,
}))

vi.mock('@/features/comments/components/CommentCard', () => ({
  CommentCard: ({ comment }: { comment: any }) => (
    <div data-testid="comment-card">{comment.content}</div>
  ),
}))

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render profile page with tabs', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    )

    // Check if tabs are rendered
    expect(screen.getByText('profile.tabOverview')).toBeInTheDocument()
    expect(screen.getByText('profile.tabPosts')).toBeInTheDocument()
    expect(screen.getByText('profile.tabComments')).toBeInTheDocument()
    expect(screen.getByText('profile.tabUpvoted')).toBeInTheDocument()
    expect(screen.getByText('profile.tabDownvoted')).toBeInTheDocument()
  })

  it('should render topbar', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    )

    expect(screen.getByTestId('topbar')).toBeInTheDocument()
  })
})
