import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChannelListPane, type ChannelListItem } from '../ChannelListPane'

const textChannels: ChannelListItem[] = [
  { id: 'ch1', name: 'general', kind: 'text' },
  { id: 'ch2', name: 'announcements', kind: 'text' },
]

const mixedChannels: ChannelListItem[] = [
  { id: 'ch1', name: 'general', kind: 'text', category: 'Text Channels' },
  { id: 'ch2', name: 'announcements', kind: 'text', category: 'Text Channels' },
  { id: 'ch3', name: 'Lounge', kind: 'voice', category: 'Voice Channels' },
]

function renderPane(overrides: Partial<React.ComponentProps<typeof ChannelListPane>> = {}) {
  return render(
    <ChannelListPane
      guildName="Test Guild"
      channels={textChannels}
      {...overrides}
    />,
  )
}

describe('ChannelListPane', () => {
  it('renders the guild name in the header', () => {
    renderPane()
    expect(screen.getByText('Test Guild')).toBeTruthy()
  })

  it('renders all channel names', () => {
    renderPane()
    expect(screen.getByText('general')).toBeTruthy()
    expect(screen.getByText('announcements')).toBeTruthy()
  })

  it('calls onSelectChannel when a channel button is clicked', () => {
    const onSelectChannel = vi.fn()
    renderPane({ onSelectChannel })
    const btn = screen.getByRole('button', { name: /general/i })
    fireEvent.click(btn)
    expect(onSelectChannel).toHaveBeenCalledWith('ch1')
  })

  it('shows voice channels alongside text channels', () => {
    renderPane({ channels: mixedChannels })
    expect(screen.getByText('Lounge')).toBeTruthy()
  })

  it('renders category headers when channels have categories', () => {
    renderPane({ channels: mixedChannels })
    expect(screen.getByText('Text Channels')).toBeTruthy()
    expect(screen.getByText('Voice Channels')).toBeTruthy()
  })

  it('renders unread count badge on channel when provided', () => {
    const withUnread: ChannelListItem[] = [
      { id: 'ch1', name: 'general', kind: 'text', unreadCount: 5 },
    ]
    renderPane({ channels: withUnread })
    expect(screen.getByText('5')).toBeTruthy()
  })

  it('renders create channel button when onCreateChannel is provided', () => {
    renderPane({ onCreateChannel: vi.fn() })
    expect(screen.getByRole('button', { name: /create channel/i })).toBeTruthy()
  })

  it('does not render a copy guild name button in the header', () => {
    renderPane()
    expect(screen.queryByRole('button', { name: /copy guild name/i })).toBeNull()
  })

  it('renders user panel when userPanel is provided', () => {
    renderPane({ userPanel: { displayName: 'Me', username: 'me', status: 'Online' } })
    expect(screen.getByText('Me')).toBeTruthy()
  })

  it('renders mute toggle button when onMuteToggle is provided', () => {
    renderPane({
      onMuteToggle: vi.fn(),
      onDeafenToggle: vi.fn(),
      userPanel: { displayName: 'Me' },
    })
    expect(screen.getByRole('button', { name: /mute|microphone/i })).toBeTruthy()
  })

  it('renders empty channel list without crashing', () => {
    renderPane({ channels: [] })
    expect(screen.getByText('Test Guild')).toBeTruthy()
  })
})
