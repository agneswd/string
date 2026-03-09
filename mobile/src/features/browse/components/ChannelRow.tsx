import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors } from '../../../shared/theme/colors'
import type { Channel } from '../types'

const TYPE_ICON: Record<Channel['type'], string> = {
  category: '▸',
  text: '#',
  voice: '↳',
  announcement: '!',
}

interface ChannelRowProps {
  channel: Channel
  selected?: boolean
  nested?: boolean
  onPress: () => void
}

/**
 * Single channel row within a guild listing.
 * Shows type icon, name, unread indicator, and mention badge.
 * React Native-safe.
 */
export function ChannelRow({ channel, selected = false, nested = false, onPress }: ChannelRowProps) {
  const icon = TYPE_ICON[channel.type]

  return (
    <TouchableOpacity
      style={[styles.row, nested && styles.rowNested, selected && styles.rowSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.icon, selected && styles.iconSelected]}>{icon}</Text>
      <View style={styles.content}>
        <Text
          style={[styles.name, (channel.hasUnread || selected) && styles.nameUnread]}
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
  icon: {
    color: Colors.textMuted,
    fontSize: 15,
    width: 16,
    textAlign: 'center',
  },
  iconSelected: {
    color: Colors.textSecondary,
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
