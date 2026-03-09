import React from 'react'
import { Megaphone, Volume2 } from 'lucide-react-native'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors } from '../../../shared/theme/colors'
import type { Channel } from '../types'

interface ChannelRowProps {
  channel: Channel
  selected?: boolean
  isCurrentVoice?: boolean
  nested?: boolean
  onPress: () => void
}

/**
 * Single channel row within a guild listing.
 * Shows type icon, name, unread indicator, and mention badge.
 * React Native-safe.
 */
export function ChannelRow({ channel, selected = false, isCurrentVoice = false, nested = false, onPress }: ChannelRowProps) {
  const showUnreadStyle = channel.hasUnread || selected || isCurrentVoice
  const iconColor = selected || isCurrentVoice ? Colors.textPrimary : Colors.textMuted

  return (
    <TouchableOpacity
      style={[
        styles.row,
        nested && styles.rowNested,
        selected && styles.rowSelected,
        isCurrentVoice && !selected && styles.rowCurrentVoice,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrap}>
        {channel.type === 'text' ? (
          <Text style={[styles.iconHash, { color: iconColor }]}>#</Text>
        ) : channel.type === 'voice' ? (
          <Volume2 color={iconColor} size={15} strokeWidth={2} />
        ) : channel.type === 'announcement' ? (
          <Megaphone color={iconColor} size={14} strokeWidth={2} />
        ) : (
          <Text style={[styles.iconHash, { color: iconColor }]}>▸</Text>
        )}
      </View>
      <View style={styles.content}>
        <Text
          style={[styles.name, showUnreadStyle && styles.nameUnread]}
          numberOfLines={1}
        >
          {channel.name}
        </Text>
      </View>
      {channel.mentionCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {channel.mentionCount > 99 ? '99+' : channel.mentionCount}
          </Text>
        </View>
      )}
      {channel.hasUnread && channel.mentionCount === 0 && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 8,
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  rowNested: {
    paddingLeft: 20,
  },
  rowSelected: {
    backgroundColor: Colors.bgSecondary,
  },
  rowCurrentVoice: {
    backgroundColor: Colors.bgSecondary,
    borderLeftWidth: 2,
    borderLeftColor: Colors.accentGreen,
    paddingLeft: 12,
  },
  iconWrap: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHash: {
    fontSize: 15,
    textAlign: 'center',
  },
  name: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  nameUnread: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.badgeBg,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.accentBlue,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.badgeText,
    fontSize: 10,
    fontWeight: '700',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentBlue,
  },
})
