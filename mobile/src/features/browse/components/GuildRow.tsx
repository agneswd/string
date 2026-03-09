import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Avatar } from '../../../shared/ui/Avatar'
import { Pill } from '../../../shared/ui/Pill'
import { Colors } from '../../../shared/theme/colors'
import type { Guild } from '../types'

interface GuildRowProps {
  guild: Guild
  onPress: () => void
}

/**
 * Single guild (server) row for the Browse panel list.
 * Displays avatar, name, member count, and a joined badge.
 * React Native-safe.
 */
export function GuildRow({ guild, onPress }: GuildRowProps) {
  const memberLabel =
    guild.memberCount >= 0
      ? guild.memberCount >= 1000
        ? `${(guild.memberCount / 1000).toFixed(1)}k members`
        : `${guild.memberCount} members`
      : null

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Avatar name={guild.name} size={44} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {guild.name}
          </Text>
          {guild.joined && <Pill label="Joined" variant="green" />}
        </View>
        {guild.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {guild.description}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          {memberLabel ? (
            <Text style={styles.meta}>{memberLabel}</Text>
          ) : null}
          {guild.activityLabel ? (
            <Text style={styles.activity}>{guild.activityLabel}</Text>
          ) : null}
        </View>
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
    paddingVertical: 10,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  meta: {
    color: Colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activity: {
    color: Colors.accentBlue,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
})
