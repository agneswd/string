import React, { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { Colors } from '../../../shared/theme/colors'
import { ChannelRow } from './ChannelRow'
import type { BrowseChannelSection as BrowseChannelSectionModel, Channel, Guild } from '../types'

interface BrowseChannelSectionProps {
  guild: Guild
  section: BrowseChannelSectionModel
  selectedChannelId?: string | null
  currentVoiceChannelId?: string | null
  onOpenChannel?: (guild: Guild, channel: Channel) => void
}

export function BrowseChannelSection({
  guild,
  section,
  selectedChannelId,
  currentVoiceChannelId,
  onOpenChannel,
}: BrowseChannelSectionProps) {
  const [collapsed, setCollapsed] = useState(false)
  const isCategorySection = section.sectionKind === 'category'
  const shouldRenderHeader = section.sectionKind !== 'cluster'

  return (
    <View style={styles.section}>
      {shouldRenderHeader ? (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            if (section.collapsible) {
              setCollapsed((current) => !current)
            }
          }}
          activeOpacity={section.collapsible ? 0.8 : 1}
          disabled={!section.collapsible}
        >
          <Text style={styles.chevron}>{section.collapsible ? (collapsed ? '▸' : '▾') : '•'}</Text>
          <Text style={styles.title} numberOfLines={1}>{section.title}</Text>
          <Text style={styles.count}>{section.channels.length}</Text>
        </TouchableOpacity>
      ) : null}

      {!collapsed ? (
        section.channels.length > 0 ? (
          <View>
            {section.channels.map((channel) => (
              <View key={channel.id}>
                <ChannelRow
                  channel={channel}
                  selected={channel.id === selectedChannelId}
                  isCurrentVoice={channel.type === 'voice' && channel.id === currentVoiceChannelId}
                  nested={isCategorySection}
                  onPress={() => onOpenChannel?.(guild, channel)}
                />
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyLabel}>No channels surfaced in this section yet.</Text>
        )
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 4,
  },
  chevron: {
    width: 12,
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  title: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  count: {
    color: Colors.textDisabled,
    fontSize: 9,
    fontWeight: '700',
  },
  emptyLabel: {
    color: Colors.textDisabled,
    fontSize: 12,
    paddingHorizontal: 28,
    paddingVertical: 8,
  },
})
