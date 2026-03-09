import React, { createContext, useContext } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { Colors } from '../../shared/theme'
import { SignedOutGate } from './components/SignedOutGate'
import type { AuthSession } from './types'
import { useAuthSession } from './useAuthSession'

interface AuthContextValue {
  session: AuthSession
  signIn: (payload: {
    userId: string
    token: string
    displayName: string
  }) => void
  signOut: () => Promise<void>
  setError: (message: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * AuthBootstrap
 *
 * Wraps the navigation root and gates rendering on Clerk auth state:
 *
 *  loading    → full-screen spinner while Clerk SDK initialises
 *  signed-out → SignedOutGate (sign-in / sign-up flow)
 *  signed-in  → children (normal app)
 *
 * Makes the AuthContextValue available to any descendant via useAuth().
 * React Native-safe – no DOM APIs.
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const auth = useAuthSession()
  const { session } = auth

  let body: React.ReactNode

  if (session.status === 'loading') {
    body = (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={Colors.accentBlue} size="large" />
      </View>
    )
  } else if (session.status === 'signed-out' || session.status === 'error') {
    body = <SignedOutGate />
  } else {
    body = children
  }

  return (
    <AuthContext.Provider value={auth}>
      {body}
    </AuthContext.Provider>
  )
}

/**
 * Access the global auth session from any screen or component.
 * Must be used inside <AuthBootstrap>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthBootstrap>')
  }
  return ctx
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
