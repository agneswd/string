import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  initialMobileShellState,
  resolveMobileShellState,
  type MobileNavigationSection,
  type MobilePane,
} from './mobileShellState'

export interface UseMobileShellControllerParams {
  isMobile: boolean
  isHomeView: boolean
  selectedGuildId?: string | null
  hasActiveContent: boolean
  hasMembersPane: boolean
}

export function useMobileShellController({
  isMobile,
  isHomeView,
  selectedGuildId,
  hasActiveContent,
  hasMembersPane,
}: UseMobileShellControllerParams) {
  const [requestedState, setRequestedState] = useState(initialMobileShellState)
  const previousGuildIdRef = useRef<string | null | undefined>(selectedGuildId)
  const [suppressAutoContent, setSuppressAutoContent] = useState(false)

  const resolvedState = useMemo(
    () => resolveMobileShellState(requestedState, {
      hasActiveContent,
      hasMembersPane,
      isHomeView,
      suppressAutoContent,
    }),
    [hasActiveContent, hasMembersPane, isHomeView, requestedState, suppressAutoContent],
  )

  useEffect(() => {
    if (!isMobile) {
      setRequestedState(initialMobileShellState)
      previousGuildIdRef.current = selectedGuildId
      return
    }

    if (
      requestedState.pane !== resolvedState.pane
      || requestedState.navigationSection !== resolvedState.navigationSection
    ) {
      setRequestedState(resolvedState)
    }
  }, [isMobile, requestedState, resolvedState, selectedGuildId])

  useEffect(() => {
    if (!isMobile) {
      previousGuildIdRef.current = selectedGuildId
      return
    }

    const previousGuildId = previousGuildIdRef.current
    previousGuildIdRef.current = selectedGuildId

    if (selectedGuildId && selectedGuildId !== previousGuildId) {
      setSuppressAutoContent(true)
      setRequestedState({
        pane: 'navigation',
        navigationSection: 'browse',
      })
    }
  }, [isMobile, selectedGuildId])

  const setPane = useCallback((pane: MobilePane) => {
    if (pane === 'content' || pane === 'members') {
      setSuppressAutoContent(false)
    }
    setRequestedState((current) => ({ ...current, pane }))
  }, [])

  const setNavigationSection = useCallback((navigationSection: MobileNavigationSection) => {
    setRequestedState((current) => ({ ...current, navigationSection }))
  }, [])

  const showBrowse = useCallback(() => {
    setRequestedState({ pane: 'navigation', navigationSection: 'browse' })
  }, [])

  const showFriends = useCallback(() => {
    setRequestedState({ pane: 'navigation', navigationSection: 'friends' })
  }, [])

  const showYou = useCallback(() => {
    setRequestedState({ pane: 'navigation', navigationSection: 'you' })
  }, [])

  const openContent = useCallback(() => {
    setSuppressAutoContent(false)
    setRequestedState((current) => ({ ...current, pane: 'content' }))
  }, [])

  const openMembers = useCallback(() => {
    if (!hasMembersPane) {
      return
    }

    setSuppressAutoContent(false)
    setRequestedState((current) => ({ ...current, pane: 'members' }))
  }, [hasMembersPane])

  const toggleMembers = useCallback(() => {
    if (!hasMembersPane) {
      return
    }

    setSuppressAutoContent(false)
    setRequestedState((current) => ({
      ...current,
      pane: resolvedState.pane === 'members' ? 'content' : 'members',
    }))
  }, [hasMembersPane, resolvedState.pane])

  return {
    activePane: resolvedState.pane,
    navigationSection: resolvedState.navigationSection,
    canNavigateToContent: hasActiveContent,
    canNavigateToMembers: hasMembersPane,
    setPane,
    setNavigationSection,
    showBrowse,
    showFriends,
    showYou,
    openContent,
    openMembers,
    toggleMembers,
  }
}
