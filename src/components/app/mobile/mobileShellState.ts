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
  suppressAutoContent?: boolean
}

export const initialMobileShellState: MobileShellState = {
  pane: 'navigation',
  navigationSection: 'browse',
}

export function resolveMobileShellState(
  state: MobileShellState,
  { hasActiveContent, hasMembersPane, isHomeView, suppressAutoContent }: MobileShellContext,
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

  // Force navigation when browsing without an active channel — even in home
  // view. The content pane should only persist for home-specific sections
  // (friends / you), not when the user has navigated to a guild browse view
  // where no channel is selected yet.
  if (pane === 'content' && !hasActiveContent && navigationSection === 'browse') {
    pane = 'navigation'
  }

  if (pane === 'content' && !hasActiveContent && !isHomeView) {
    pane = 'navigation'
  }

  // Prevent auto-selected content (e.g. channel auto-selection on guild switch)
  // from forcing the user into the content pane. The user must explicitly open
  // content after a guild transition.
  if (pane === 'content' && suppressAutoContent) {
    pane = 'navigation'
  }

  if (pane === state.pane && navigationSection === state.navigationSection) {
    return state
  }

  return {
    navigationSection,
    pane,
  }
}
