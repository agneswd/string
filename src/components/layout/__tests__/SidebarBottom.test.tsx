import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SidebarBottom } from '../SidebarBottom'

const baseUser = {
  username: 'alice',
  displayName: 'Alice Smith',
  status: 'Online',
}

const baseVoiceState = {
  isMuted: false,
  isDeafened: false,
  isStreaming: false,
}

const baseProps = {
  user: baseUser,
  isMuted: false,
  isDeafened: false,
  muteColor: '#78716c',
  deafenColor: '#78716c',
  onToggleMute: vi.fn(),
  onToggleDeafen: vi.fn(),
  onOpenSettings: vi.fn(),
  onOpenProfile: vi.fn(),
  onLeave: vi.fn(),
  remoteSharersCount: 0,
  onStartSharing: vi.fn(),
  onStopSharing: vi.fn(),
  currentVoiceState: null,
}

// ── layoutMode forwarding ─────────────────────────────────────────────────

describe('SidebarBottom — layoutMode forwarding to UserPanel', () => {
  it('forwards layoutMode="string" producing rounded-rect avatar in UserPanel', () => {
    const { container } = render(
      <SidebarBottom {...baseProps} layoutMode="string" />,
    )
    const rectAvatar = container.querySelector<HTMLElement>('div[style*="border-radius: var(--radius-sm)"]')
    expect(rectAvatar).toBeTruthy()
  })

  it('forwards layoutMode="classic" producing rounded-circle avatar in UserPanel', () => {
    const { container } = render(
      <SidebarBottom {...baseProps} layoutMode="classic" />,
    )
    // Classic UserPanel: fallback avatar uses borderRadius: '50%'
    const circleAvatar = container.querySelector<HTMLElement>('div[style*="border-radius: 50%"]')
    expect(circleAvatar).toBeTruthy()
  })

  it('defaults to classic when layoutMode is omitted', () => {
    const { container } = render(<SidebarBottom {...baseProps} />)
    const circleAvatar = container.querySelector<HTMLElement>('div[style*="border-radius: 50%"]')
    expect(circleAvatar).toBeTruthy()
  })
})

// ── VoicePanel visibility ─────────────────────────────────────────────────

describe('SidebarBottom — VoicePanel visibility', () => {
  it('renders VoicePanel when showVoicePanel=true and currentVoiceState is non-null', () => {
    render(
      <SidebarBottom
        {...baseProps}
        showVoicePanel={true}
        currentVoiceState={baseVoiceState}
      />,
    )
    // VoicePanel renders a "Disconnect" / leave button — look for its role or text
    expect(screen.getByRole('button', { name: /disconnect|leave/i })).toBeDefined()
  })

  it('does NOT render VoicePanel when currentVoiceState is null', () => {
    render(
      <SidebarBottom
        {...baseProps}
        showVoicePanel={true}
        currentVoiceState={null}
      />,
    )
    expect(screen.queryByRole('button', { name: /disconnect|leave/i })).toBeNull()
  })

  it('does NOT render VoicePanel when showVoicePanel=false even with voice state', () => {
    render(
      <SidebarBottom
        {...baseProps}
        showVoicePanel={false}
        currentVoiceState={baseVoiceState}
      />,
    )
    expect(screen.queryByRole('button', { name: /disconnect|leave/i })).toBeNull()
  })

  it('always renders UserPanel regardless of voice state', () => {
    const { container } = render(
      <SidebarBottom
        {...baseProps}
        showVoicePanel={false}
        currentVoiceState={null}
      />,
    )
    // UserPanel always renders when user is non-null
    expect(screen.getByText('Alice Smith')).toBeDefined()
    // Avatar present
    const avatar = container.querySelector('div[style*="border-radius"]')
    expect(avatar).toBeTruthy()
  })
})
