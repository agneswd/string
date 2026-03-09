import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { PresenceDot } from '../../../shared/ui/PresenceDot'
import { Colors } from '../../../shared/theme/colors'
import type { PresenceStatus } from '../types'

/**
 * The tag values the backend set_status reducer expects.
 * Mirrors the UserStatus enum in module_bindings/types.ts.
 */
export type StatusTag = 'Online' | 'Away' | 'DoNotDisturb' | 'Offline'

const STATUS_OPTIONS: {
  tag: StatusTag
  status: PresenceStatus
  label: string
  description: string
}[] = [
  { tag: 'Online', status: 'online', label: 'Online', description: 'Available and visible' },
  { tag: 'DoNotDisturb', status: 'dnd', label: 'Do Not Disturb', description: 'Silence all notifications' },
  { tag: 'Offline', status: 'offline', label: 'Invisible', description: 'Appear offline to others' },
]

interface StatusPickerProps {
  currentStatus: PresenceStatus
  selectedTag?: StatusTag
  onSelect: (tag: StatusTag) => void
}

/**
 * Inline status-picker list.
 * Replaces the single tappable StatusRow with four selectable options,
 * matching the web mobile presence control surface.
 * React Native-safe.
 */
export function StatusPicker({ currentStatus, selectedTag, onSelect }: StatusPickerProps) {
  return (
    <View>
      {STATUS_OPTIONS.map((option, idx) => {
        const isActive = selectedTag ? option.tag === selectedTag : option.status === currentStatus

        return (
          <View key={option.tag}>
            <TouchableOpacity
              style={[styles.row, isActive && styles.rowActive]}
              onPress={() => onSelect(option.tag)}
              activeOpacity={0.7}
            >
              <PresenceDot status={option.status} size={14} />
              <View style={styles.textBlock}>
                <Text style={[styles.label, isActive && styles.labelActive]}>
                  {option.label}
                </Text>
                <Text style={styles.description}>{option.description}</Text>
              </View>
              {isActive ? <Text style={styles.check}>✓</Text> : null}
            </TouchableOpacity>
            {idx < STATUS_OPTIONS.length - 1 ? (
              <View style={styles.separator} />
            ) : null}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  rowActive: {
    backgroundColor: '#3a3328',
  },
  textBlock: {
    flex: 1,
    gap: 1,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  labelActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  description: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  check: {
    color: '#d7cab2',
    fontSize: 15,
    fontWeight: '700',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderSubtle,
    marginLeft: 44,
  },
})
