import React, { useMemo, useRef, useState } from 'react'
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native'

import { Colors } from '../../../../shared/theme/colors'

export type SettingsSection = 'general' | 'sound' | 'account'
export type LayoutMode = 'string' | 'classic'

interface SettingsSidebarProps {
  activeSection: SettingsSection
  onSelectSection: (section: SettingsSection) => void
}

interface SettingsToggleProps {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}

interface SettingsSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
}

interface LayoutModePickerProps {
  value: LayoutMode
  onChange: (value: LayoutMode) => void
}

const SECTION_LABELS: Record<SettingsSection, string> = {
  general: 'General',
  sound: 'Sound',
  account: 'Account',
}

const LAYOUT_OPTIONS: LayoutMode[] = ['string', 'classic']

export function SettingsSidebar({ activeSection, onSelectSection }: SettingsSidebarProps) {
  return (
    <View style={styles.sidebar}>
      {(['general', 'sound', 'account'] as SettingsSection[]).map((section) => {
        const active = section === activeSection
        return (
          <Pressable
            key={section}
            style={[styles.sidebarButton, active && styles.sidebarButtonActive]}
            onPress={() => onSelectSection(section)}
          >
            <Text style={[styles.sidebarButtonText, active && styles.sidebarButtonTextActive]}>
              {SECTION_LABELS[section]}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export function SettingsToggle({ label, value, onChange }: SettingsToggleProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Pressable style={[styles.switchTrack, value && styles.switchTrackActive]} onPress={() => onChange(!value)}>
        <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
      </Pressable>
    </View>
  )
}

export function SettingsSlider({ label, value, onChange }: SettingsSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0)

  const updateValue = (locationX: number) => {
    if (!trackWidth) {
      return
    }

    const ratio = Math.max(0, Math.min(1, locationX / trackWidth))
    onChange(Math.round(ratio * 100))
  }

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      updateValue(event.nativeEvent.locationX)
    },
    onPanResponderMove: (event) => {
      updateValue(event.nativeEvent.locationX)
    },
  }), [trackWidth])

  const thumbOffset = trackWidth > 0 ? (trackWidth - 16) * (value / 100) : 0

  return (
    <View style={styles.sliderBlock}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <View style={styles.sliderRow}>
        <View
          style={styles.sliderTrack}
          onLayout={(event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width)}
          {...panResponder.panHandlers}
        >
          <View style={[styles.sliderFill, { width: `${value}%` }]} />
          <View style={[styles.sliderThumb, { left: thumbOffset }]} />
        </View>
        <Text style={styles.sliderValue}>{value}%</Text>
      </View>
    </View>
  )
}

export function LayoutModePicker({ value, onChange }: LayoutModePickerProps) {
  return (
    <View style={styles.layoutRow}>
      {LAYOUT_OPTIONS.map((option) => {
        const active = option === value
        return (
          <Pressable
            key={option}
            style={[styles.layoutButton, active && styles.layoutButtonActive]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.layoutButtonText, active && styles.layoutButtonTextActive]}>
              {option === 'string' ? 'String' : 'Classic'}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  sidebar: {
    width: 142,
    paddingRight: 14,
    marginRight: 14,
    borderRightWidth: 1,
    borderRightColor: Colors.borderSubtle,
    gap: 10,
  },
  sidebarButton: {
    minHeight: 34,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 2,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  sidebarButtonActive: {
    borderColor: Colors.textPrimary,
    backgroundColor: Colors.bgSecondary,
  },
  sidebarButtonText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  sidebarButtonTextActive: {
    color: Colors.textPrimary,
  },
  row: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  switchTrack: {
    width: 40,
    height: 24,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgInput,
    padding: 2,
  },
  switchTrackActive: {
    backgroundColor: Colors.accentBlue,
    borderColor: Colors.accentBlue,
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
  switchThumbActive: {
    transform: [{ translateX: 16 }],
    backgroundColor: Colors.bgPrimary,
  },
  sliderBlock: {
    gap: 8,
  },
  sliderLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#767676',
    backgroundColor: '#4c4c4c',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: Colors.accentBlue,
  },
  sliderThumb: {
    position: 'absolute',
    top: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accentBlue,
  },
  sliderValue: {
    width: 34,
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'right',
  },
  layoutRow: {
    flexDirection: 'row',
    gap: 8,
  },
  layoutButton: {
    flex: 1,
    minHeight: 34,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  layoutButtonActive: {
    borderColor: Colors.textPrimary,
    backgroundColor: Colors.bgSecondary,
  },
  layoutButtonText: {
    color: Colors.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
  },
  layoutButtonTextActive: {
    color: Colors.textPrimary,
  },
})
