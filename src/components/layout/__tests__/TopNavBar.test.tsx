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
  showMemberList: false,
  onToggleMemberList: vi.fn(),
  onInitiateDmCall: vi.fn(),
}

describe('TopNavBar — classic mode', () => {
  it('shows bold guild name as context', () => {
    render(<TopNavBar {...baseProps} layoutMode="classic" />)
    const strong = document.querySelector('strong')
    expect(strong?.textContent).toBe('Alpha Corp')
  })
})

describe('TopNavBar — workspace mode', () => {
  it('shows guild name as muted context prefix', () => {
    render(<TopNavBar {...baseProps} layoutMode="workspace" channelName="general" />)
    // Alpha Corp should appear as a span (muted prefix) not a <strong>
    expect(screen.getByText('Alpha Corp')).toBeDefined()
    expect(document.querySelector('strong')).toBeNull()
  })

  it('shows channel name in breadcrumb when channelName is provided', () => {
    render(<TopNavBar {...baseProps} layoutMode="workspace" channelName="announcements" />)
    expect(screen.getByText('announcements')).toBeDefined()
  })

  it('shows just the context label when no channelName provided', () => {
    render(<TopNavBar {...baseProps} layoutMode="workspace" />)
    // Name should appear once (as the primary label)
    const labels = screen.getAllByText('Alpha Corp')
    // At least one occurrence
    expect(labels.length).toBeGreaterThan(0)
  })

  it('shows DM name in workspace breadcrumb when isDmMode', () => {
    render(
      <TopNavBar
        {...baseProps}
        isDmMode={true}
        dmName="Bob"
        layoutMode="workspace"
        channelName="Bob"
      />,
    )
    // "Bob" should appear in the breadcrumb context area
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0)
  })

  it('renders member list toggle button', () => {
    render(<TopNavBar {...baseProps} layoutMode="workspace" />)
    expect(screen.getByTitle(/hide member list|show member list/i)).toBeDefined()
  })
})
