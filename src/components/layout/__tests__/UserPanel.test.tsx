import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { UserPanel } from '../UserPanel'

const baseUser = {
  username: 'alice',
  displayName: 'Alice Smith',
  status: 'Online',
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
}

// ── null guard ─────────────────────────────────────────────────────────────

describe('UserPanel — null guard', () => {
  it('renders nothing when user is null', () => {
    const { container } = render(<UserPanel {...baseProps} user={null} />)
    expect(container.firstChild).toBeNull()
  })
})

// ── string mode ───────────────────────────────────────────────────────────

describe('UserPanel — string mode', () => {
  it('renders the display name', () => {
    render(<UserPanel {...baseProps} layoutMode="string" />)
    expect(screen.getByText('Alice Smith')).toBeDefined()
  })

  it('renders avatar fallback with rounded-rect using string radius token', () => {
    const { container } = render(<UserPanel {...baseProps} layoutMode="string" />)
    // No avatarUrl → fallback div with initials
    const avatarDiv = container.querySelector<HTMLElement>('div[style*="border-radius: var(--radius-sm)"]')
    expect(avatarDiv).toBeTruthy()
  })

  it('renders avatar <img> with rounded-rect when avatarUrl is provided', () => {
    const { container } = render(
      <UserPanel
        {...baseProps}
        user={{ ...baseUser, avatarUrl: 'https://example.com/avatar.png' }}
        layoutMode="string"
      />,
    )
    const img = container.querySelector<HTMLImageElement>('img')
    expect(img).toBeTruthy()
    expect(img!.style.borderRadius).toBe('var(--radius-sm)')
  })

  it('positions the status dot tightly in the avatar corner', () => {
    const { container } = render(<UserPanel {...baseProps} layoutMode="string" />)
    const dots = Array.from(container.querySelectorAll<HTMLElement>('div')).filter((el) => el.style.backgroundColor === 'var(--status-online)')
    const dot = dots[0]
    expect(dot).toBeTruthy()
    expect(dot!.style.right).toBe('-3px')
    expect(dot!.style.bottom).toBe('-3px')
  })

  it('uses profileColor for fallback avatar background when provided', () => {
    const { container } = render(
      <UserPanel
        {...baseProps}
        user={{ ...baseUser, profileColor: '#123456' }}
        layoutMode="string"
      />,
    )
    const avatarDiv = container.querySelector<HTMLElement>('div[style*="background-color: rgb(18, 52, 86)"]')
    expect(avatarDiv).toBeTruthy()
  })

  it('profile row is clickable and calls onOpenProfile', async () => {
    const onOpenProfile = vi.fn()
    render(<UserPanel {...baseProps} onOpenProfile={onOpenProfile} layoutMode="string" />)
    // The profile row is a div with the onClick; click the displayName to reach it
    await userEvent.click(screen.getByTitle('@alice'))
    expect(onOpenProfile).toHaveBeenCalledTimes(1)
  })

  it('settings button has accessible aria-label', () => {
    render(<UserPanel {...baseProps} layoutMode="string" />)
    expect(screen.getByRole('button', { name: /open settings/i })).toBeDefined()
  })

  it('mute button shows MicOff icon when isMuted', () => {
    render(<UserPanel {...baseProps} isMuted={true} layoutMode="string" />)
    expect(screen.getByTitle(/unmute/i)).toBeDefined()
  })

  it('mute button shows Mic icon when not muted', () => {
    render(<UserPanel {...baseProps} isMuted={false} layoutMode="string" />)
    expect(screen.getByTitle(/^mute$/i)).toBeDefined()
  })

  it('deafen button shows HeadphoneOff icon when isDeafened', () => {
    render(<UserPanel {...baseProps} isDeafened={true} layoutMode="string" />)
    expect(screen.getByTitle(/undeafen/i)).toBeDefined()
  })

  it('deafen button shows Headphones icon when not deafened', () => {
    render(<UserPanel {...baseProps} isDeafened={false} layoutMode="string" />)
    expect(screen.getByTitle(/^deafen$/i)).toBeDefined()
  })

  it('muted mute button uses danger background token', () => {
    render(
      <UserPanel {...baseProps} isMuted={true} layoutMode="string" />,
    )
    const muteBtn = screen.getByTitle(/unmute/i) as HTMLElement
    // Should reference the CSS variable, not a bare hex color
    expect(muteBtn.style.backgroundColor).toContain('var(--bg-danger-hover)')
  })

  it('deafened deafen button uses danger background token', () => {
    render(<UserPanel {...baseProps} isDeafened={true} layoutMode="string" />)
    const deafenBtn = screen.getByTitle(/undeafen/i) as HTMLElement
    expect(deafenBtn.style.backgroundColor).toContain('var(--bg-danger-hover)')
  })

  it('toggleMute is called when mute button is clicked', async () => {
    const onToggleMute = vi.fn()
    render(<UserPanel {...baseProps} onToggleMute={onToggleMute} layoutMode="string" />)
    await userEvent.click(screen.getByTitle(/^mute$/i))
    expect(onToggleMute).toHaveBeenCalledTimes(1)
  })

  it('toggleDeafen is called when deafen button is clicked', async () => {
    const onToggleDeafen = vi.fn()
    render(<UserPanel {...baseProps} onToggleDeafen={onToggleDeafen} layoutMode="string" />)
    await userEvent.click(screen.getByTitle(/^deafen$/i))
    expect(onToggleDeafen).toHaveBeenCalledTimes(1)
  })
})

// ── classic mode ──────────────────────────────────────────────────────────

describe('UserPanel — classic mode', () => {
  it('renders the display name', () => {
    render(<UserPanel {...baseProps} layoutMode="classic" />)
    expect(screen.getByText('Alice Smith')).toBeDefined()
  })

  it('avatar fallback uses rounded-circle (borderRadius 50%)', () => {
    const { container } = render(<UserPanel {...baseProps} layoutMode="classic" />)
    // The classic avatar fallback div has borderRadius: '50%'
    const avatarDiv = container.querySelector<HTMLElement>('div[style*="border-radius: 50%"]')
    expect(avatarDiv).toBeTruthy()
  })

  it('avatar <img> uses rounded circle when avatarUrl provided', () => {
    const { container } = render(
      <UserPanel
        {...baseProps}
        user={{ ...baseUser, avatarUrl: 'https://example.com/a.png' }}
        layoutMode="classic"
      />,
    )
    const img = container.querySelector<HTMLImageElement>('img')
    expect(img).toBeTruthy()
    expect(img!.style.borderRadius).toBe('50%')
  })

  it('settings button has accessible aria-label', () => {
    render(<UserPanel {...baseProps} layoutMode="classic" />)
    expect(screen.getByRole('button', { name: /open settings/i })).toBeDefined()
  })

  it('toggleMute is called when mute button is clicked', async () => {
    const onToggleMute = vi.fn()
    render(<UserPanel {...baseProps} onToggleMute={onToggleMute} layoutMode="classic" />)
    await userEvent.click(screen.getByTitle(/^mute$/i))
    expect(onToggleMute).toHaveBeenCalledTimes(1)
  })

  it('defaults to classic mode when layoutMode is omitted', () => {
    const { container } = render(<UserPanel {...baseProps} />)
    // Classic uses 50% border-radius; presence of that style confirms classic branch
    const circleAvatar = container.querySelector<HTMLElement>('div[style*="border-radius: 50%"]')
    expect(circleAvatar).toBeTruthy()
  })
})
