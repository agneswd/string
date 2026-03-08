import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useMobileShellController } from '../useMobileShellController'

describe('useMobileShellController', () => {
  it('keeps navigation pane when guild changes even if content becomes active later', () => {
    // Start: Home view, DM active, pane=navigation
    const { result, rerender } = renderHook(
      (props) => useMobileShellController(props),
      {
        initialProps: {
          isMobile: true,
          isHomeView: true,
          selectedGuildId: null as string | null | undefined,
          hasActiveContent: true, // DM is active
          hasMembersPane: false,
        },
      },
    )

    // User opened a DM → pane should be navigation initially
    expect(result.current.activePane).toBe('navigation')

    // User clicks "go content" (opens DM chat)
    act(() => {
      result.current.openContent()
    })
    expect(result.current.activePane).toBe('content')

    // User clicks Back
    act(() => {
      result.current.showBrowse()
    })
    expect(result.current.activePane).toBe('navigation')

    // Step 1: User clicks server icon
    // The handler simultaneously: clears DM, sets guildId, calls showBrowse
    rerender({
      isMobile: true,
      isHomeView: false,
      selectedGuildId: 'guild-1',
      hasActiveContent: false, // DM cleared, no text channel yet
      hasMembersPane: false,
    })

    // Pane should be navigation
    expect(result.current.activePane).toBe('navigation')

    // Step 2: Auto-select effect fires — text channel gets auto-selected
    rerender({
      isMobile: true,
      isHomeView: false,
      selectedGuildId: 'guild-1',
      hasActiveContent: true, // text channel auto-selected!
      hasMembersPane: false,
    })

    // BUG: This should be 'navigation' but may flip to 'content'
    expect(result.current.activePane).toBe('navigation')
  })

  it('allows explicit content navigation after guild change suppression', () => {
    const { result, rerender } = renderHook(
      (props) => useMobileShellController(props),
      {
        initialProps: {
          isMobile: true,
          isHomeView: false,
          selectedGuildId: 'guild-1' as string | null | undefined,
          hasActiveContent: true,
          hasMembersPane: false,
        },
      },
    )

    // Guild just loaded, pane should be navigation
    expect(result.current.activePane).toBe('navigation')

    // User explicitly clicks a channel (openContent)
    act(() => {
      result.current.openContent()
    })
    expect(result.current.activePane).toBe('content')

    // Back button should work
    act(() => {
      result.current.showBrowse()
    })
    expect(result.current.activePane).toBe('navigation')
  })

  it('back button works after guild switch causes content pane', () => {
    const { result, rerender } = renderHook(
      (props) => useMobileShellController(props),
      {
        initialProps: {
          isMobile: true,
          isHomeView: true,
          selectedGuildId: null as string | null | undefined,
          hasActiveContent: true, // DM active
          hasMembersPane: false,
        },
      },
    )

    // Open DM content
    act(() => {
      result.current.openContent()
    })
    expect(result.current.activePane).toBe('content')

    // Switch to guild (clears DM, sets guild)
    rerender({
      isMobile: true,
      isHomeView: false,
      selectedGuildId: 'guild-1',
      hasActiveContent: false,
      hasMembersPane: false,
    })
    expect(result.current.activePane).toBe('navigation')

    // Auto-select causes hasActiveContent to become true
    rerender({
      isMobile: true,
      isHomeView: false,
      selectedGuildId: 'guild-1',
      hasActiveContent: true,
      hasMembersPane: false,
    })
    expect(result.current.activePane).toBe('navigation')

    // User explicitly opens content
    act(() => {
      result.current.openContent()
    })
    expect(result.current.activePane).toBe('content')

    // Back button should return to navigation
    act(() => {
      result.current.showBrowse()
    })
    expect(result.current.activePane).toBe('navigation')
  })
})
