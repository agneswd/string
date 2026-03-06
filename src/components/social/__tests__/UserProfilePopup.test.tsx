import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UserProfilePopup } from '../UserProfilePopup'
import type { ProfilePopupUser } from '../UserProfilePopup'

const baseUser: ProfilePopupUser = {
  displayName: 'Alice',
  username: 'alice#1234',
}

function renderPopup(user: ProfilePopupUser = baseUser, onClose = vi.fn()) {
  return render(<UserProfilePopup user={user} onClose={onClose} />)
}

describe('UserProfilePopup', () => {
  it('renders the display name', () => {
    renderPopup()
    expect(screen.getByText('Alice')).toBeTruthy()
  })

  it('renders the username', () => {
    renderPopup()
    expect(screen.getByText('alice#1234')).toBeTruthy()
  })

  it('renders the bio when provided', () => {
    renderPopup({ ...baseUser, bio: 'Hello world' })
    expect(screen.getByText('Hello world')).toBeTruthy()
  })

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    renderPopup(baseUser, onClose)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('renders Online status label', () => {
    renderPopup({ ...baseUser, status: 'Online' })
    expect(screen.getByText('Online')).toBeTruthy()
  })

  it('renders Do Not Disturb status label', () => {
    renderPopup({ ...baseUser, status: 'DoNotDisturb' })
    expect(screen.getByText('Do Not Disturb')).toBeTruthy()
  })

  it('renders Away status label', () => {
    renderPopup({ ...baseUser, status: 'Away' })
    expect(screen.getByText('Away')).toBeTruthy()
  })

  it('renders Offline status label', () => {
    renderPopup({ ...baseUser, status: 'Offline' })
    expect(screen.getByText('Offline')).toBeTruthy()
  })

  it('uses CSS variable for Online status dot (no hardcoded hex)', () => {
    const { container } = renderPopup({ ...baseUser, status: 'Online' })
    const html = container.innerHTML
    // Must reference the token, not hardcoded Discord/old green
    expect(html).toContain('var(--status-online)')
    expect(html).not.toContain('#43b581')
  })

  it('uses CSS variable for DoNotDisturb status dot (no hardcoded hex)', () => {
    const { container } = renderPopup({ ...baseUser, status: 'DoNotDisturb' })
    expect(container.innerHTML).toContain('var(--status-dnd)')
    expect(container.innerHTML).not.toContain('#ed4245')
  })

  it('uses CSS variable for Away status dot (no hardcoded hex)', () => {
    const { container } = renderPopup({ ...baseUser, status: 'Away' })
    expect(container.innerHTML).toContain('var(--status-idle)')
    expect(container.innerHTML).not.toContain('#faa61a')
  })

  it('uses CSS variable for Offline status dot (no hardcoded hex)', () => {
    const { container } = renderPopup({ ...baseUser, status: 'Offline' })
    expect(container.innerHTML).toContain('var(--status-offline)')
    expect(container.innerHTML).not.toContain('#747f8d')
  })
})
