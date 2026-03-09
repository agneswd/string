import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DmListPane, type DmListItem } from '../DmListPane'

const channels: DmListItem[] = [
  { id: 'c1', name: 'Alice', status: 'online' },
  { id: 'c2', name: 'Bob', status: 'offline' },
  { id: 'c3', name: 'Carol', status: 'idle', lastMessage: 'Hey!' },
]

function renderPane(overrides: Partial<React.ComponentProps<typeof DmListPane>> = {}) {
  return render(
    <DmListPane
      channels={channels}
      {...overrides}
    />,
  )
}

describe('DmListPane', () => {
  it('renders nav with aria-label "Direct Messages"', () => {
    renderPane()
    expect(screen.getByRole('navigation', { name: /direct messages/i })).toBeTruthy()
  })

  it('renders all channel names', () => {
    renderPane()
    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.getByText('Bob')).toBeTruthy()
    expect(screen.getByText('Carol')).toBeTruthy()
  })

  it('calls onSelectChannel when a channel is clicked', () => {
    const onSelectChannel = vi.fn()
    renderPane({ onSelectChannel })
    const btn = screen.getByRole('button', { name: /direct message with Alice/i })
    fireEvent.click(btn)
    expect(onSelectChannel).toHaveBeenCalledWith('c1')
  })

  it('sets aria-pressed true on the selected channel', () => {
    renderPane({ selectedChannelId: 'c1' })
    const btn = screen.getByRole('button', { name: /direct message with Alice/i })
    expect(btn.getAttribute('aria-pressed')).toBe('true')
  })

  it('sets aria-pressed false on unselected channels', () => {
    renderPane({ selectedChannelId: 'c1' })
    const btn = screen.getByRole('button', { name: /direct message with Bob/i })
    expect(btn.getAttribute('aria-pressed')).toBe('false')
  })

  it('renders Friends button', () => {
    renderPane()
    expect(screen.getByRole('button', { name: /friends/i })).toBeTruthy()
  })

  it('calls onShowFriends when Friends button clicked', () => {
    const onShowFriends = vi.fn()
    renderPane({ onShowFriends })
    fireEvent.click(screen.getByRole('button', { name: /friends/i }))
    expect(onShowFriends).toHaveBeenCalled()
  })

  it('shows a friends badge count when pending requests or invites exist', () => {
    renderPane({ friendsBadgeCount: 3, layoutMode: 'string' })
    expect(screen.getByText('3')).toBeTruthy()
  })

  it('renders the string friends button without an icon', () => {
    renderPane({ layoutMode: 'string' })
    const button = screen.getByRole('button', { name: /friends/i })
    expect(button.querySelector('svg')).toBeNull()
    expect(button.style.fontFamily).toBe('var(--font-mono)')
  })

  it('renders the section title', () => {
    renderPane({ title: 'Messages' })
    expect(screen.getByText('Messages')).toBeTruthy()
  })

  it('falls back to "Direct Messages" when no title provided', () => {
    renderPane()
    expect(screen.getByText('Direct Messages')).toBeTruthy()
  })

  it('renders last message preview when provided', () => {
    renderPane()
    expect(screen.getByText('Hey!')).toBeTruthy()
  })

  it('shows empty state when channels is empty', () => {
    renderPane({ channels: [] })
    expect(screen.getByText(/no direct messages yet/i)).toBeTruthy()
  })

  it('filters channels by search input', () => {
    renderPane()
    const searchInput = screen.getByPlaceholderText(/search direct messages/i)
    fireEvent.change(searchInput, { target: { value: 'ali' } })
    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.queryByText('Bob')).toBeNull()
  })

  it('shows "no conversations found" when filter yields no results', () => {
    renderPane()
    const searchInput = screen.getByPlaceholderText(/search direct messages/i)
    fireEvent.change(searchInput, { target: { value: 'zzz' } })
    expect(screen.getByText(/no conversations found/i)).toBeTruthy()
  })

  it('renders create DM button when onCreateChannel is provided', () => {
    const onCreateChannel = vi.fn()
    renderPane({ onCreateChannel })
    // The "+" button should exist somewhere
    expect(screen.getByRole('button', { name: /create dm/i })).toBeTruthy()
  })

  it('renders unread badge when channel has unreadCount', () => {
    const channelsWithUnread: DmListItem[] = [
      { id: 'u1', name: 'Dave', status: 'online', unreadCount: 3 },
    ]
    renderPane({ channels: channelsWithUnread })
    expect(screen.getByText('3')).toBeTruthy()
  })

  it('uses rounded-square avatars in string mode', () => {
    const channelsWithAvatar: DmListItem[] = [
      { id: 'u1', name: 'Dave', status: 'online', avatarUrl: 'https://example.com/dave.png' },
    ]
    const { container } = renderPane({ channels: channelsWithAvatar, layoutMode: 'string' })
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img!.style.borderRadius).toBe('var(--radius-sm)')
  })

  it('uses profileColor for fallback avatars in string mode', () => {
    const channelsWithColor: DmListItem[] = [
      { id: 'u1', name: 'Dave', status: 'online', profileColor: '#123456' },
    ]
    const { container } = renderPane({ channels: channelsWithColor, layoutMode: 'string' })
    const avatar = container.querySelector('li button div div') as HTMLElement | null
    expect(avatar).toBeTruthy()
    expect(avatar!.style.background).toBe('rgb(18, 52, 86)')
  })

  it('positions the string-mode status dot into the avatar corner', () => {
    const { container } = renderPane({ layoutMode: 'string' })
    const statusDot = container.querySelector('[aria-label="online"]') as HTMLElement | null
    expect(statusDot).toBeTruthy()
    expect(statusDot!.style.right).toBe('-3px')
    expect(statusDot!.style.bottom).toBe('-3px')
  })

  it('uses square unread badges in string mode', () => {
    const channelsWithUnread: DmListItem[] = [
      { id: 'u1', name: 'Dave', status: 'online', unreadCount: 3 },
    ]
    const { container } = renderPane({ channels: channelsWithUnread, layoutMode: 'string' })
    const badge = container.querySelector('[aria-label="3 unread"]') as HTMLElement | null
    expect(badge).toBeTruthy()
    expect(badge!.style.borderRadius).toBe('2px')
  })
})
