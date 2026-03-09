import React from 'react'
import { Image, View, Text, StyleSheet } from 'react-native'
import { getAvatarColor, getInitial } from '../lib/avatarUtils'
import { Colors } from '../theme/colors'

interface AvatarProps {
  /** Display name – first character used as fallback. */
  name: string
  /** Stable seed so fallback colors stay consistent across the app. */
  seed?: string
  /** Optional image URI. When absent, renders a letter avatar. */
  uri?: string
  size?: number
  backgroundColor?: string
}

/**
 * Tiny circular avatar.
 * React Native-safe (no img/DOM APIs).
 */
export function Avatar({ name, seed, uri, size = 36, backgroundColor }: AvatarProps) {
  const fallbackSeed = seed?.trim() || name.trim() || '?'
  const initial = getInitial(name.trim() || fallbackSeed)
  const radius = Math.max(4, Math.floor(size * 0.16))
  const resolvedBackgroundColor = backgroundColor ?? getAvatarColor(fallbackSeed)

  return (
    <View
      style={[
        styles.circle,
        { backgroundColor: resolvedBackgroundColor },
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      {uri ? (
        <Image key={uri} source={{ uri }} style={styles.image} />
      ) : (
        <Text key={`fallback:${fallbackSeed}`} style={[styles.initial, { fontSize: size * 0.42 }]}>
          {initial}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  circle: {
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initial: {
    color: '#f5f1ea',
    fontWeight: '700',
  },
})
