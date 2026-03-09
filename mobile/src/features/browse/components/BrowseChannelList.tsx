import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'

import { EmptyState } from '../../../shared/ui/EmptyState'
import { BrowseChannelSection } from './BrowseChannelSection'
import type { BrowseChannelSection as BrowseChannelSectionModel, Channel, Guild } from '../types'

interface BrowseChannelListProps {
  guild: Guild | null
  sections: BrowseChannelSectionModel[]
  selectedChannelId?: string | null
  onOpenChannel?: (guild: Guild, channel: Channel) => void
}

export function BrowseChannelList({
  guild,
  sections,
  selectedChannelId,
  onOpenChannel,
}: BrowseChannelListProps) {
  if (!guild) {
    return (
      <EmptyState
        title="No server selected"
        body="Pick a server from the rail to see its channels and jump into the conversation quickly."
      />
    )
  }

  if (!sections.length) {
    return (
      <EmptyState
        title="No channels yet"
        body="This server does not have any channels surfaced in the live shell data yet."
      />
    )
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {sections.map((section) => (
        <BrowseChannelSection
          key={section.id}
          guild={guild}
          section={section}
          selectedChannelId={selectedChannelId}
          onOpenChannel={onOpenChannel}
        />
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingTop: 12,
    paddingBottom: 28,
  },
})
