export type MobilePane = 'navigation' | 'content' | 'members'
export type MobileNavigationSection = 'browse' | 'friends' | 'you'

export interface MobileShellState {
  pane: MobilePane
  navigationSection: MobileNavigationSection
}

export interface MobileShellContext {
  hasActiveContent: boolean
  hasMembersPane: boolean
  isHomeView: boolean
}

export const initialMobileShellState: MobileShellState = {
  pane: 'navigation',
  navigationSection: 'browse',
}

export function resolveMobileShellState(
  state: MobileShellState,
  { hasActiveContent, hasMembersPane, isHomeView }: MobileShellContext,
): MobileShellState {
  let pane = state.pane
  let navigationSection = state.navigationSection

  if (navigationSection === 'friends' && !isHomeView) {
    navigationSection = 'browse'
  }

  if (pane === 'members' && !hasMembersPane) {
    pane = hasActiveContent ? 'content' : 'navigation'
  }

  if (pane === 'members' && !hasActiveContent) {
    pane = 'navigation'
  }

  if (pane === 'content' && !hasActiveContent && navigationSection === 'browse') {
    pane = 'navigation'
  }

  if (pane === 'content' && !hasActiveContent && !isHomeView) {
    pane = 'navigation'
  }

  if (pane === state.pane && navigationSection === state.navigationSection) {
    return state
  }

  return {
    pane,
    navigationSection,
  }
}
