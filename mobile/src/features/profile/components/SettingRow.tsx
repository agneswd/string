import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors } from '../../../shared/theme/colors'
import type { ProfileSettingItem } from '../types'

interface SettingRowProps {
  item: ProfileSettingItem
  onPress?: () => void
}

/**
 * Generic settings list row.
 * Supports an optional value label, navigation chevron, and destructive styling.
 * React Native-safe.
 */
export function SettingRow({ item, onPress }: SettingRowProps) {
  const isDestructive = item.destructive ?? false

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Text style={[styles.label, isDestructive && styles.labelDestructive]}>
        {item.label}
      </Text>
      <View style={styles.right}>
        {item.value ? (
          <Text style={styles.value} numberOfLines={1}>
            {item.value}
          </Text>
        ) : null}
        {item.navigable && (
          <Text style={styles.chevron}>›</Text>
        )}
      </View>
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
  label: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  labelDestructive: {
    color: Colors.accentRed,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    color: Colors.textMuted,
    fontSize: 10,
    maxWidth: 160,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chevron: {
    color: Colors.textDisabled,
    fontSize: 20,
    fontWeight: '300',
  },
})
