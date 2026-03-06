import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsModal } from '../SettingsModal'

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
  uiSoundLevel: 50,
  onUiSoundLevelChange: vi.fn(),
  friendStatusNotificationsEnabled: true,
  onFriendStatusNotificationsChange: vi.fn(),
  dmMessageNotificationsEnabled: false,
  onDmMessageNotificationsChange: vi.fn(),
  layoutMode: 'workspace' as const,
  onLayoutModeChange: vi.fn(),
}

describe('SettingsModal', () => {
  it('renders layout mode section', () => {
    render(<SettingsModal {...baseProps} />)
    // The label text should be present (case-insensitive)
    expect(screen.getByText(/layout/i)).toBeTruthy()
  })

  it('shows workspace option as selected when layoutMode is workspace', () => {
    render(<SettingsModal {...baseProps} layoutMode="workspace" />)
    const workspaceBtn = screen.getByRole('radio', { name: /workspace/i })
    expect(workspaceBtn.getAttribute('aria-checked')).toBe('true')
  })

  it('shows classic option as selected when layoutMode is classic', () => {
    render(<SettingsModal {...baseProps} layoutMode="classic" />)
    const classicBtn = screen.getByRole('radio', { name: /classic/i })
    expect(classicBtn.getAttribute('aria-checked')).toBe('true')
  })

  it('calls onLayoutModeChange with workspace when workspace is clicked', () => {
    const onLayoutModeChange = vi.fn()
    render(<SettingsModal {...baseProps} layoutMode="classic" onLayoutModeChange={onLayoutModeChange} />)
    fireEvent.click(screen.getByRole('radio', { name: /workspace/i }))
    expect(onLayoutModeChange).toHaveBeenCalledWith('workspace')
  })

  it('calls onLayoutModeChange with classic when classic is clicked', () => {
    const onLayoutModeChange = vi.fn()
    render(<SettingsModal {...baseProps} layoutMode="workspace" onLayoutModeChange={onLayoutModeChange} />)
    fireEvent.click(screen.getByRole('radio', { name: /classic/i }))
    expect(onLayoutModeChange).toHaveBeenCalledWith('classic')
  })

  it('slider uses --accent-primary token with no Discord fallback', () => {
    render(<SettingsModal {...baseProps} />)
    const slider = screen.getByRole('slider', { name: /ui sound level/i }) as HTMLInputElement
    // accentColor must use the theme token, not Discord blue
    expect(slider.style.accentColor).toBe('var(--accent-primary)')
    expect(slider.style.accentColor).not.toContain('#5865f2')
  })

  it('checkboxes use --accent-primary token with no Discord fallback', () => {
    render(<SettingsModal {...baseProps} />)
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    expect(checkboxes.length).toBeGreaterThan(0)
    for (const cb of checkboxes) {
      expect(cb.style.accentColor).toBe('var(--accent-primary)')
      expect(cb.style.accentColor).not.toContain('#5865f2')
    }
  })
})
