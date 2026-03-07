import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ServerListPane } from '../ServerListPane'

const baseGuilds = [
  { id: '1', name: 'Alpha Corp' },
  { id: '2', name: 'Beta Labs' },
]

const baseProps = {
  guilds: baseGuilds,
  selectedGuildId: '1',
  onSelectGuild: vi.fn(),
  onHomeClick: vi.fn(),
  onAddServer: vi.fn(),
  onLeaveGuild: vi.fn(),
  onDeleteGuild: vi.fn(),
  onInviteToGuild: vi.fn(),
  ownedGuildIds: new Set<string | number>(),
  onReorder: vi.fn(),
}

describe('ServerListPane — classic mode', () => {
  it('renders as a nav with aria-label "Looms"', () => {
    render(<ServerListPane {...baseProps} layoutMode="classic" />)
    expect(screen.getByRole('navigation', { name: /looms/i })).toBeDefined()
  })

  it('renders each guild as a button with aria-label and aria-pressed', () => {
    render(<ServerListPane {...baseProps} layoutMode="classic" />)
    const alphaBtn = screen.getByRole('button', { name: 'Alpha Corp' })
    expect(alphaBtn).toBeDefined()
    expect(alphaBtn.getAttribute('aria-pressed')).toBe('true')
    const betaBtn = screen.getByRole('button', { name: 'Beta Labs' })
    expect(betaBtn.getAttribute('aria-pressed')).toBe('false')
  })
})

describe('ServerListPane — string mode', () => {
  it('renders as a nav with aria-label "Looms"', () => {
    render(<ServerListPane {...baseProps} layoutMode="string" />)
    expect(screen.getByRole('navigation', { name: /looms/i })).toBeDefined()
  })

  it('renders each guild as a button with visible text label', () => {
    render(<ServerListPane {...baseProps} layoutMode="string" />)
    // Guild names should be visible as text (not just tooltips)
    expect(screen.getByText('Alpha Corp')).toBeDefined()
    expect(screen.getByText('Beta Labs')).toBeDefined()
  })

  it('renders "Direct Messages" home row button', () => {
    render(<ServerListPane {...baseProps} layoutMode="string" />)
    expect(screen.getByRole('button', { name: /direct messages/i })).toBeDefined()
  })

  it('renders "Add Loom" button', () => {
    render(<ServerListPane {...baseProps} layoutMode="string" />)
    expect(screen.getByRole('button', { name: /add loom/i })).toBeDefined()
  })

  it('selected guild button has aria-pressed="true"', () => {
    render(<ServerListPane {...baseProps} layoutMode="string" />)
    const alphaBtn = screen.getByRole('button', { name: 'Alpha Corp' })
    expect(alphaBtn.getAttribute('aria-pressed')).toBe('true')
  })

  it('non-selected guild button has aria-pressed="false"', () => {
    render(<ServerListPane {...baseProps} layoutMode="string" />)
    const betaBtn = screen.getByRole('button', { name: 'Beta Labs' })
    expect(betaBtn.getAttribute('aria-pressed')).toBe('false')
  })

  it('shows "LOOMS" section label', () => {
    render(<ServerListPane {...baseProps} layoutMode="string" />)
    const label = screen.getByText(/looms/i)
    expect(label).toBeDefined()
  })

  it('home row is selected when isHomeSelected=true', () => {
    render(<ServerListPane {...baseProps} isHomeSelected={true} layoutMode="string" />)
    const homeBtn = screen.getByRole('button', { name: /direct messages/i })
    expect(homeBtn.getAttribute('aria-pressed')).toBe('true')
  })

  it('renders DM quick-entry buttons between home and guilds', () => {
    render(
      <ServerListPane
        {...baseProps}
        layoutMode="string"
        dmQuickEntries={[
          { channelId: 'dm-1', label: 'Alice', unreadCount: 2 },
        ]}
      />,
    )

    expect(screen.getByRole('button', { name: 'Alice' })).toBeDefined()
    expect(screen.getByText('2')).toBeDefined()
  })

  it('selects a DM quick entry when pressed', () => {
    const onSelectDmChannel = vi.fn()
    render(
      <ServerListPane
        {...baseProps}
        layoutMode="classic"
        onSelectDmChannel={onSelectDmChannel}
        dmQuickEntries={[
          { channelId: 'dm-2', label: 'Bob' },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Bob' }))
    expect(onSelectDmChannel).toHaveBeenCalledWith('dm-2')
  })
})
