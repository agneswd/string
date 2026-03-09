import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TopNavBar } from '../TopNavBar'

const baseProps = {
  isDmMode: false,
  guildName: 'Alpha Corp',
  selectedDmChannel: false,
  currentVoiceState: false,
  outgoingCall: false,
  dmCallActive: false,
  onCancelOutgoingCall: vi.fn(),
  showMemberList: false,
  onToggleMemberList: vi.fn(),
  onInitiateDmCall: vi.fn(),
}

describe('TopNavBar — classic mode', () => {
  it('shows the current context inside the classic badge', () => {
    render(<TopNavBar {...baseProps} layoutMode="classic" />)
    expect(screen.getByText('Alpha Corp')).toBeDefined()
    expect(document.querySelector('strong')).toBeNull()
  })
})

describe('TopNavBar — string mode', () => {
  it('shows guild name inside the badge', () => {
    render(<TopNavBar {...baseProps} layoutMode="string" channelName="general" />)
    expect(screen.getByText('Alpha Corp')).toBeDefined()
    expect(document.querySelector('strong')).toBeNull()
  })

  it('shows channel name in breadcrumb when channelName is provided', () => {
    render(<TopNavBar {...baseProps} layoutMode="string" channelName="announcements" />)
    expect(screen.getByText('announcements')).toBeDefined()
  })

  it('shows just the context label when no channelName provided', () => {
    render(<TopNavBar {...baseProps} layoutMode="string" />)
    const labels = screen.getAllByText('Alpha Corp')
    expect(labels).toHaveLength(1)
    expect(screen.queryByText('/')).toBeNull()
  })

  it('shows home inside the badge without duplicate text', () => {
    render(<TopNavBar {...baseProps} layoutMode="string" isHomeView={true} />)
    expect(screen.getByText('home')).toBeDefined()
    expect(screen.getAllByText('home')).toHaveLength(1)
  })

  it('shows DM name in string breadcrumb when isDmMode', () => {
    render(
      <TopNavBar
        {...baseProps}
        isDmMode={true}
        dmName="Bob"
        layoutMode="string"
        channelName="Bob"
      />,
    )
    expect(screen.getAllByText('Bob')).toHaveLength(1)
    expect(screen.queryByText('/')).toBeNull()
  })

  it('shows only channel breadcrumb text when context is already in the badge', () => {
    render(<TopNavBar {...baseProps} layoutMode="string" channelName="announcements" />)
    expect(screen.getByText('announcements')).toBeDefined()
    expect(screen.getAllByText('Alpha Corp')).toHaveLength(1)
  })

  it('renders member list toggle button', () => {
    render(<TopNavBar {...baseProps} layoutMode="string" />)
    expect(screen.getByTitle(/hide member list|show member list/i)).toBeDefined()
  })
})
