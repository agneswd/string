import { useAuth, useUser } from '@clerk/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { getConn } from '../lib/connection'
import { stringStore } from '../lib/stringStore'
import { shallowEqual, useStringActions, useStringStore } from '../lib/useStringStore'

const CLERK_USER_STORAGE_KEY = 'string_clerk_user_id'
const RETURNING_SESSION_GRACE_MS = 600

const sanitizeUsername = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '')

const getEmailLocalPart = (email?: string | null): string => {
  if (!email) {
    return ''
  }

  return email.split('@')[0] ?? ''
}

const buildStableUsername = (user: NonNullable<ReturnType<typeof useUser>['user']>): string => {
  const preferred = sanitizeUsername(user.username ?? '')
  if (preferred.length >= 1 && preferred.length <= 32) {
    return preferred
  }

  const suffix = user.id.replace(/^user_/, '').toLowerCase().slice(-8) || 'string'
  const base = sanitizeUsername(
    getEmailLocalPart(user.primaryEmailAddress?.emailAddress)
      || user.firstName
      || user.lastName
      || 'user',
  )

  const truncatedBase = (base || 'user').slice(0, Math.max(1, 32 - suffix.length - 1))
  return `${truncatedBase}-${suffix}`
}

const buildDisplayName = (user: NonNullable<ReturnType<typeof useUser>['user']>): string => {
  const preferred = user.fullName?.trim()
    || [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    || user.username?.trim()
    || getEmailLocalPart(user.primaryEmailAddress?.emailAddress)
    || `User ${user.id.slice(-6)}`

  return preferred.slice(0, 64)
}

const isRecoverableRegistrationError = (message: string): boolean =>
  message.includes('already taken') || message.includes('No user named')

type SyncState = 'idle' | 'connecting' | 'provisioning' | 'ready' | 'error'

export function useClerkSpacetimeAuth() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const actions = useStringActions()
  const { connectionStatus, coreTablesReady, myProfile, identity } = useStringStore((state) => ({
    connectionStatus: state.connectionStatus,
    coreTablesReady: state.coreTablesReady,
    myProfile: state.myProfile,
    identity: state.identity,
  }), shallowEqual)

  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [shouldShowAuthScreen, setShouldShowAuthScreen] = useState(false)
  const lastProvisionedKeyRef = useRef<string | null>(null)
  const lastConnectedUserIdRef = useRef<string | null>(null)
  const hasStoredSessionHint = useMemo(() => {
    try {
      return Boolean(window.localStorage.getItem(CLERK_USER_STORAGE_KEY))
    } catch {
      return false
    }
  }, [isLoaded, isSignedIn, user?.id])

  const clerkProfile = useMemo(() => {
    if (!user) {
      return null
    }

    return {
      clerkUserId: user.id,
      username: buildStableUsername(user),
      displayName: buildDisplayName(user),
    }
  }, [user])

  useEffect(() => {
    if (!hasStoredSessionHint) {
      setShouldShowAuthScreen(true)
      return
    }

    if (isSignedIn) {
      setShouldShowAuthScreen(false)
      return
    }

    setShouldShowAuthScreen(false)
    const timeoutId = window.setTimeout(() => {
      setShouldShowAuthScreen(true)
    }, RETURNING_SESSION_GRACE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [hasStoredSessionHint, isSignedIn])

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    if (!isSignedIn || !user) {
      if (hasStoredSessionHint && !shouldShowAuthScreen) {
        setSyncState('connecting')
        return
      }

      lastProvisionedKeyRef.current = null
      lastConnectedUserIdRef.current = null
      setSyncState('idle')
      setSyncError(null)
      try {
        window.localStorage.removeItem(CLERK_USER_STORAGE_KEY)
      } catch {
        // ignore storage failures
      }
      actions.clearAuthAndDisconnect()
      return
    }

    setShouldShowAuthScreen(false)

    let shouldReconnect = false
    try {
      const previousUserId = window.localStorage.getItem(CLERK_USER_STORAGE_KEY)
      if (previousUserId !== null && previousUserId !== user.id) {
        shouldReconnect = true
      }
      window.localStorage.setItem(CLERK_USER_STORAGE_KEY, user.id)
    } catch {
      // ignore storage failures
    }

    if (shouldReconnect || lastConnectedUserIdRef.current !== user.id) {
      lastProvisionedKeyRef.current = null
      lastConnectedUserIdRef.current = user.id
      if (shouldReconnect) {
        actions.clearAuthAndDisconnect()
        setSyncState('connecting')
        return
      }
    }

    if (connectionStatus !== 'connected' && connectionStatus !== 'connecting') {
      setSyncState('connecting')
      actions.connect()
    }
  }, [actions, connectionStatus, hasStoredSessionHint, isLoaded, isSignedIn, shouldShowAuthScreen, user])

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || !clerkProfile) {
      return
    }

    if (connectionStatus !== 'connected') {
      if (connectionStatus === 'error') {
        setSyncState('error')
      }
      return
    }

    if (!coreTablesReady) {
      setSyncState('connecting')
      return
    }

    const provisionKey = [clerkProfile.clerkUserId, clerkProfile.username, clerkProfile.displayName, String(identity ?? '')].join(':')
    if (lastProvisionedKeyRef.current === provisionKey) {
      if (myProfile) {
        setSyncState('ready')
        setSyncError(null)
      }
      return
    }

    let cancelled = false

    const syncProfile = async () => {
      setSyncState('provisioning')
      setSyncError(null)

      try {
        if (!myProfile) {
          try {
            await actions.registerUser({
              username: clerkProfile.username,
              displayName: clerkProfile.displayName,
            })
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            if (isRecoverableRegistrationError(message)) {
              await getConn().reducers.loginAsUser({ username: clerkProfile.username })
              stringStore.disconnect()
              stringStore.connect()
              return
            }

            if (!message.includes('already registered')) {
              throw error
            }
          }
        }

        if (myProfile && myProfile.displayName !== clerkProfile.displayName) {
          await actions.updateProfile({
            displayName: clerkProfile.displayName,
            bio: undefined,
            avatarBytes: undefined,
            profileColor: undefined,
          })
        }

        if (!cancelled) {
          lastProvisionedKeyRef.current = provisionKey
          setSyncState('ready')
          setSyncError(null)
        }
      } catch (error) {
        if (!cancelled) {
          setSyncState('error')
          setSyncError(error instanceof Error ? error.message : String(error))
        }
      }
    }

    void syncProfile()

    return () => {
      cancelled = true
    }
  }, [actions, clerkProfile, connectionStatus, coreTablesReady, identity, isLoaded, isSignedIn, myProfile, user])

  const statusMessage = useMemo(() => {
    if (!isLoaded) {
      return 'Loading authentication…'
    }

    if (!isSignedIn) {
      return hasStoredSessionHint && !shouldShowAuthScreen
        ? 'Checking your saved session…'
        : 'Sign in or create an account to enter String.'
    }

    if (syncState === 'connecting') {
      return connectionStatus === 'connected' ? 'Restoring your String session…' : 'Connecting to the realtime service…'
    }

    if (syncState === 'provisioning') {
      return 'Syncing your String profile…'
    }

    if (syncState === 'error' && syncError) {
      return syncError
    }

    return null
  }, [connectionStatus, hasStoredSessionHint, isLoaded, isSignedIn, shouldShowAuthScreen, syncError, syncState])

  const isReady = isLoaded && isSignedIn && connectionStatus === 'connected' && coreTablesReady && Boolean(myProfile) && syncState === 'ready'
  const isRestoringSession = hasStoredSessionHint && (!isLoaded || !isSignedIn || !isReady)

  return {
    isLoaded,
    isSignedIn,
    user,
    clerkProfile,
    hasStoredSessionHint,
    connectionStatus,
    isReady,
    isRestoringSession,
    shouldShowAuthScreen,
    isBusy: isLoaded && isSignedIn && !isReady,
    hasError: syncState === 'error',
    statusMessage,
  }
}