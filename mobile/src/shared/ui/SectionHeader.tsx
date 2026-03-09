import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../theme/colors'

interface SectionHeaderProps {
  title: string
  /** Optional trailing annotation, e.g. count or status. */
  trailing?: string
}

/**
 * Compact uppercase section-header row.
 * Used by Browse, Friends, Profile panels.
 * React Native-safe.
 */
export function SectionHeader({ title, trailing }: SectionHeaderProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title.toUpperCase()}</Text>
      {trailing !== undefined && (
        <Text style={styles.trailing}>{trailing}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  title: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
  },
  trailing: {
    color: Colors.textDisabled,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
})
