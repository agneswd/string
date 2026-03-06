import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatViewPane, type ChatMessageItem } from '../ChatViewPane'

const baseMessages: ChatMessageItem[] = [
  { id: '1', authorName: 'Alice', authorId: 'u1', content: 'Hello world', timestamp: '12:00' },
  { id: '2', authorName: 'Bob', authorId: 'u2', content: 'Hi there', timestamp: '12:01' },
]

function renderPane(overrides: Partial<React.ComponentProps<typeof ChatViewPane>> = {}) {
  const props = {
    channelName: 'general',
    messages: baseMessages,
    composerValue: '',
    onComposerChange: vi.fn(),
    onSend: vi.fn(),
    ...overrides,
  }
  return render(<ChatViewPane {...props} />)
}

describe('ChatViewPane', () => {
  it('renders the chat section with aria-label Chat', () => {
    renderPane()
    expect(screen.getByRole('region', { name: /chat/i })).toBeTruthy()
  })

  it('renders the channel name in the header', () => {
    renderPane({ channelName: 'announcements' })
    expect(screen.getByText('announcements')).toBeTruthy()
  })

  it('renders all message contents', () => {
    renderPane()
    expect(screen.getByText('Hello world')).toBeTruthy()
    expect(screen.getByText('Hi there')).toBeTruthy()
  })

  it('renders author names for first messages in a group', () => {
    renderPane()
    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.getByText('Bob')).toBeTruthy()
  })

  it('renders the composer input', () => {
    renderPane()
    const input = screen.getByRole('textbox', { name: /message composer/i })
    expect(input).toBeTruthy()
  })

  it('uses channel name in composer placeholder', () => {
    renderPane({ channelName: 'random' })
    const input = screen.getByPlaceholderText(/Message #random/i)
    expect(input).toBeTruthy()
  })

  it('calls onComposerChange when typing', () => {
    const onComposerChange = vi.fn()
    renderPane({ onComposerChange })
    const input = screen.getByRole('textbox', { name: /message composer/i })
    fireEvent.change(input, { target: { value: 'new text' } })
    expect(onComposerChange).toHaveBeenCalledWith('new text')
  })

  it('calls onSend when form is submitted with a non-empty message', () => {
    const onSend = vi.fn()
    renderPane({ composerValue: 'Hello!', onSend })
    const form = screen.getByRole('region', { name: /chat/i }).querySelector('form')!
    fireEvent.submit(form)
    expect(onSend).toHaveBeenCalledWith('Hello!')
  })

  it('does not call onSend when composer is empty', () => {
    const onSend = vi.fn()
    renderPane({ composerValue: '   ', onSend })
    const form = screen.getByRole('region', { name: /chat/i }).querySelector('form')!
    fireEvent.submit(form)
    expect(onSend).not.toHaveBeenCalled()
  })

  it('renders the message list with aria-live polite', () => {
    renderPane()
    const list = screen.getByRole('list')
    expect(list.getAttribute('aria-live')).toBe('polite')
  })

  it('renders empty message list without errors', () => {
    renderPane({ messages: [] })
    // Should render without throwing
    expect(screen.getByRole('region', { name: /chat/i })).toBeTruthy()
  })

  it('renders DM header with avatar when isDm is true', () => {
    renderPane({ isDm: true, channelName: 'Carol' })
    expect(screen.getByText('Carol')).toBeTruthy()
  })

  it('renders system messages as informational content', () => {
    const sysMessages: ChatMessageItem[] = [
      { id: 'sys1', authorName: 'System', content: 'Alice joined', timestamp: '12:00', isSystem: true },
    ]
    renderPane({ messages: sysMessages })
    expect(screen.getByText('Alice joined')).toBeTruthy()
  })

  it('renders call active banner when callActive is true', () => {
    renderPane({ callActive: true })
    expect(screen.getByText(/voice call in progress/i)).toBeTruthy()
  })

  it('grouped messages share the same author (no duplicate author render after grouping)', () => {
    const grouped: ChatMessageItem[] = [
      { id: 'a', authorName: 'Alice', authorId: 'u1', content: 'First', timestamp: '12:00' },
      { id: 'b', authorName: 'Alice', authorId: 'u1', content: 'Second', timestamp: '12:01' },
    ]
    renderPane({ messages: grouped })
    // Alice should appear once (only the first message shows the author name)
    const names = screen.getAllByText('Alice')
    expect(names.length).toBe(1)
  })
})
