import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Colors } from '../theme/colors'

/**
 * One-pixel horizontal separator for use between list rows.
 * React Native-safe.
 */
export function RowSeparator() {
  return <View style={styles.line} />
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderSubtle,
    marginLeft: 72,
  },
})
