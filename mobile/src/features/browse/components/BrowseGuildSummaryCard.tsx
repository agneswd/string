import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { Colors } from '../../../shared/theme/colors'
import { Pill } from '../../../shared/ui/Pill'
import type { BrowseGuildStats } from '../browseModel'
import type { Channel, Guild } from '../types'

interface BrowseGuildSummaryCardProps {
  guild: Guild | null
  stats: BrowseGuildStats
  primaryChannel: Channel | null
  onOpenGuild?: (guild: Guild) => void
  onOpenChannel?: (guild: Guild, channel: Channel) => void
}

export function BrowseGuildSummaryCard({
  guild,
  stats,
  primaryChannel,
  onOpenGuild,
  onOpenChannel,
}: BrowseGuildSummaryCardProps) {
  if (!guild) {
    return null
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>Selected server</Text>
          <Text style={styles.title} numberOfLines={1}>{guild.name}</Text>
          {guild.description ? (
            <Text style={styles.description} numberOfLines={2}>{guild.description}</Text>
          ) : null}
        </View>
        <Pill label={guild.joined ? 'Joined' : 'Preview'} variant={guild.joined ? 'green' : 'default'} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <Text style={styles.statValue}>{stats.totalChannels}</Text>
          <Text style={styles.statLabel}>channels</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statValue}>{stats.unreadChannels}</Text>
          <Text style={styles.statLabel}>unread</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statValue}>{stats.mentionCount}</Text>
          <Text style={styles.statLabel}>mentions</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => onOpenGuild?.(guild)}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Overview</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, !primaryChannel && styles.actionButtonDisabled]}
          onPress={() => {
            if (primaryChannel) {
              onOpenChannel?.(guild, primaryChannel)
            }
          }}
          activeOpacity={0.8}
          disabled={!primaryChannel}
        >
          <Text style={styles.actionButtonText} numberOfLines={1}>
            {primaryChannel ? `Jump to #${primaryChannel.name}` : 'No channels yet'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgSecondary,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statPill: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 2,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: Colors.accentBlueDim,
    borderWidth: 1,
    borderColor: Colors.accentBlue,
  },
  actionButtonDisabled: {
    opacity: 0.45,
    borderColor: Colors.borderSubtle,
  },
  actionButtonText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: Colors.bgPrimary,
    borderColor: Colors.borderSubtle,
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
})
