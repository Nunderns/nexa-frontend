import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CreatePostForm } from '../components/CreatePostForm'
import { communitiesApi, mediaApi, postsApi } from '../services/api'

// Identity `t`, so assertions run on raw translation keys.
vi.mock('../i18n/I18nContext', () => ({
  useI18n: () => ({ t: (key: string, values?: Record<string, string | number>) =>
    values ? `${key}:${Object.values(values).join(',')}` : key }),
}))

vi.mock('../services/api', () => ({
  communitiesApi: { getJoined: vi.fn() },
  postsApi: { create: vi.fn(), remove: vi.fn() },
  mediaApi: { uploadFile: vi.fn() },
  getApiErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback),
}))

const joined = [
  { id: 3, name: 'rust', displayName: 'Rust Corner' },
  { id: 7, name: 'ts', displayName: 'TypeScript Lab' },
]

function page<T>(data: T[]) {
  return { data, total: data.length, page: 1, limit: 100, totalPages: 1 }
}

function renderForm(defaultCommunityId: number | null = null) {
  const onCreated = vi.fn()
  render(
    <MemoryRouter>
      <CreatePostForm defaultCommunityId={defaultCommunityId} onCreated={onCreated} onCancel={vi.fn()} />
    </MemoryRouter>,
  )
  return { onCreated }
}

describe('CreatePostForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(communitiesApi.getJoined).mockResolvedValue(page(joined) as never)
    vi.mocked(postsApi.create).mockResolvedValue({ id: 42 } as never)
    vi.mocked(postsApi.remove).mockResolvedValue(undefined)
    vi.mocked(mediaApi.uploadFile).mockResolvedValue({ id: 1 } as never)
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
  })

  it('offers only the joined communities', async () => {
    renderForm()

    const options = await screen.findAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual([
      'composer.chooseCommunity',
      'Rust Corner',
      'TypeScript Lab',
    ])
    expect(communitiesApi.getJoined).toHaveBeenCalledWith(1, 100)
  })

  it('preselects the default community only when the user joined it', async () => {
    renderForm(7)
    expect(await screen.findByRole('combobox')).toHaveValue('7')
  })

  it('falls back to the first joined community', async () => {
    renderForm(99)
    expect(await screen.findByRole('combobox')).toHaveValue('3')
  })

  it('shows an empty state when the user joined nothing', async () => {
    vi.mocked(communitiesApi.getJoined).mockResolvedValue(page([]) as never)
    renderForm()

    expect(await screen.findByText('composer.noJoinedTitle')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('requires a file for an image post, then uploads it to the new post', async () => {
    const user = userEvent.setup()
    const { onCreated } = renderForm()

    await user.click(await screen.findByRole('tab', { name: 'composer.typeImage' }))
    await user.type(screen.getByPlaceholderText('composer.titlePlaceholder'), 'Sunset')

    const publish = screen.getByRole('button', { name: 'composer.publish' })
    expect(publish).toBeDisabled()

    const image = new File(['png'], 'sunset.png', { type: 'image/png' })
    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, image)
    expect(screen.getByRole('img', { name: 'sunset.png' })).toBeInTheDocument()

    await user.click(publish)

    await waitFor(() => expect(onCreated).toHaveBeenCalled())
    expect(postsApi.create).toHaveBeenCalledWith({
      title: 'Sunset',
      content: '',
      communityId: 3,
      postType: 'IMAGE',
    })
    expect(mediaApi.uploadFile).toHaveBeenCalledWith(42, image, expect.any(Function))
  })

  it('rejects a file above the size limit', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(await screen.findByRole('tab', { name: 'composer.typeImage' }))
    await user.type(screen.getByPlaceholderText('composer.titlePlaceholder'), 'Huge')

    const huge = new File(['x'], 'huge.png', { type: 'image/png' })
    Object.defineProperty(huge, 'size', { value: 11 * 1024 * 1024 })
    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, huge)

    expect(screen.getByText('composer.fileTooLarge:10')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'composer.publish' })).toBeDisabled()
  })

  it('deletes the post again when the upload fails', async () => {
    const user = userEvent.setup()
    vi.mocked(mediaApi.uploadFile).mockRejectedValue(new Error('boom'))
    const { onCreated } = renderForm()

    await user.click(await screen.findByRole('tab', { name: 'composer.typeVideo' }))
    await user.type(screen.getByPlaceholderText('composer.titlePlaceholder'), 'Clip')
    await user.upload(
      document.querySelector('input[type="file"]') as HTMLInputElement,
      new File(['mp4'], 'clip.mp4', { type: 'video/mp4' }),
    )
    await user.click(screen.getByRole('button', { name: 'composer.publish' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('composer.uploadFailed')
    expect(postsApi.remove).toHaveBeenCalledWith(42)
    expect(onCreated).not.toHaveBeenCalled()
  })

  it('sends a link post with the URL as content and no upload', async () => {
    const user = userEvent.setup()
    const { onCreated } = renderForm()

    await user.click(await screen.findByRole('tab', { name: 'composer.typeLink' }))
    await user.type(screen.getByPlaceholderText('composer.titlePlaceholder'), 'Docs')
    await user.type(screen.getByPlaceholderText('composer.linkUrlPlaceholder'), 'https://nexa.dev')
    await user.click(screen.getByRole('button', { name: 'composer.publish' }))

    await waitFor(() => expect(onCreated).toHaveBeenCalled())
    expect(postsApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ postType: 'LINK', content: 'https://nexa.dev' }),
    )
    expect(mediaApi.uploadFile).not.toHaveBeenCalled()
  })
})
