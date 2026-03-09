import { ClerkProvider } from '@clerk/clerk-expo'
import type { PropsWithChildren } from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'

import { Colors } from '../../shared/theme'
import { isLiveClerkKey, isLocalDevelopmentHost, resolveClerkPublishableKey } from '../auth/clerkConfig'
import { clerkTokenCache } from '../auth/clerkTokenCache'

const publishableKey = resolveClerkPublishableKey()
const hostname = typeof window !== 'undefined' ? window.location?.hostname : undefined
const hasIncompatibleLocalLiveKey = Platform.OS === 'web' && isLocalDevelopmentHost(hostname) && isLiveClerkKey(publishableKey)

export function ClerkAuthProvider({ children }: PropsWithChildren) {
  if (hasIncompatibleLocalLiveKey) {
    return (
      <View style={styles.warningRoot}>
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Live Clerk keys do not work on localhost.</Text>
          <Text style={styles.warningBody}>
            Use Expo Go on a device or switch this web preview to a Clerk development key.
          </Text>
        </View>
      </View>
    )
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={clerkTokenCache}
    >
      {children}
    </ClerkProvider>
  )
}

const styles = StyleSheet.create({
  warningRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
    padding: 24,
  },
  warningCard: {
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: 12,
    backgroundColor: Colors.bgSecondary,
    padding: 20,
    gap: 10,
  },
  warningTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  warningBody: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
})