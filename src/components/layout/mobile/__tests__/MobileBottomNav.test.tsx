import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MobileBottomNav } from '../MobileBottomNav'

describe('MobileBottomNav', () => {
  it('renders the three mobile destinations', () => {
    render(
      <MobileBottomNav
        activeTab="browse"
        onBrowse={vi.fn()}
        onFriends={vi.fn()}
        onYou={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Browse' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Friends' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'You' })).toBeTruthy()
  })

  it('marks the active tab as pressed', () => {
    render(
      <MobileBottomNav
        activeTab="friends"
        onBrowse={vi.fn()}
        onFriends={vi.fn()}
        onYou={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Friends' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Browse' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('invokes callbacks when tabs are pressed', () => {
    const onBrowse = vi.fn()
    const onFriends = vi.fn()
    const onYou = vi.fn()

    render(
      <MobileBottomNav
        activeTab={null}
        onBrowse={onBrowse}
        onFriends={onFriends}
        onYou={onYou}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Browse' }))
    fireEvent.click(screen.getByRole('button', { name: 'Friends' }))
    fireEvent.click(screen.getByRole('button', { name: 'You' }))

    expect(onBrowse).toHaveBeenCalledTimes(1)
    expect(onFriends).toHaveBeenCalledTimes(1)
    expect(onYou).toHaveBeenCalledTimes(1)
  })
})
