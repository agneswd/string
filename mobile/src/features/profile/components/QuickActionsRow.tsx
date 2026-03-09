import React from 'react'
import { Headphones, HeadphoneOff, Mic, MicOff, Settings } from 'lucide-react-native'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors } from '../../../shared/theme/colors'

interface QuickActionsRowProps {
  isMuted?: boolean
  isDeafened?: boolean
  onOpenSettings?: () => void
  onToggleMute?: () => void
  onToggleDeafen?: () => void
}

/**
 * Three-up quick-action grid at the top of the "You" pane.
 * Mirrors the Settings / Mute / Deafen button row in the web mobile user section.
 * Mute and Deafen are live when `onToggleMute`/`onToggleDeafen` are provided
 * (i.e. the user is in a voice channel); otherwise they show a "not in voice" hint.
 * React Native-safe.
 */
export function QuickActionsRow({
  isMuted,
  isDeafened,
  onOpenSettings,
  onToggleMute,
  onToggleDeafen,
}: QuickActionsRowProps) {
  return (
    <View style={styles.row}>
      <ActionButton
        label="Settings"
        icon={<Settings color={Colors.textPrimary} size={16} strokeWidth={2} />}
        onPress={onOpenSettings}
      />
      <ActionButton
        label={isMuted ? 'Unmute' : 'Mute'}
        icon={isMuted
          ? <MicOff color={Colors.accentRed} size={16} strokeWidth={2} />
          : <Mic color={Colors.textPrimary} size={16} strokeWidth={2} />}
        active={Boolean(isMuted)}
        danger={Boolean(isMuted)}
        onPress={onToggleMute}
      />
      <ActionButton
        label={isDeafened ? 'Undeafen' : 'Deafen'}
        icon={isDeafened
          ? <HeadphoneOff color={Colors.accentRed} size={16} strokeWidth={2} />
          : <Headphones color={Colors.textPrimary} size={16} strokeWidth={2} />}
        active={Boolean(isDeafened)}
        danger={Boolean(isDeafened)}
        onPress={onToggleDeafen}
      />
    </View>
  )
}

function ActionButton({
  label,
  icon,
  active = false,
  danger = false,
  onPress,
}: {
  label: string
  icon: React.ReactNode
  active?: boolean
  danger?: boolean
  onPress?: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.btn, active && styles.btnActive, danger && styles.btnDanger]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
  },
  btn: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 2,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  btnActive: {
    borderColor: Colors.borderDefault,
  },
  btnDanger: {
    borderColor: Colors.accentRed,
  },
  iconWrap: {
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  labelDanger: {
    color: Colors.accentRed,
  },
})
