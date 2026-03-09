import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { resolveClerkDisplayName } from '../../core/auth/clerkConfig'
import type { AuthSession } from './types'

/**
 * useAuthSession
 *
 * Clerk adapter — maps Clerk's Expo auth state onto the app's
 * AuthSession union type so the rest of the app stays decoupled from
 * the auth provider.
 *
 * ─ Notes ──────────────────────────────────────────────────────────────────
 *  • `signIn` remains unsupported here; Clerk's useSignIn hook handles
 *    sign-in and automatically updates useAuth().isSignedIn on completion.
 *  • `signOut` delegates to Clerk's signOut. The session will flip to
 *    signed-out automatically once Clerk processes the request.
 *  • `token` is restored from Clerk's active session so the mobile shell can
 *    pass a real bearer token into downstream services when needed.
 *  • React Native-safe: no DOM APIs, no window/document references.
 * ──────────────────────────────────────────────────────────────────────────
 */
export function useAuthSession() {
  const {
    getToken,
    isLoaded,
    isSignedIn,
    signOut: clerkSignOut,
    userId,
  } = useClerkAuth()
  const { user } = useUser()
  const getTokenRef = useRef(getToken)
  const [token, setToken] = useState('')
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [manualError, setManualError] = useState<string | null>(null)

  getTokenRef.current = getToken

  useEffect(() => {
    let cancelled = false

    async function syncToken() {
      if (!isLoaded || !isSignedIn || !userId) {
        if (!cancelled) {
          setToken('')
          setTokenError(null)
          setManualError(null)
        }
        return
      }

      try {
        const nextToken = await getTokenRef.current()

        if (!cancelled) {
          const resolvedToken = nextToken ?? ''
          setToken((current) => (current === resolvedToken ? current : resolvedToken))
          setTokenError(null)
          setManualError(null)
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setToken('')
          setTokenError(
            error instanceof Error
              ? error.message
              : 'Failed to restore the Clerk session.',
          )
        }
      }
    }

    void syncToken()

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, userId, user?.id])

  const session = useMemo<AuthSession>(() => {
    if (manualError) {
      return { status: 'error', message: manualError }
    }

    if (!isLoaded) {
      return { status: 'loading' }
    }

    if (!isSignedIn || !userId) {
      return { status: 'signed-out' }
    }

    if (tokenError) {
      return { status: 'error', message: tokenError }
    }

    return {
      status: 'signed-in',
      userId,
      token,
      displayName: resolveClerkDisplayName(user),
      email: user?.primaryEmailAddress?.emailAddress ?? null,
    }
  }, [isLoaded, isSignedIn, manualError, token, tokenError, user, userId])

  /**
   * No-op: sign-in is handled by SignInScreen / SignUpScreen via Clerk hooks.
   * Clerk automatically updates `isSignedIn` after a successful sign-in.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const signIn = useCallback(
    (_payload: { userId: string; token: string; displayName: string }) => {
      throw new Error(
        'Direct signIn() is not supported in the mobile shell. Use Clerk Expo sign-in flows instead.',
      )
    },
    [],
  )

  const signOut = useCallback(async () => {
    await clerkSignOut()
  }, [clerkSignOut])

  /**
   * No-op: form-level errors are handled locally in auth screens.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setError = useCallback((message: string) => {
    setManualError(message)
  }, [])

  return { session, signIn, signOut, setError }
}
