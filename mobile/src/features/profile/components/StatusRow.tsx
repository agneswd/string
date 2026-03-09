import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { PresenceDot } from '../../../shared/ui/PresenceDot'
import { Colors } from '../../../shared/theme/colors'
import type { PresenceStatus } from '../types'

const STATUS_LABELS: Record<PresenceStatus, string> = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do Not Disturb',
  offline: 'Invisible',
}

interface StatusRowProps {
  currentStatus: PresenceStatus
  onPress: () => void
}

/**
 * Tappable row displaying the user's current presence status.
 * Tapping opens the status picker (handled by the parent).
 * React Native-safe.
 */
export function StatusRow({ currentStatus, onPress }: StatusRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.left}>
        <PresenceDot status={currentStatus} size={14} />
        <View style={styles.textBlock}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{STATUS_LABELS[currentStatus]}</Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textBlock: {
    gap: 1,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  value: {
    color: Colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chevron: {
    color: Colors.textDisabled,
    fontSize: 20,
    fontWeight: '300',
  },
})
