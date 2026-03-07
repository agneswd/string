import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MobileSwipeShell } from '../MobileSwipeShell'

describe('MobileSwipeShell', () => {
  it('renders navigation pane, content pane, and navigation footer', () => {
    render(
      <MobileSwipeShell
        navigationPane={<div>nav pane</div>}
        navigationFooter={<div>bottom bar</div>}
        contentHeader={<div>header</div>}
        contentBody={<div>body</div>}
        activePane="navigation"
        onActivePaneChange={vi.fn()}
      />,
    )

    expect(screen.getByText('nav pane')).toBeTruthy()
    expect(screen.getByText('header')).toBeTruthy()
    expect(screen.getByText('body')).toBeTruthy()
    expect(screen.getByText('bottom bar')).toBeTruthy()
  })

  it('requests the content pane after a left swipe from navigation', () => {
    const onActivePaneChange = vi.fn()
    const { container } = render(
      <MobileSwipeShell
        navigationPane={<div>nav pane</div>}
        navigationFooter={<div>bottom bar</div>}
        contentHeader={<div>header</div>}
        contentBody={<div>body</div>}
        activePane="navigation"
        onActivePaneChange={onActivePaneChange}
      />,
    )

    const swipeTrack = container.querySelector('[data-testid="mobile-swipe-track"]') as HTMLElement
    fireEvent.touchStart(swipeTrack, { changedTouches: [{ clientX: 200, clientY: 20 }] })
    fireEvent.touchEnd(swipeTrack, { changedTouches: [{ clientX: 80, clientY: 22 }] })

    expect(onActivePaneChange).toHaveBeenCalledWith('content')
  })

  it('does not treat taps on interactive elements as pane swipes', () => {
    const onActivePaneChange = vi.fn()
    const { container } = render(
      <MobileSwipeShell
        navigationPane={<button type="button">Open DM</button>}
        navigationFooter={<div>bottom bar</div>}
        contentHeader={<div>header</div>}
        contentBody={<div>body</div>}
        activePane="navigation"
        onActivePaneChange={onActivePaneChange}
      />,
    )

    const swipeTrack = container.querySelector('[data-testid="mobile-swipe-track"]') as HTMLElement
    const button = screen.getByRole('button', { name: /open dm/i })
    fireEvent.touchStart(button, { changedTouches: [{ clientX: 220, clientY: 20 }] })
    fireEvent.touchEnd(swipeTrack, { changedTouches: [{ clientX: 80, clientY: 22 }] })

    expect(onActivePaneChange).not.toHaveBeenCalled()
  })

  it('requests the navigation pane after a right swipe from content', () => {
    const onActivePaneChange = vi.fn()
    const { container } = render(
      <MobileSwipeShell
        navigationPane={<div>nav pane</div>}
        navigationFooter={<div>bottom bar</div>}
        contentHeader={<div>header</div>}
        contentBody={<div>body</div>}
        activePane="content"
        onActivePaneChange={onActivePaneChange}
      />,
    )

    const swipeTrack = container.querySelector('[data-testid="mobile-swipe-track"]') as HTMLElement
    fireEvent.touchStart(swipeTrack, { changedTouches: [{ clientX: 80, clientY: 20 }] })
    fireEvent.touchEnd(swipeTrack, { changedTouches: [{ clientX: 180, clientY: 18 }] })

    expect(onActivePaneChange).toHaveBeenCalledWith('navigation')
  })

  it('requests the members pane after a left swipe from content when members are available', () => {
    const onActivePaneChange = vi.fn()
    const { container } = render(
      <MobileSwipeShell
        navigationPane={<div>nav pane</div>}
        navigationFooter={<div>bottom bar</div>}
        contentHeader={<div>header</div>}
        contentBody={<div>body</div>}
        membersHeader={<div>members header</div>}
        membersPane={<div>members body</div>}
        activePane="content"
        onActivePaneChange={onActivePaneChange}
        canNavigateToMembers={true}
      />,
    )

    const swipeTrack = container.querySelector('[data-testid="mobile-swipe-track"]') as HTMLElement
    fireEvent.touchStart(swipeTrack, { changedTouches: [{ clientX: 220, clientY: 20 }] })
    fireEvent.touchEnd(swipeTrack, { changedTouches: [{ clientX: 80, clientY: 22 }] })

    expect(onActivePaneChange).toHaveBeenCalledWith('members')
  })

  it('requests the content pane after a right swipe from members', () => {
    const onActivePaneChange = vi.fn()
    const { container } = render(
      <MobileSwipeShell
        navigationPane={<div>nav pane</div>}
        navigationFooter={<div>bottom bar</div>}
        contentHeader={<div>header</div>}
        contentBody={<div>body</div>}
        membersHeader={<div>members header</div>}
        membersPane={<div>members body</div>}
        activePane="members"
        onActivePaneChange={onActivePaneChange}
        canNavigateToMembers={true}
      />,
    )

    const swipeTrack = container.querySelector('[data-testid="mobile-swipe-track"]') as HTMLElement
    fireEvent.touchStart(swipeTrack, { changedTouches: [{ clientX: 80, clientY: 20 }] })
    fireEvent.touchEnd(swipeTrack, { changedTouches: [{ clientX: 180, clientY: 22 }] })

    expect(onActivePaneChange).toHaveBeenCalledWith('content')
  })
})
