import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FriendRequestPanel } from '../FriendRequestPanel'
import type { FriendListItem, IncomingFriendRequestItem, OutgoingFriendRequestItem } from '../FriendRequestPanel'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    matches: false,
    media: '(max-width: 640px)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

const friends: FriendListItem[] = [
  { id: 'f1', username: 'alice', displayName: 'Alice', status: 'online' },
  { id: 'f2', username: 'bob', displayName: 'Bob', status: 'offline' },
]

const incoming: IncomingFriendRequestItem[] = [
  { id: 'r1', username: 'carol', displayName: 'Carol Display', avatarUrl: 'https://example.com/carol.png', profileColor: '#123456' },
]

const outgoing: OutgoingFriendRequestItem[] = [
  { id: 'o1', username: 'dave', displayName: 'Dave Display', profileColor: '#654321' },
]

function renderPanel(overrides: Partial<React.ComponentProps<typeof FriendRequestPanel>> = {}) {
  return render(
    <FriendRequestPanel
      requestUsername=""
      onRequestUsernameChange={vi.fn()}
      onSendRequest={vi.fn()}
      incomingRequests={incoming}
      onAcceptRequest={vi.fn()}
      onDeclineRequest={vi.fn()}
      outgoingRequests={outgoing}
      onCancelOutgoingRequest={vi.fn()}
      friends={friends}
      onStartDm={vi.fn()}
      onRemoveFriend={vi.fn()}
      {...overrides}
    />,
  )
}

describe('FriendRequestPanel', () => {
  it('renders the Friends aside', () => {
    renderPanel()
    expect(screen.getByRole('complementary', { name: /friends/i })).toBeTruthy()
  })

  it('renders the Friends header without an icon', () => {
    const { container } = renderPanel()
    const header = screen.getByText('Friends')
    expect(header.querySelector('svg')).toBeNull()
    expect(container.querySelector('aside svg')).toBeTruthy()
  })

  it('renders Online, All, Pending and Add Friend tabs', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: /^Online$/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^All$/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Pending/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /add friend/i })).toBeTruthy()
  })

  it('shows pending badge count = incoming + outgoing', () => {
    renderPanel()
    // 1 incoming + 1 outgoing = 2
    expect(screen.getByText('2')).toBeTruthy()
  })

  it('defaults to All tab and shows all friends', () => {
    renderPanel()
    // Default tab is 'all'
    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.getByText('Bob')).toBeTruthy()
  })

  it('switches to Online tab when clicked', () => {
    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: /^Online$/i }))
    // alice is online, bob is offline
    expect(screen.getByText(/online — 1/i)).toBeTruthy()
  })

  it('switches to Pending tab and shows incoming/outgoing sections', () => {
    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: /pending/i }))
    expect(screen.getByText(/incoming — 1/i)).toBeTruthy()
    expect(screen.getByText(/outgoing — 1/i)).toBeTruthy()
    expect(screen.getByText('Carol Display')).toBeTruthy()
    expect(screen.getByText('Dave Display')).toBeTruthy()
  })

  it('switches to Add Friend tab and shows form', () => {
    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: /add friend/i }))
    expect(screen.getByRole('textbox', { name: /friend username/i })).toBeTruthy()
  })

  it('calls onSendRequest when Add Friend form is submitted', () => {
    const onSendRequest = vi.fn()
    renderPanel({ requestUsername: 'newpal', onSendRequest })
    fireEvent.click(screen.getByRole('button', { name: /add friend/i }))
    const form = screen.getByRole('complementary', { name: /friends/i }).querySelector('form')!
    fireEvent.submit(form)
    expect(onSendRequest).toHaveBeenCalledWith('newpal')
  })

  it('calls onAcceptRequest when Accept button clicked on incoming request', () => {
    const onAcceptRequest = vi.fn()
    renderPanel({ onAcceptRequest })
    fireEvent.click(screen.getByRole('button', { name: /pending/i }))
    fireEvent.click(screen.getByRole('button', { name: /accept/i }))
    expect(onAcceptRequest).toHaveBeenCalledWith('r1')
  })

  it('calls onDeclineRequest when Decline button clicked on incoming request', () => {
    const onDeclineRequest = vi.fn()
    renderPanel({ onDeclineRequest })
    fireEvent.click(screen.getByRole('button', { name: /pending/i }))
    // Multiple decline buttons may appear; click first one
    fireEvent.click(screen.getAllByRole('button', { name: /decline/i })[0])
    expect(onDeclineRequest).toHaveBeenCalledWith('r1')
  })

  it('calls onStartDm when Message button clicked on a friend', () => {
    const onStartDm = vi.fn()
    renderPanel({ onStartDm })
    // Multiple message buttons exist (one per friend) — click the first one
    const messageBtns = screen.getAllByRole('button', { name: /message/i })
    fireEvent.click(messageBtns[0])
    expect(onStartDm).toHaveBeenCalled()
  })

  it('filters friends by search query on All tab', () => {
    renderPanel()
    const searchInput = screen.getByRole('textbox', { name: /search friends/i })
    fireEvent.change(searchInput, { target: { value: 'ali' } })
    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.queryByText('Bob')).toBeNull()
  })

  it('shows empty state when no friends and all tab has no results', () => {
    renderPanel({ friends: [] })
    expect(screen.getByText(/haven't added any friends/i)).toBeTruthy()
  })

  it('shows empty pending state when no requests', () => {
    renderPanel({ incomingRequests: [], outgoingRequests: [] })
    fireEvent.click(screen.getByRole('button', { name: /pending/i }))
    expect(screen.getByText(/no pending requests/i)).toBeTruthy()
  })

  it('renders friend avatar images when avatarUrl is provided', () => {
    const { container } = renderPanel({
      friends: [{ id: 'f1', username: 'alice', displayName: 'Alice', status: 'online', avatarUrl: 'https://example.com/alice.png' }],
      layoutMode: 'string',
    })
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
  })

  it('uses profileColor for friend fallback avatars', () => {
    const { container } = renderPanel({
      friends: [{ id: 'f1', username: 'alice', displayName: 'Alice', status: 'online', profileColor: '#123456' }],
      layoutMode: 'string',
    })
    const avatar = container.querySelector('div[aria-hidden="true"]') as HTMLElement | null
    expect(avatar).toBeTruthy()
    expect(avatar!.style.backgroundColor).toBe('rgb(18, 52, 86)')
  })

  it('renders the sender avatar image for incoming friend requests when available', () => {
    const { container } = renderPanel()
    fireEvent.click(screen.getByRole('button', { name: /pending/i }))
    const img = container.querySelector('img[src="https://example.com/carol.png"]')
    expect(img).toBeTruthy()
  })
})
