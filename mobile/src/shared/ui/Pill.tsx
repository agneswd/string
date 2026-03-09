import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../theme/colors'

export type PillVariant = 'default' | 'green' | 'red' | 'blue'

const PILL_COLORS: Record<PillVariant, { bg: string; text: string }> = {
  default: { bg: Colors.bgSecondary, text: Colors.textMuted },
  green: { bg: Colors.bgSecondary, text: Colors.accentGreen },
  red: { bg: Colors.bgSecondary, text: Colors.accentRed },
  blue: { bg: Colors.bgSecondary, text: Colors.accentBlue },
}

interface PillProps {
  label: string
  variant?: PillVariant
}

/**
 * Tiny rounded status/label pill.
 * React Native-safe.
 */
export function Pill({ label, variant = 'default' }: PillProps) {
  const { bg, text: textColor } = PILL_COLORS[variant]
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: textColor }]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 3,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
})
