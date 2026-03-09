import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { Colors } from '../../../shared/theme'
import { SignInScreen } from '../screens/SignInScreen'
import { SignUpScreen } from '../screens/SignUpScreen'

type AuthMode = 'signIn' | 'signUp'

/**
 * SignedOutGate
 *
 * Rendered by AuthBootstrap when the user is not signed in.
 * Manages the switch between the sign-in and sign-up flows.
 * Does not depend on expo-router — pure component state machine.
 */
export function SignedOutGate() {
  const [mode, setMode] = useState<AuthMode>('signIn')

  return (
    <View style={styles.root}>
      {mode === 'signIn' ? (
        <SignInScreen onSwitchToSignUp={() => setMode('signUp')} />
      ) : (
        <SignUpScreen onSwitchToSignIn={() => setMode('signIn')} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
})
