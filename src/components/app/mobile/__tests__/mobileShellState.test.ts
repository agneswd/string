import { describe, expect, it } from 'vitest'
import {
  resolveMobileShellState,
  type MobileShellContext,
  type MobileShellState,
} from '../mobileShellState'

// ── Helper ──

function resolve(
  state: MobileShellState,
  ctx: Partial<MobileShellContext> = {},
): MobileShellState {
  return resolveMobileShellState(state, {
    hasActiveContent: false,
    hasMembersPane: false,
    isHomeView: true,
    ...ctx,
  })
}

describe('resolveMobileShellState', () => {
  it('preserves home content in friends section', () => {
    expect(
      resolve(
        { pane: 'content', navigationSection: 'friends' },
        { hasActiveContent: false, isHomeView: true },
      ),
    ).toEqual({ pane: 'content', navigationSection: 'friends' })
  })

  it('forces navigation when browse mode has no active content (DM → server bug)', () => {
    expect(
      resolve(
        { pane: 'content', navigationSection: 'browse' },
        { hasActiveContent: false, isHomeView: true },
      ),
    ).toEqual({ pane: 'navigation', navigationSection: 'browse' })
  })

  it('forces navigation for content pane without active content in non-home view', () => {
    expect(
      resolve(
        { pane: 'content', navigationSection: 'browse' },
        { hasActiveContent: false, isHomeView: false },
      ),
    ).toEqual({ pane: 'navigation', navigationSection: 'browse' })
  })

  it('forces navigation when suppressAutoContent is active even with active content', () => {
    expect(
      resolve(
        { pane: 'content', navigationSection: 'browse' },
        { hasActiveContent: true, isHomeView: false, suppressAutoContent: true },
      ),
    ).toEqual({ pane: 'navigation', navigationSection: 'browse' })
  })

  it('does not suppress navigation pane when suppressAutoContent is active', () => {
    expect(
      resolve(
        { pane: 'navigation', navigationSection: 'browse' },
        { hasActiveContent: true, isHomeView: true, suppressAutoContent: true },
      ),
    ).toEqual({ pane: 'navigation', navigationSection: 'browse' })
  })
})
