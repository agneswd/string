import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatViewPane, type ChatMessageItem } from '../ChatViewPane'

const scrollIntoViewMock = vi.fn()

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: scrollIntoViewMock,
})

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

  it('keeps the composer focused after sending with the send button', () => {
    function FocusHarness() {
      const [value, setValue] = React.useState('Hello!')
      return (
        <ChatViewPane
          channelName="general"
          messages={baseMessages}
          composerValue={value}
          onComposerChange={setValue}
          onSend={() => setValue('')}
        />
      )
    }

    render(<FocusHarness />)
    const input = screen.getByRole('textbox', { name: /message composer/i })
    const sendButton = screen.getByRole('button', { name: /send/i })

    input.focus()
    fireEvent.mouseDown(sendButton)
    fireEvent.click(sendButton)

    expect(document.activeElement).toBe(input)
  })

  it('renders the message list with aria-live polite', () => {
    renderPane()
    const list = screen.getByRole('list')
    expect(list.getAttribute('aria-live')).toBe('polite')
  })

  it('shows a jump-to-latest button when scrolled away from the bottom', () => {
    renderPane()
    const list = screen.getByRole('list')

    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 640 })
    Object.defineProperty(list, 'clientHeight', { configurable: true, value: 240 })
    Object.defineProperty(list, 'scrollTop', { configurable: true, value: 120, writable: true })

    fireEvent.scroll(list)

    const jumpButton = screen.getByRole('button', { name: /jump to latest message/i }) as HTMLButtonElement
    expect(jumpButton).toBeTruthy()
    expect(jumpButton.style.zIndex).toBe('50')
    expect(jumpButton.style.background).toBe('var(--bg-panel)')
    expect(jumpButton.querySelector('svg')).toBeTruthy()
  })

  it('scrolls to the latest message when the jump button is pressed', () => {
    scrollIntoViewMock.mockClear()
    renderPane()
    const list = screen.getByRole('list')

    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 640 })
    Object.defineProperty(list, 'clientHeight', { configurable: true, value: 240 })
    Object.defineProperty(list, 'scrollTop', { configurable: true, value: 80, writable: true })

    fireEvent.scroll(list)
    fireEvent.click(screen.getByRole('button', { name: /jump to latest message/i }))

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('keeps the composer focused when pressing the jump-to-latest button', () => {
    scrollIntoViewMock.mockClear()
    renderPane({ composerValue: 'Hello!' })
    const list = screen.getByRole('list')
    const input = screen.getByRole('textbox', { name: /message composer/i })

    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 640 })
    Object.defineProperty(list, 'clientHeight', { configurable: true, value: 240 })
    Object.defineProperty(list, 'scrollTop', { configurable: true, value: 80, writable: true })

    fireEvent.scroll(list)

    input.focus()
    const jumpButton = screen.getByRole('button', { name: /jump to latest message/i })
    fireEvent.mouseDown(jumpButton)
    fireEvent.click(jumpButton)

    expect(document.activeElement).toBe(input)
  })

  it('shows an unread banner instead of auto-scrolling when new incoming messages arrive away from the bottom', () => {
    scrollIntoViewMock.mockClear()
    const { rerender } = render(
      <ChatViewPane
        channelName="general"
        messages={baseMessages}
        composerValue=""
        onComposerChange={vi.fn()}
        onSend={vi.fn()}
        currentUserId="u1"
      />,
    )

    const list = screen.getByRole('list')
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 640 })
    Object.defineProperty(list, 'clientHeight', { configurable: true, value: 240 })
    Object.defineProperty(list, 'scrollTop', { configurable: true, value: 80, writable: true })

    fireEvent.scroll(list)
    scrollIntoViewMock.mockClear()

    rerender(
      <ChatViewPane
        channelName="general"
        messages={[
          ...baseMessages,
          { id: '3', authorName: 'Bob', authorId: 'u2', content: 'Newest message', timestamp: '12:02' },
        ]}
        composerValue=""
        onComposerChange={vi.fn()}
        onSend={vi.fn()}
        currentUserId="u1"
      />,
    )

    expect(scrollIntoViewMock).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /1 unread message/i })).toBeTruthy()
  })

  it('clears the unread banner after scrolling back to the bottom', () => {
    const { rerender } = render(
      <ChatViewPane
        channelName="general"
        messages={baseMessages}
        composerValue=""
        onComposerChange={vi.fn()}
        onSend={vi.fn()}
        currentUserId="u1"
      />,
    )

    const list = screen.getByRole('list')
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 640 })
    Object.defineProperty(list, 'clientHeight', { configurable: true, value: 240 })
    Object.defineProperty(list, 'scrollTop', { configurable: true, value: 80, writable: true })

    fireEvent.scroll(list)

    rerender(
      <ChatViewPane
        channelName="general"
        messages={[
          ...baseMessages,
          { id: '3', authorName: 'Bob', authorId: 'u2', content: 'Newest message', timestamp: '12:02' },
        ]}
        composerValue=""
        onComposerChange={vi.fn()}
        onSend={vi.fn()}
        currentUserId="u1"
      />,
    )

    expect(screen.getByRole('button', { name: /1 unread message/i })).toBeTruthy()

    Object.defineProperty(list, 'scrollTop', { configurable: true, value: 400, writable: true })
    fireEvent.scroll(list)

    expect(screen.queryByRole('button', { name: /1 unread message/i })).toBeNull()
  })

  it('clears local unread state when opening a different chat', () => {
    const { rerender } = render(
      <ChatViewPane
        channelName="general"
        messages={baseMessages}
        composerValue=""
        onComposerChange={vi.fn()}
        onSend={vi.fn()}
        currentUserId="u1"
      />,
    )

    rerender(
      <ChatViewPane
        channelName="other-chat"
        conversationKey="dm:other-chat"
        isDm={true}
        messages={baseMessages}
        composerValue=""
        onComposerChange={vi.fn()}
        onSend={vi.fn()}
        currentUserId="u1"
      />,
    )

    expect(screen.queryByRole('button', { name: /unread message/i })).toBeNull()
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

  it('renders a typing indicator above the composer', () => {
    renderPane({
      typingUsers: [{ id: 'u2', label: 'nayskok' }],
    })

    expect(screen.getByLabelText(/typing indicator/i)).toBeTruthy()
    expect(screen.getByText(/nayskok is typing/i)).toBeTruthy()
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

  it('merges quick reactions and edit/delete into one hover toolbar', () => {
    renderPane({
      currentUserId: 'u1',
      onEditMessage: vi.fn(),
      onDeleteMessage: vi.fn(),
      onToggleReaction: vi.fn(),
      getReactionsForMessage: () => [],
    })

    const row = screen.getByText('Hello world').closest('li')
    expect(row).toBeTruthy()
    fireEvent.mouseEnter(row!)

    const moreBtn = screen.getByLabelText(/more reactions/i)
    const editBtn = screen.getByLabelText(/edit message/i)
    const deleteBtn = screen.getByLabelText(/delete message/i)

    expect(moreBtn).toBeTruthy()
    expect(editBtn).toBeTruthy()
    expect(deleteBtn).toBeTruthy()
    expect(editBtn.parentElement?.parentElement).toBe(moreBtn.parentElement?.parentElement)
    expect(deleteBtn.parentElement?.parentElement).toBe(moreBtn.parentElement?.parentElement)
  })

  it('keeps the emoji picker open until clicking outside', () => {
    renderPane({
      currentUserId: 'u1',
      onEditMessage: vi.fn(),
      onDeleteMessage: vi.fn(),
      onToggleReaction: vi.fn(),
      getReactionsForMessage: () => [],
    })

    const row = screen.getByText('Hello world').closest('li')
    expect(row).toBeTruthy()
    fireEvent.mouseEnter(row!)
    fireEvent.click(screen.getByLabelText(/more reactions/i))

    expect(screen.getByPlaceholderText(/search emoji/i)).toBeTruthy()

    fireEvent.mouseLeave(row!)
    expect(screen.getByPlaceholderText(/search emoji/i)).toBeTruthy()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByPlaceholderText(/search emoji/i)).toBeNull()
  })

  it('searches emoji picker entries by emoji names', () => {
    renderPane({
      currentUserId: 'u1',
      onEditMessage: vi.fn(),
      onDeleteMessage: vi.fn(),
      onToggleReaction: vi.fn(),
      getReactionsForMessage: () => [],
    })

    const row = screen.getByText('Hello world').closest('li')
    expect(row).toBeTruthy()
    fireEvent.mouseEnter(row!)
    fireEvent.click(screen.getByLabelText(/more reactions/i))

    const search = screen.getByPlaceholderText(/search emoji/i)
    fireEvent.change(search, { target: { value: 'heart' } })

    expect(screen.getAllByRole('button', { name: /heart/i }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /pizza/i })).toBeNull()
  })
})
