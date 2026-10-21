import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CommunityPage } from '@/app/routes/CommunityPage'
import { communitiesApi } from '@/features/communities/api/communities'
import { postsApi } from '@/features/posts/api/posts'
import type { Community, CommunityMembership } from '@/types/api'

vi.mock('@/lib/i18n/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: 'en',
  }),
}))

vi.mock('@/features/communities/api/communities', () => ({
  communitiesApi: {
    getByName: vi.fn(),
    getById: vi.fn(),
    getMembership: vi.fn(),
    getStats: vi.fn(),
    join: vi.fn(),
    leave: vi.fn(),
  },
}))

vi.mock('@/features/posts/api/posts', () => ({
  postsApi: {
    getByCommunity: vi.fn(),
  },
}))

vi.mock('@/lib/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api-client')>()),
  getApiErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback),
}))

vi.mock('@/app/layouts/TopBar', () => ({
  TopBar: () => <div data-testid="topbar" />,
}))

vi.mock('@/features/posts/components/CreatePostForm', () => ({
  CreatePostForm: ({ defaultCommunityId }: { defaultCommunityId: number }) => (
    <div data-testid="composer">{defaultCommunityId}</div>
  ),
}))

vi.mock('@/features/posts/components/PostCard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/posts/components/PostCard')>()),
  PostCard: ({ post }: { post: { title: string } }) => <li data-testid="post-card">{post.title}</li>,
}))

const community: Community = {
  id: 5,
  name: 'typescript',
  displayName: 'TypeScript',
  description: 'Types all the way down',
  iconUrl: null,
  bannerUrl: null,
  isPrivate: false,
  isNsfw: true,
  memberCount: 10,
  postCount: 1,
  createdBy: 1,
  createdAt: '2026-01-15T12:00:00Z',
  updatedAt: '2026-01-15T12:00:00Z',
}

const api = vi.mocked(communitiesApi)
const posts = vi.mocked(postsApi)

function setup(membership: CommunityMembership, overrides: Partial<Community> = {}) {
  api.getByName.mockResolvedValue({ ...community, ...overrides })
  api.getMembership.mockResolvedValue(membership)
  api.getStats.mockResolvedValue({ weekStart: '2026-10-19T00:00:00Z', visitors: 1500, contributions: 7 })
  posts.getByCommunity.mockResolvedValue({
    data: [{ id: 1, title: 'Hello' } as never],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  })

  return render(
    <MemoryRouter initialEntries={['/c/typescript']}>
      <Routes>
        <Route path="/c/:name" element={<CommunityPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CommunityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the community by its URL name and shows header, about and stats', async () => {
    setup({ role: 'MEMBER', isBanned: false })

    expect(await screen.findByRole('heading', { name: 'TypeScript' })).toBeInTheDocument()
    expect(api.getByName).toHaveBeenCalledWith('typescript')
    expect(screen.getByText('c/typescript')).toBeInTheDocument()
    expect(screen.getByText('Types all the way down')).toBeInTheDocument()
    expect(screen.getByText('communityPage.adult')).toBeInTheDocument()
    expect(screen.getByText('communityPage.public')).toBeInTheDocument()
    expect(screen.getByText('1.5k')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByTestId('post-card')).toHaveTextContent('Hello')
  })

  it('gives members Post and a disabled Notifications button, but no Moderation', async () => {
    setup({ role: 'MEMBER', isBanned: false })

    await userEvent.click(await screen.findByRole('button', { name: 'communityPage.post' }))
    expect(screen.getByTestId('composer')).toHaveTextContent('5')
    expect(screen.getByRole('button', { name: 'communityPage.notifications' })).toBeDisabled()
    expect(screen.queryByRole('link', { name: 'communityPage.moderation' })).not.toBeInTheDocument()
  })

  it.each(['OWNER', 'MODERATOR'] as const)('shows the Moderation button to a %s', async (role) => {
    setup({ role, isBanned: false })

    const link = await screen.findByRole('link', { name: 'communityPage.moderation' })
    expect(link).toHaveAttribute('href', '/c/typescript/mod')
  })

  it('offers Join instead of Post to non-members of a public community', async () => {
    setup({ role: null, isBanned: false })

    expect(await screen.findByRole('button', { name: 'communityPage.join' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'communityPage.post' })).not.toBeInTheDocument()
  })

  it('keeps unsupported menu items disabled and lets a member leave', async () => {
    setup({ role: 'MEMBER', isBanned: false })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    api.leave.mockResolvedValue(undefined)
    api.getById.mockResolvedValue(community)

    await userEvent.click(await screen.findByRole('button', { name: 'communityPage.moreOptions' }))

    for (const key of ['addToCustomFeed', 'removeFromFavorites', 'mute']) {
      expect(screen.getByRole('menuitem', { name: new RegExp(`communityPage.${key}`) })).toBeDisabled()
    }

    await userEvent.click(screen.getByRole('menuitem', { name: 'communityPage.leave' }))
    expect(api.leave).toHaveBeenCalledWith(5)
  })

  it('does not let the owner leave', async () => {
    setup({ role: 'OWNER', isBanned: false })

    await userEvent.click(await screen.findByRole('button', { name: 'communityPage.moreOptions' }))
    expect(screen.getByRole('menuitem', { name: 'communityPage.leave' })).toBeDisabled()
  })

  it('explains that a private community hides its posts from non-members', async () => {
    setup({ role: null, isBanned: false }, { isPrivate: true })
    posts.getByCommunity.mockRejectedValue({ response: { status: 403 } })
    api.getStats.mockRejectedValue({ response: { status: 403 } })

    expect(await screen.findByText('communityPage.privateLocked')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'communityPage.join' })).not.toBeInTheDocument()
    expect(screen.queryByText('communityPage.thisWeek')).not.toBeInTheDocument()
  })

  it('shows a not-found state for an unknown name', async () => {
    api.getByName.mockRejectedValue({ response: { status: 404 } })

    render(
      <MemoryRouter initialEntries={['/c/nope']}>
        <Routes>
          <Route path="/c/:name" element={<CommunityPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('communityPage.notFound')).toBeInTheDocument()
  })
})
