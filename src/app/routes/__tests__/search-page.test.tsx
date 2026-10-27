import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { SearchPage } from '@/app/routes/SearchPage'
import { searchApi } from '@/features/search/api/search'

vi.mock('@/lib/i18n/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string, values?: Record<string, string | number>) =>
      values?.count !== undefined ? `${key}:${values.count}` : key,
    locale: 'en',
  }),
}))

vi.mock('@/features/search/api/search', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/search/api/search')>()),
  searchApi: { search: vi.fn() },
}))

vi.mock('@/app/layouts/TopBar', () => ({
  TopBar: () => <div data-testid="topbar" />,
}))

vi.mock('@/features/posts/components/PostCard', () => ({
  PostCard: ({ post }: { post: { title: string } }) => <li>{post.title}</li>,
}))

const search = vi.mocked(searchApi.search)

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search}</output>
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/search" element={<SearchPage />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  )
}

const page = (rows: object[], total = rows.length, totalPages = 1) => ({
  data: rows.map((row, i) => ({ id: i + 1, ...row })),
  total,
  page: 1,
  limit: 10,
  totalPages,
})

describe('SearchPage', () => {
  beforeEach(() => {
    search.mockReset()
    search.mockResolvedValue(page([{ title: 'React hooks' }]) as never)
  })

  it('asks for a term and does not call the API without one', () => {
    renderAt('/search')

    expect(screen.getByText('search.promptTitle')).toBeInTheDocument()
    expect(search).not.toHaveBeenCalled()
  })

  it('searches posts by default and shows the server total', async () => {
    search.mockResolvedValue(page([{ title: 'React hooks' }], 23, 3) as never)
    renderAt('/search?q=react')

    expect(await screen.findByText('React hooks')).toBeInTheDocument()
    expect(screen.getByText('search.resultsCountPlural:23')).toBeInTheDocument()
    expect(search).toHaveBeenCalledWith('posts', 'react', 1, 10)
    expect(screen.getByRole('tab', { name: 'search.tabPosts' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('switches tabs through the URL', async () => {
    search.mockImplementation(((type: string) =>
      Promise.resolve(
        type === 'communities'
          ? page([{ name: 'reactjs', displayName: 'ReactJS', memberCount: 4 }])
          : page([{ title: 'React hooks' }]),
      )) as never)
    renderAt('/search?q=react')
    await screen.findByText('React hooks')

    await userEvent.click(screen.getByRole('tab', { name: 'search.tabCommunities' }))

    expect(await screen.findByText('ReactJS')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ReactJS/ })).toHaveAttribute('href', '/c/reactjs')
    expect(screen.getByTestId('location')).toHaveTextContent('/search?q=react&type=communities')
    expect(search).toHaveBeenLastCalledWith('communities', 'react', 1, 10)
  })

  it('lists users without linking to a profile', async () => {
    search.mockResolvedValue(
      page([{ username: 'jose_silva', displayName: 'José Silva', karma: 12 }]) as never,
    )
    renderAt('/search?q=jose&type=users')

    expect(await screen.findByText('José Silva')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('falls back to posts for an unknown type', async () => {
    renderAt('/search?q=react&type=comments')

    await screen.findByText('React hooks')
    expect(search).toHaveBeenCalledWith('posts', 'react', 1, 10)
  })

  it('shows the empty state', async () => {
    search.mockResolvedValue(page([]) as never)
    renderAt('/search?q=zzz')

    expect(await screen.findByText('search.emptyTitle')).toBeInTheDocument()
  })
})
