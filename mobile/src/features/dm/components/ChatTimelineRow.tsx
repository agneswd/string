import { StyleSheet, Text, View } from 'react-native'

import { avatarBytesToUri } from '../../../shared/lib/avatarUtils'
import { Colors } from '../../../shared/theme/colors'
import { Avatar } from '../../../shared/ui/Avatar'
import type { ChatMessage } from '../types'

interface ChatTimelineRowProps {
  message: ChatMessage
  currentUserId: string
  peerName: string
  currentUser?: {
    id: string
    avatarBytes?: Uint8Array | null
    profileColor?: string | null
  } | null
  peerUser?: {
    id: string
    avatarBytes?: Uint8Array | null
    profileColor?: string | null
  } | null
}

export function ChatTimelineRow({
  message,
  currentUserId,
  peerName,
  currentUser,
  peerUser,
}: ChatTimelineRowProps) {
  if (message.kind === 'system') {
    return (
      <View style={styles.systemRow}>
        <View style={styles.systemBadge}>
          <Text style={styles.systemBadgeText}>{message.systemLabel ?? 'INFO'}</Text>
        </View>
        <Text style={styles.systemText}>{message.text}</Text>
        <Text style={styles.systemTimestamp}>{formatTime(message.sentAt)}</Text>
      </View>
    )
  }

  const isOwn = message.senderId === currentUserId
  const authorName = isOwn ? 'You' : peerName
  const authorColor = isOwn ? currentUser?.profileColor : peerUser?.profileColor
  const avatarUri = isOwn ? avatarBytesToUri(currentUser?.avatarBytes) : avatarBytesToUri(peerUser?.avatarBytes)
  const avatarSeed = isOwn ? currentUser?.id ?? currentUserId : peerUser?.id ?? peerName

  return (
    <View style={styles.messageRow}>
      <Avatar
        name={authorName}
        seed={avatarSeed}
        size={32}
        uri={avatarUri}
        backgroundColor={(isOwn ? currentUser?.profileColor : peerUser?.profileColor) ?? undefined}
      />
      <View style={styles.messageContent}>
        <View style={styles.messageMeta}>
          <Text style={[styles.messageAuthor, authorColor ? { color: authorColor } : null]}>{authorName}</Text>
          <Text style={styles.messageTimestamp}>{message.pending ? 'sending' : formatTime(message.sentAt)}</Text>
        </View>
        <View style={styles.messageSurface}>
          <Text style={styles.messageText}>{message.text}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  messageContent: {
    flex: 1,
    gap: 4,
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageAuthor: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  messageTimestamp: {
    color: Colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageSurface: {
    paddingVertical: 2,
  },
  messageText: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  systemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  systemBadge: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: Colors.bgSecondary,
  },
  systemBadgeText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  systemText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 18,
  },
  systemTimestamp: {
    color: Colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
})

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
