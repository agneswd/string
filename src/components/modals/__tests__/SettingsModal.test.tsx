import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsModal } from '../SettingsModal'

vi.mock('@clerk/react', () => ({
  useUser: () => ({
    user: {
      fullName: 'String User',
      username: 'string-user',
      primaryEmailAddress: { emailAddress: 'string@example.com' },
    },
  }),
  useClerk: () => ({
    signOut: vi.fn(),
  }),
}))

// jsdom doesn't implement showModal/close on <dialog>
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  })
})

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  initialSection: 'general' as const,
  uiSoundLevel: 50,
  onUiSoundLevelChange: vi.fn(),
  callSoundLevel: 40,
  onCallSoundLevelChange: vi.fn(),
  dmAlertSoundLevel: 60,
  onDmAlertSoundLevelChange: vi.fn(),
  friendAlertSoundLevel: 70,
  onFriendAlertSoundLevelChange: vi.fn(),
  voiceDefaultVolume: 100,
  onVoiceDefaultVolumeChange: vi.fn(),
  friendStatusNotificationsEnabled: true,
  onFriendStatusNotificationsChange: vi.fn(),
  dmMessageNotificationsEnabled: false,
  onDmMessageNotificationsChange: vi.fn(),
  layoutMode: 'string' as const,
  onLayoutModeChange: vi.fn(),
}

describe('SettingsModal', () => {
  it('renders category navigation', () => {
    render(<SettingsModal {...baseProps} />)
    expect(screen.getByRole('button', { name: /general/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /sound/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /account/i })).toBeTruthy()
  })

  it('renders the dedicated sound section with multiple sliders', () => {
    render(<SettingsModal {...baseProps} initialSection="sound" />)
    expect(screen.getByText(/tune interface sounds/i)).toBeTruthy()
    expect(screen.getByRole('slider', { name: /ui sound level/i })).toBeTruthy()
    expect(screen.getByRole('slider', { name: /call sound level/i })).toBeTruthy()
    expect(screen.getByRole('slider', { name: /dm alert sound level/i })).toBeTruthy()
    expect(screen.getByRole('slider', { name: /friend alert sound level/i })).toBeTruthy()
    expect(screen.getByRole('slider', { name: /default voice volume/i })).toBeTruthy()
  })

  it('renders layout mode section', () => {
    render(<SettingsModal {...baseProps} />)
    expect(screen.getByRole('radiogroup', { name: /layout mode/i })).toBeTruthy()
  })

  it('can switch to the account category', () => {
    render(<SettingsModal {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /account/i }))
    expect(screen.getByText(/your current identity/i)).toBeTruthy()
    expect(screen.getByText(/string@example.com/i)).toBeTruthy()
  })

  it('shows string option as selected when layoutMode is string', () => {
    render(<SettingsModal {...baseProps} layoutMode="string" />)
    const stringBtn = screen.getByRole('radio', { name: /string/i })
    expect(stringBtn.getAttribute('aria-checked')).toBe('true')
  })

  it('shows classic option as selected when layoutMode is classic', () => {
    render(<SettingsModal {...baseProps} layoutMode="classic" />)
    const classicBtn = screen.getByRole('radio', { name: /classic/i })
    expect(classicBtn.getAttribute('aria-checked')).toBe('true')
  })

  it('calls onLayoutModeChange with string when string is clicked', () => {
    const onLayoutModeChange = vi.fn()
    render(<SettingsModal {...baseProps} layoutMode="classic" onLayoutModeChange={onLayoutModeChange} />)
    fireEvent.click(screen.getByRole('radio', { name: /string/i }))
    expect(onLayoutModeChange).toHaveBeenCalledWith('string')
  })

  it('calls onLayoutModeChange with classic when classic is clicked', () => {
    const onLayoutModeChange = vi.fn()
    render(<SettingsModal {...baseProps} layoutMode="string" onLayoutModeChange={onLayoutModeChange} />)
    fireEvent.click(screen.getByRole('radio', { name: /classic/i }))
    expect(onLayoutModeChange).toHaveBeenCalledWith('classic')
  })

  it('renders layout buttons with string first and classic second', () => {
    render(<SettingsModal {...baseProps} />)
    const radios = screen.getAllByRole('radio')
    expect(radios[0].getAttribute('aria-label')).toBe('String')
    expect(radios[1].getAttribute('aria-label')).toBe('Classic')
  })

  it('slider uses --accent-primary token with no Discord fallback', () => {
    render(<SettingsModal {...baseProps} initialSection="sound" />)
    const slider = screen.getByRole('slider', { name: /ui sound level/i }) as HTMLInputElement
    // accentColor must use the theme token, not Discord blue
    expect(slider.style.accentColor).toBe('var(--accent-primary)')
    expect(slider.style.accentColor).not.toContain('#5865f2')
  })

  it('notification controls render as switches', () => {
    render(<SettingsModal {...baseProps} />)
    const switches = screen.getAllByRole('switch')
    expect(switches).toHaveLength(2)
    expect(switches[0].getAttribute('aria-checked')).toBe('true')
    expect(switches[1].getAttribute('aria-checked')).toBe('false')
  })

  it('toggles notification switches when pressed', () => {
    const onFriendStatusNotificationsChange = vi.fn()
    const onDmMessageNotificationsChange = vi.fn()
    render(
      <SettingsModal
        {...baseProps}
        onFriendStatusNotificationsChange={onFriendStatusNotificationsChange}
        onDmMessageNotificationsChange={onDmMessageNotificationsChange}
      />,
    )

    fireEvent.click(screen.getByRole('switch', { name: /friend online\/offline notifications/i }))
    fireEvent.click(screen.getByRole('switch', { name: /dm message notifications/i }))

    expect(onFriendStatusNotificationsChange).toHaveBeenCalledWith(false)
    expect(onDmMessageNotificationsChange).toHaveBeenCalledWith(true)
  })
})
