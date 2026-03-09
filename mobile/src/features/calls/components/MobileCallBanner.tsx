import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Colors } from '../../../shared/theme'

interface MobileCallBannerProps {
  mode: 'calling' | 'connected'
  title: string
  subtitle?: string
  canOpen?: boolean
  onOpen?: () => void
  onCancel?: () => void
  onMute?: () => void
  onDeafen?: () => void
  onHangUp?: () => void
  isMuted?: boolean
  isDeafened?: boolean
}

export function MobileCallBanner({
  mode,
  title,
  subtitle,
  canOpen = false,
  onOpen,
  onCancel,
  onMute,
  onDeafen,
  onHangUp,
  isMuted = false,
  isDeafened = false,
}: MobileCallBannerProps) {
  if (mode === 'calling') {
    return (
      <View style={[styles.root, styles.callingRoot]}>
        <View style={styles.copyBlock}>
          <View style={styles.titleRow}>
            <Phone color="#111111" size={14} strokeWidth={2.2} />
            <Text style={styles.callingTitle} numberOfLines={1}>{title}</Text>
          </View>
          {subtitle ? <Text style={styles.callingSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        {onCancel ? (
          <Pressable style={[styles.iconButton, styles.hangupButton]} onPress={onCancel}>
            <PhoneOff color="#ffffff" size={15} strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </View>
    )
  }

  return (
    <View style={[styles.root, styles.connectedRoot]}>
      <Pressable
        style={[styles.copyBlock, canOpen && onOpen ? styles.copyBlockInteractive : null]}
        disabled={!canOpen || !onOpen}
        onPress={onOpen}
      >
        <View style={styles.titleRow}>
          <Phone color={Colors.textPrimary} size={14} strokeWidth={2.2} />
          <Text style={styles.connectedTitle} numberOfLines={1}>{title}</Text>
        </View>
        {subtitle ? <Text style={styles.connectedSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </Pressable>
      <View style={styles.controlsRow}>
        {onMute ? (
          <Pressable style={styles.iconButton} onPress={onMute}>
            {isMuted
              ? <MicOff color={Colors.textPrimary} size={15} strokeWidth={2.2} />
              : <Mic color={Colors.textPrimary} size={15} strokeWidth={2.2} />}
          </Pressable>
        ) : null}
        {onDeafen ? (
          <Pressable style={styles.iconButton} onPress={onDeafen}>
            {isDeafened
              ? <VolumeX color={Colors.textPrimary} size={15} strokeWidth={2.2} />
              : <Volume2 color={Colors.textPrimary} size={15} strokeWidth={2.2} />}
          </Pressable>
        ) : null}
        {onHangUp ? (
          <Pressable style={[styles.iconButton, styles.hangupButton]} onPress={onHangUp}>
            <PhoneOff color="#ffffff" size={15} strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  callingRoot: {
    backgroundColor: Colors.accentGreen,
  },
  connectedRoot: {
    backgroundColor: Colors.bgSecondary,
  },
  copyBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  copyBlockInteractive: {
    paddingVertical: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callingTitle: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  callingSubtitle: {
    color: 'rgba(17, 17, 17, 0.72)',
    fontSize: 11,
  },
  connectedTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  connectedSubtitle: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  hangupButton: {
    backgroundColor: Colors.accentRed,
    borderColor: Colors.accentRed,
  },
})
