import React from 'react'
import { MessageSquare, Trash2 } from 'lucide-react-native'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Avatar } from '../../../shared/ui/Avatar'
import { Pill } from '../../../shared/ui/Pill'
import { PresenceDot } from '../../../shared/ui/PresenceDot'
import { Colors } from '../../../shared/theme/colors'
import type { Friend } from '../types'

interface FriendRowProps {
  friend: Friend
  onPress: () => void
  /** Optional: show a "Message" quick-action button. */
  onMessage?: () => void
  /** Optional: show a "Remove" quick-action button. */
  onRemove?: () => void
}

/**
 * Single friend row showing avatar with presence indicator, name, and status.
 * React Native-safe.
 */
export function FriendRow({ friend, onPress, onMessage, onRemove }: FriendRowProps) {
  const secondaryLine = friend.activity ?? friend.statusMessage ?? friend.username

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar + presence dot */}
      <View style={styles.avatarWrapper}>
        <Avatar
          name={friend.displayName}
          seed={friend.id || friend.username}
          size={44}
          uri={friend.avatarUri}
          backgroundColor={friend.profileColor ?? undefined}
        />
        <View style={styles.presencePin}>
          <PresenceDot status={friend.status} size={13} />
        </View>
      </View>

      {/* Name + status message */}
      <View style={styles.content}>
        <Text style={styles.displayName} numberOfLines={1}>
          {friend.displayName}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {secondaryLine}
        </Text>
        {friend.mutualCount ? (
          <View style={styles.metaRow}>
            <Pill label={`${friend.mutualCount} mutual`} variant="default" />
          </View>
        ) : null}
      </View>

      {/* Quick-actions */}
      <View style={styles.actions}>
        {onMessage && (
          <TouchableOpacity
            style={styles.msgBtn}
            onPress={onMessage}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MessageSquare color={Colors.textMuted} size={16} strokeWidth={2} />
          </TouchableOpacity>
        )}
        {onRemove && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={onRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 color={Colors.textMuted} size={16} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  avatarWrapper: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  presencePin: {
    position: 'absolute',
    bottom: -1,
    right: -1,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  displayName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  sub: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  metaRow: {
    marginTop: 2,
  },
  msgBtn: {
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgPrimary,
    borderRadius: 2,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  removeBtn: {
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgPrimary,
    borderRadius: 2,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
