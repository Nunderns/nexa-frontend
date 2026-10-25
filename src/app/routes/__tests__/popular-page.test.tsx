import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { PopularPage } from '@/app/routes/PopularPage'
import { postsApi } from '@/features/posts/api/posts'

vi.mock('@/lib/i18n/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string, values?: Record<string, string>) =>
      values?.country ? `${key}:${values.country}` : key,
    locale: 'en',
  }),
}))

vi.mock('@/features/posts/api/posts', () => ({
  postsApi: { getPopular: vi.fn() },
}))

vi.mock('@/app/layouts/TopBar', () => ({
  TopBar: () => <div data-testid="topbar" />,
}))

vi.mock('@/features/posts/components/PostCard', () => ({
  PostCard: ({ post }: { post: { title: string } }) => <li>{post.title}</li>,
}))

const getPopular = vi.mocked(postsApi.getPopular)

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search}</output>
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/popular/:sort?" element={<PopularPage />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  )
}

const page = (titles: string[]) => ({
  data: titles.map((title, i) => ({ id: i + 1, title })),
  total: titles.length,
  page: 1,
  limit: 10,
  totalPages: 1,
})

describe('PopularPage', () => {
  beforeEach(() => {
    getPopular.mockReset()
    getPopular.mockResolvedValue(page(['first post']) as never)
  })

  it('redirects /popular to the hot tab, keeping the filters', async () => {
    renderAt('/popular?geo=br')

    expect(await screen.findByText('first post')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/popular/hot?geo=br')
    expect(getPopular).toHaveBeenCalledWith({ sort: 'hot', t: 'day', geo: 'BR', page: 1, limit: 10 })
  })

  it('sends the sort, window and country from the URL', async () => {
    renderAt('/popular/top?t=week&geo=FR')

    await screen.findByText('first post')
    expect(getPopular).toHaveBeenCalledWith({ sort: 'top', t: 'week', geo: 'FR', page: 1, limit: 10 })
    expect(screen.getByRole('button', { name: /popular.timeLabel/ })).toBeInTheDocument()
  })

  it('drops a country outside the list and hides the window outside top', async () => {
    renderAt('/popular/rising?geo=ZZ&t=week')

    await screen.findByText('first post')
    expect(getPopular).toHaveBeenCalledWith({ sort: 'rising', t: 'week', geo: undefined, page: 1, limit: 10 })
    expect(screen.queryByRole('button', { name: /popular.timeLabel/ })).not.toBeInTheDocument()
  })

  it('switching tabs keeps the country', async () => {
    renderAt('/popular/hot?geo=BR')
    await screen.findByText('first post')

    await userEvent.click(screen.getByRole('link', { name: 'popular.sort.new' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/popular/new?geo=BR')
    expect(getPopular).toHaveBeenLastCalledWith({ sort: 'new', t: 'day', geo: 'BR', page: 1, limit: 10 })
  })

  it('picking a country refetches and shows its empty state', async () => {
    renderAt('/popular/hot')
    await screen.findByText('first post')
    getPopular.mockResolvedValue(page([]) as never)

    await userEvent.click(screen.getByRole('button', { name: /popular.geoLabel/ }))
    await userEvent.click(screen.getByRole('menuitemradio', { name: /Brasil|Brazil/ }))

    expect(screen.getByTestId('location')).toHaveTextContent('/popular/hot?geo=BR')
    expect(await screen.findByText(/popular.emptyGeo:(Brasil|Brazil)/)).toBeInTheDocument()
  })
})
