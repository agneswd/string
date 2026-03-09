import React from 'react'
import { Plus } from 'lucide-react-native'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { Colors } from '../../../shared/theme/colors'
import { Avatar } from '../../../shared/ui/Avatar'
import { LineSquiggleIcon } from '../../../shared/ui/LineSquiggleIcon'
import type { Guild } from '../types'

interface BrowseServerRailProps {
  guilds: Guild[]
  dmQuickEntries?: Array<{ id: string; label: string; avatarUri?: string; unreadCount?: number }>
  topInset?: number
  isHomeSelected?: boolean
  selectedGuildId?: string | null
  selectedConversationId?: string | null
  onCreateLoom?: () => void
  onSelectHome?: () => void
  onSelectDm?: (conversationId: string) => void
  onSelectGuild: (guildId: string) => void
}

export function BrowseServerRail({
  guilds,
  dmQuickEntries = [],
  topInset = 0,
  isHomeSelected = false,
  selectedGuildId,
  selectedConversationId,
  onCreateLoom,
  onSelectHome,
  onSelectDm,
  onSelectGuild,
}: BrowseServerRailProps) {
  const renderRailButton = (
    key: string,
    isSelected: boolean,
    onPress: (() => void) | undefined,
    content: React.ReactNode,
  ) => (
    <View key={key} style={styles.itemRow}>
      <View style={[styles.selectionIndicator, isSelected && styles.selectionIndicatorActive]} />
      <TouchableOpacity
        style={styles.itemPressable}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {content}
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={[styles.root, topInset > 0 ? { paddingTop: topInset } : null]}>
      <View style={styles.topSlot}>
        {renderRailButton(
          'home',
          isHomeSelected,
          onSelectHome,
          <View style={[styles.homeButton, isHomeSelected && styles.homeButtonActive]}>
            <LineSquiggleIcon size={24} color={Colors.bgPrimary} />
          </View>,
        )}
      </View>

      {dmQuickEntries.length > 0 ? (
        <View style={styles.dmQuickList}>
          {dmQuickEntries.map((entry) => {
            const isSelected = entry.id === selectedConversationId

            return renderRailButton(
              entry.id,
              isSelected,
              () => onSelectDm?.(entry.id),
                <View style={[styles.avatarWrap, isSelected && styles.avatarWrapActive]}>
                  <Avatar name={entry.label} uri={entry.avatarUri} size={42} borderRadius={8} />
                  {!!entry.unreadCount && entry.unreadCount > 0 ? (
                    <View style={styles.dmUnreadBadge}>
                      <Text style={styles.dmUnreadBadgeText}>{entry.unreadCount > 99 ? '99+' : entry.unreadCount}</Text>
                    </View>
                  ) : null}
              </View>,
            )
          })}
        </View>
      ) : null}

      <View style={styles.sectionDivider} />

      <FlatList
        data={guilds}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = item.id === selectedGuildId

          return renderRailButton(
            item.id,
            isSelected,
            () => onSelectGuild(item.id),
              <View style={[styles.avatarWrap, isSelected && styles.avatarWrapActive]}>
                <Avatar name={item.name} uri={item.avatarUri} size={42} borderRadius={8} />
              </View>,
          )
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.8} onPress={onCreateLoom}>
          <Plus color={Colors.textMuted} size={16} strokeWidth={2.25} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    width: 72,
    borderRightWidth: 1,
    borderRightColor: Colors.borderSubtle,
    backgroundColor: Colors.bgPrimary,
  },
  topSlot: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 10,
  },
  itemRow: {
    width: '100%',
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButton: {
    width: 46,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonActive: {
    borderColor: Colors.accentBlue,
    backgroundColor: Colors.accentBlue,
    shadowColor: Colors.accentBlue,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 20,
    gap: 6,
  },
  dmQuickList: {
    gap: 6,
    paddingBottom: 10,
  },
  itemPressable: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicator: {
    position: 'absolute',
    left: 0,
    width: 4,
    height: 0,
    opacity: 0,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: 'transparent',
  },
  selectionIndicatorActive: {
    backgroundColor: Colors.accentBlue,
    height: 38,
    opacity: 1,
  },
  avatarWrap: {
    padding: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapActive: {
    borderColor: Colors.accentBlue,
    backgroundColor: Colors.accentBlueDim,
  },
  dmUnreadBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: Colors.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.bgPrimary,
  },
  dmUnreadBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginHorizontal: 10,
    marginBottom: 6,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingBottom: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderSubtle,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
