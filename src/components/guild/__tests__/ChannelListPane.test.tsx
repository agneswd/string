import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
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

const structuredChannels: ChannelListItem[] = [
  { id: 'cat1', name: 'Text Channels', kind: 'category', position: 0 },
  { id: 'ch1', name: 'general', kind: 'text', parentCategoryId: 'cat1', position: 0 },
  { id: 'ch2', name: 'announcements', kind: 'text', parentCategoryId: 'cat1', position: 1 },
]

const mixedStructuredChannels: ChannelListItem[] = [
  { id: 'cat1', name: 'Text Channels', kind: 'category', position: 0 },
  { id: 'ch1', name: 'general', kind: 'text', position: 1 },
  { id: 'ch2', name: 'announcements', kind: 'text', position: 2 },
  { id: 'vc1', name: 'Lounge', kind: 'voice', position: 3 },
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

function applyLayout(channels: ChannelListItem[], layout: Array<{ channelId: string | number; categoryId?: string | number | null; position: number }>) {
  const layoutById = new Map(layout.map((item) => [String(item.channelId), item]))
  return channels.map((channel) => {
    const next = layoutById.get(String(channel.id))
    return next
      ? {
          ...channel,
          parentCategoryId: next.categoryId == null ? null : String(next.categoryId),
          position: next.position,
        }
      : channel
  })
}

function StatefulPane() {
  const [channels, setChannels] = useState(mixedStructuredChannels)

  return (
    <ChannelListPane
      guildName="Test Guild"
      channels={channels}
      onSaveLayout={(layout) => setChannels((prev) => applyLayout(prev, layout))}
    />
  )
}

function createDataTransfer() {
  const data = new Map<string, string>()
  return {
    effectAllowed: 'move',
    setData: vi.fn((type: string, value: string) => {
      data.set(type, value)
    }),
    getData: vi.fn((type: string) => data.get(type) ?? ''),
  }
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

  it('centers string-layout channel hover and selection rows within the container', () => {
    renderPane({ layoutMode: 'string', selectedChannelId: 'ch1' })
    const btn = screen.getByRole('button', { name: /general/i }) as HTMLButtonElement

    expect(btn.style.width).toBe('calc(100% - 8px)')
    expect(btn.style.marginLeft).toBe('auto')
    expect(btn.style.marginRight).toBe('auto')
  })

  it('does not trigger channel selection after dragging a voice channel', () => {
    const onSelectChannel = vi.fn()
    renderPane({ channels: mixedChannels, onSelectChannel })
    const voiceButton = screen.getByRole('button', { name: /lounge/i })
    const voiceRow = voiceButton.closest('li')
    expect(voiceRow).toBeTruthy()

    fireEvent.dragStart(voiceRow!, {
      dataTransfer: {
        setData: vi.fn(),
        effectAllowed: 'move',
      },
    })
    fireEvent.dragEnd(voiceRow!)
    fireEvent.click(voiceButton)

    expect(onSelectChannel).not.toHaveBeenCalled()
  })

  it('still allows moving more channels after moving a voice channel into a category', () => {
    render(<StatefulPane />)

    const dataTransfer = createDataTransfer()
    const voiceRow = screen.getByRole('button', { name: /lounge/i }).closest('li')
    const categoryList = screen.getByRole('button', { name: /^text channels category$/i }).closest('li')?.querySelector('ul')
    expect(voiceRow).toBeTruthy()
    expect(categoryList).toBeTruthy()

    fireEvent.dragStart(voiceRow!, { dataTransfer })
    fireEvent.dragOver(categoryList!, { dataTransfer })
    fireEvent.drop(categoryList!, { dataTransfer })
    fireEvent.dragEnd(voiceRow!, { dataTransfer })

    const generalRow = screen.getByRole('button', { name: /general/i }).closest('li')
    expect(generalRow).toBeTruthy()

    fireEvent.dragStart(generalRow!, { dataTransfer })
    fireEvent.dragOver(categoryList!, { dataTransfer })
    fireEvent.drop(categoryList!, { dataTransfer })
    fireEvent.dragEnd(generalRow!, { dataTransfer })

    expect(screen.getByRole('button', { name: /general/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /lounge/i })).toBeTruthy()
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

  it('hides child channels when a structured category is collapsed', () => {
    renderPane({ channels: structuredChannels })
    fireEvent.click(screen.getByRole('button', { name: /^text channels category$/i }))
    expect(screen.queryByText('general')).toBeNull()
    expect(screen.queryByText('announcements')).toBeNull()
  })

  it('moves a channel into a collapsed category when dropped on the category header', () => {
    render(<StatefulPane />)

    const dataTransfer = createDataTransfer()
    const categoryButton = screen.getByRole('button', { name: /^text channels category$/i })
    fireEvent.click(categoryButton)

    const generalRow = screen.getByRole('button', { name: /general/i }).closest('li')
    expect(generalRow).toBeTruthy()

    fireEvent.dragStart(generalRow!, { dataTransfer })
    fireEvent.dragOver(categoryButton, { dataTransfer })
    fireEvent.drop(categoryButton, { dataTransfer })
    fireEvent.dragEnd(generalRow!, { dataTransfer })

    expect(screen.queryByText('general')).toBeNull()
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

  it('renders a single header add button when both create actions are available', () => {
    renderPane({ onCreateChannel: vi.fn(), onCreateCategory: vi.fn() })
    expect(screen.getAllByRole('button', { name: /create (channel|category)/i })).toHaveLength(1)
    expect(screen.getByRole('button', { name: /create channel/i })).toBeTruthy()
  })

  it('shows delete channel in the channel context menu', () => {
    const onDeleteChannel = vi.fn()
    renderPane({ onDeleteChannel })

    fireEvent.contextMenu(screen.getByRole('button', { name: /general/i }).closest('li')!)
    fireEvent.click(screen.getByRole('button', { name: /delete channel/i }))

    expect(onDeleteChannel).toHaveBeenCalledWith('ch1')
  })

  it('shows delete category in the category context menu', () => {
    const onDeleteChannel = vi.fn()
    renderPane({ channels: structuredChannels, onDeleteChannel })

    fireEvent.contextMenu(screen.getByRole('button', { name: /^text channels category$/i }))
    fireEvent.click(screen.getByRole('button', { name: /delete category/i }))

    expect(onDeleteChannel).toHaveBeenCalledWith('cat1')
  })

  it('shows create actions when right-clicking empty channel list space', () => {
    const view = renderPane({ onCreateChannel: vi.fn(), onCreateCategory: vi.fn() })
    const scrollArea = view.container.querySelector('nav[aria-label="Channels"] > div')
    expect(scrollArea).toBeTruthy()

    fireEvent.contextMenu(scrollArea!)

    expect(screen.getByText('Create Channel')).toBeTruthy()
    expect(screen.getByText('Create Category')).toBeTruthy()
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
