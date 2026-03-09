import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Colors } from '../theme/colors'

export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'offline'

const STATUS_COLORS: Record<PresenceStatus, string> = {
  online: Colors.accentGreen,
  idle: '#f5a623',
  dnd: Colors.accentRed,
  offline: Colors.textDisabled,
}

interface PresenceDotProps {
  status: PresenceStatus
  size?: number
}

/**
 * Small coloured dot indicating a user's presence status.
 * Renders with a subtle border matching the surface beneath it.
 * React Native-safe.
 */
export function PresenceDot({ status, size = 12 }: PresenceDotProps) {
  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: STATUS_COLORS[status],
          borderWidth: size > 10 ? 2 : 1.5,
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  dot: {
    borderColor: Colors.bgSecondary,
  },
})
