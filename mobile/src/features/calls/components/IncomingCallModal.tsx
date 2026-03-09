import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Phone, PhoneOff } from 'lucide-react-native'

import { Colors } from '../../../shared/theme'
import { Avatar } from '../../../shared/ui/Avatar'

interface IncomingCallModalProps {
  visible: boolean
  callerName: string
  callerAvatarUri?: string
  callerProfileColor?: string | null
  onAccept: () => void
  onDecline: () => void
  onIgnore: () => void
}

export function IncomingCallModal({
  visible,
  callerName,
  callerAvatarUri,
  callerProfileColor,
  onAccept,
  onDecline,
  onIgnore,
}: IncomingCallModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onIgnore} />
        <View style={styles.card}>
          <Avatar
            name={callerName}
            uri={callerAvatarUri}
            size={72}
            borderRadius={36}
            backgroundColor={callerProfileColor ?? undefined}
          />
          <Text style={styles.title} numberOfLines={1}>{callerName}</Text>
          <Text style={styles.subtitle}>Incoming call…</Text>

          <View style={styles.actionsRow}>
            <Pressable style={[styles.actionButton, styles.acceptButton]} onPress={onAccept}>
              <Phone color="#111111" size={18} strokeWidth={2.2} />
            </Pressable>
            <Pressable style={[styles.actionButton, styles.declineButton]} onPress={onDecline}>
              <PhoneOff color="#ffffff" size={18} strokeWidth={2.2} />
            </Pressable>
          </View>

          <Pressable style={styles.ignoreButton} onPress={onIgnore}>
            <Text style={styles.ignoreLabel}>Ignore</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    gap: 12,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 6,
  },
  actionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: Colors.accentGreen,
  },
  declineButton: {
    backgroundColor: Colors.accentRed,
  },
  ignoreButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  ignoreLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
})
