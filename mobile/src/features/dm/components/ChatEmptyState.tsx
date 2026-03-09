import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Avatar } from '../../../shared/ui/Avatar'
import { Colors } from '../../../shared/theme/colors'

interface ChatEmptyStateProps {
  peerName: string
  profileColor?: string | null
}

/**
 * Shown at the top of a DM thread before any messages exist.
 * Introduces the conversation with the peer's avatar and name.
 * React Native-safe.
 */
export function ChatEmptyState({ peerName, profileColor }: ChatEmptyStateProps) {
  return (
    <View style={styles.root}>
      <Avatar name={peerName} size={64} backgroundColor={profileColor ?? undefined} />
      <Text style={[styles.name, profileColor ? { color: profileColor } : null]}>{peerName}</Text>
      <Text style={styles.body}>
        This is the beginning of your direct message history with{' '}
        <Text style={[styles.nameInline, profileColor ? { color: profileColor } : null]}>{peerName}</Text>.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
    gap: 10,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  body: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  nameInline: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
})
