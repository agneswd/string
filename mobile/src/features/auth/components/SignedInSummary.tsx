import { useAuth, useUser } from '@clerk/clerk-expo'
import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

import { resolveClerkDisplayName } from '../../../core/auth/clerkConfig'
import { Colors } from '../../../shared/theme'

/**
 * SignedInSummary
 *
 * Displays the current user's identity and a sign-out button.
 * Intended for use in SettingsScreen or any screen where the
 * signed-in user's info is relevant.
 *
 * Must be rendered inside a ClerkProvider.
 */
export function SignedInSummary() {
  const { signOut, isLoaded } = useAuth()
  const { user } = useUser()

  if (!isLoaded) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator color={Colors.accentBlue} size="small" />
      </View>
    )
  }

  if (!user) return null

  const displayName = resolveClerkDisplayName(user)

  const email = user.primaryEmailAddress?.emailAddress ?? ''
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <View style={styles.root}>
      {/* Avatar */}
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.displayName} numberOfLines={1}>
            {displayName}
          </Text>
          {email ? (
            <Text style={styles.email} numberOfLines={1}>
              {email}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Sign out */}
      <Pressable
        style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutButtonPressed]}
        onPress={() => {
          void signOut()
        }}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  loadingRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  root: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 16,
    gap: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  nameBlock: {
    flex: 1,
    gap: 2,
  },
  displayName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  email: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: Colors.accentRed,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutButtonPressed: {
    backgroundColor: Colors.accentRed,
  },
  signOutText: {
    color: Colors.accentRed,
    fontSize: 15,
    fontWeight: '600',
  },
})
