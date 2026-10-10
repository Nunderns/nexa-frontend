import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PostDetailPage } from '../pages/PostDetailPage'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 6, username: 'theo_quill', displayName: 'Theo Quill' },
  }),
}))

// Identity `t`, so assertions run on raw translation keys.
vi.mock('../i18n/I18nContext', () => ({
  useI18n: () => ({ t: (key: string, values?: Record<string, string | number>) =>
    values ? `${key}:${Object.values(values).join(',')}` : key }),
}))

const mockPost = {
  id: 2,
  communityId: 1,
  authorId: 6,
  title: 'When should I use `satisfies`?',
  content: 'It keeps the literal types, right?',
  postType: 'TEXT',
  score: 3,
  upvoteCount: 30,
  downvoteCount: 0,
  commentCount: 2,
  viewCount: 575,
  shareCount: 18,
  repostCount: 4,
  awardCount: 1,
  isPinned: false,
  isLocked: false,
  isDeleted: false,
  createdAt: new Date(Date.now() - 52 * 3_600_000).toISOString(),
  updatedAt: new Date().toISOString(),
  community: { id: 1, name: 'typescript_lab', displayName: 'TypeScript Lab' },
  author: { id: 6, username: 'theo_quill', displayName: 'Theo Quill' },
}

const mockInsights = {
  postId: 2,
  title: mockPost.title,
  communityName: 'typescript_lab',
  authorId: 6,
  publishedAt: mockPost.createdAt,
  reach: { views: 575, viewsLast24h: 16, hoursTracked: 48 },
  hourlyViews: [
    { bucketStart: mockPost.createdAt, hour: 1, views: 27 },
    { bucketStart: mockPost.createdAt, hour: 2, views: 35 },
    { bucketStart: mockPost.createdAt, hour: 3, views: 0 },
  ],
  countries: {
    top: [
      { countryCode: 'US', views: 328, percentage: 57 },
      { countryCode: 'BR', views: 68, percentage: 11.8 },
      { countryCode: 'TH', views: 62, percentage: 10.8 },
    ],
    other: { countryCode: 'XX', views: 117, percentage: 20.3 },
  },
  engagement: {
    upvotes: 30,
    downvotes: 0,
    upvoteRatio: 100,
    comments: 2,
    shares: 18,
    reposts: 4,
    awards: 1,
  },
}

vi.mock('../services/api', () => ({
  postsApi: {
    getById: vi.fn(),
    getInsights: vi.fn(),
    recordView: vi.fn().mockResolvedValue(undefined),
  },
  commentsApi: {
    getByPost: vi.fn().mockResolvedValue({
      data: [{ id: 1, content: 'First comment' }],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
  },
  getApiErrorMessage: vi.fn(() => 'Error message'),
}))

vi.mock('../components/TopBar', () => ({
  TopBar: () => <div data-testid="topbar">TopBar</div>,
}))

vi.mock('../components/CommentCard', () => ({
  CommentCard: ({ comment }: { comment: { content: string } }) => (
    <div data-testid="comment-card">{comment.content}</div>
  ),
}))

function renderPage(path = '/posts/2') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/posts/:postId" element={<PostDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PostDetailPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { postsApi, commentsApi } = await import('../services/api')
    vi.mocked(postsApi.getById).mockResolvedValue(mockPost)
    vi.mocked(postsApi.getInsights).mockResolvedValue(mockInsights)
    vi.mocked(commentsApi.getByPost).mockResolvedValue({
      data: [{ id: 1, content: 'First comment' } as never],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    })
  })

  it('should render the post title and body', async () => {
    renderPage()

    expect(await screen.findByText(mockPost.title)).toBeInTheDocument()
    expect(screen.getByText(mockPost.content)).toBeInTheDocument()
  })

  it('should fire exactly one view beacon for the opened post', async () => {
    const { postsApi } = await import('../services/api')
    renderPage()

    await waitFor(() => {
      expect(postsApi.recordView).toHaveBeenCalledTimes(1)
    })
    expect(postsApi.recordView).toHaveBeenCalledWith(2)
  })

  it('should fetch insights for the post', async () => {
    const { postsApi } = await import('../services/api')
    renderPage()

    await waitFor(() => {
      expect(postsApi.getInsights).toHaveBeenCalledWith(2)
    })
  })

  it('should render the reach totals', async () => {
    renderPage()

    expect(await screen.findByText('insights.title')).toBeInTheDocument()
    expect(screen.getByText('575')).toBeInTheDocument()
    expect(screen.getByText(/insights.viewsLast24h/)).toBeInTheDocument()
  })

  it('should render one bar per hour, including the zero hours', async () => {
    const { container } = renderPage()

    await screen.findByText('insights.hourly')
    expect(container.querySelectorAll('.insights-bar')).toHaveLength(3)
  })

  it('should render the top countries plus the other bucket', async () => {
    renderPage()

    expect(await screen.findByText('insights.countries')).toBeInTheDocument()
    expect(screen.getByText('57%')).toBeInTheDocument()
    expect(screen.getByText('11.8%')).toBeInTheDocument()
    expect(screen.getByText('insights.other')).toBeInTheDocument()
    expect(screen.getByText('20.3%')).toBeInTheDocument()
  })

  it('should render every engagement counter', async () => {
    renderPage()

    expect(await screen.findByText('insights.engagement')).toBeInTheDocument()
    expect(screen.getByText('insights.upvotes')).toBeInTheDocument()
    expect(screen.getByText('insights.upvoteRatio')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('insights.shares')).toBeInTheDocument()
    expect(screen.getByText('insights.reposts')).toBeInTheDocument()
    expect(screen.getByText('insights.awards')).toBeInTheDocument()
  })

  it('should show "no votes yet" instead of a 0% ratio', async () => {
    const { postsApi } = await import('../services/api')
    vi.mocked(postsApi.getInsights).mockResolvedValueOnce({
      ...mockInsights,
      engagement: { ...mockInsights.engagement, upvotes: 0, downvotes: 0, upvoteRatio: null },
    })

    renderPage()

    expect(await screen.findByText('insights.noVotes')).toBeInTheDocument()
  })

  it('should render the comments list', async () => {
    renderPage()

    expect(await screen.findByTestId('comment-card')).toHaveTextContent('First comment')
  })

  it('should show an empty state when the post has no reach data', async () => {
    const { postsApi } = await import('../services/api')
    vi.mocked(postsApi.getInsights).mockResolvedValueOnce({
      ...mockInsights,
      reach: { views: 0, viewsLast24h: 0, hoursTracked: 3 },
      hourlyViews: [],
      countries: { top: [], other: { countryCode: 'XX', views: 0, percentage: 0 } },
    })

    renderPage()

    expect(await screen.findByText('insights.emptyTitle')).toBeInTheDocument()
  })

  it('should still render the post when insights are forbidden', async () => {
    const { postsApi } = await import('../services/api')
    vi.mocked(postsApi.getInsights).mockRejectedValueOnce(
      Object.assign(new Error('Forbidden'), { response: { status: 403 } }),
    )

    renderPage()

    expect(await screen.findByText(mockPost.title)).toBeInTheDocument()
    expect(screen.queryByText('insights.title')).not.toBeInTheDocument()
  })

  it('should show the not-found state for a post the API cannot resolve', async () => {
    const { postsApi } = await import('../services/api')
    vi.mocked(postsApi.getById).mockRejectedValueOnce(
      Object.assign(new Error('Not found'), { response: { status: 404 } }),
    )

    renderPage()

    expect(await screen.findByText('post.notFoundTitle')).toBeInTheDocument()
    expect(postsApi.recordView).not.toHaveBeenCalled()
  })

  it('should surface a network failure instead of a not-found state', async () => {
    const { postsApi } = await import('../services/api')
    vi.mocked(postsApi.getById).mockRejectedValueOnce(new Error('network down'))

    renderPage()

    expect(await screen.findByText('Error message')).toBeInTheDocument()
    expect(screen.queryByText('post.notFoundBody')).not.toBeInTheDocument()
  })

  it('should not call the API for a non-numeric post id', async () => {
    const { postsApi } = await import('../services/api')
    renderPage('/posts/abc')

    expect(await screen.findByText('post.notFoundTitle')).toBeInTheDocument()
    expect(postsApi.getById).not.toHaveBeenCalled()
  })
})