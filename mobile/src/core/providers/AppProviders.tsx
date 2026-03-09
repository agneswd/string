import type { PropsWithChildren } from 'react'
import { StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AuthBootstrap } from '../../features/auth'
import { SpacetimeBootstrap } from '../spacetime'
import { Colors } from '../../shared/theme'
import { ClerkAuthProvider } from './ClerkAuthProvider'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ClerkAuthProvider>
          <AuthBootstrap>
            <SpacetimeBootstrap>
              {children}
            </SpacetimeBootstrap>
          </AuthBootstrap>
        </ClerkAuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
})
