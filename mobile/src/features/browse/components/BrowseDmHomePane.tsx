import React, { useMemo, useState } from 'react'
import { Search } from 'lucide-react-native'
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { Avatar } from '../../../shared/ui/Avatar'
import { Colors } from '../../../shared/theme/colors'
import type { DmConversation } from '../../dm/types'

interface BrowseDmHomePaneProps {
  conversations: DmConversation[]
  pendingCount?: number
  selectedConversationId?: string | null
  onOpenConversation: (conversation: DmConversation) => void
  onShowFriends?: () => void
}

export function BrowseDmHomePane({
  conversations,
  pendingCount = 0,
  selectedConversationId,
  onOpenConversation,
  onShowFriends,
}: BrowseDmHomePaneProps) {
  const [filter, setFilter] = useState('')

  const filteredConversations = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase()
    if (!normalizedFilter) {
      return conversations
    }

    return conversations.filter((conversation) => (
      conversation.peerName.toLowerCase().includes(normalizedFilter)
      || conversation.lastMessageText?.toLowerCase().includes(normalizedFilter)
    ))
  }, [conversations, filter])

  return (
    <View style={styles.root}>
      <View style={styles.searchWrap}>
        <Search color={Colors.textMuted} size={15} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          value={filter}
          onChangeText={setFilter}
          placeholder="Search Direct Messages"
          placeholderTextColor={Colors.textDisabled}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <Pressable style={styles.friendsButton} onPress={onShowFriends}>
        <Text style={styles.friendsButtonText}>Friends</Text>
        {pendingCount > 0 ? (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
          </View>
        ) : null}
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Direct Messages</Text>
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, item.id === selectedConversationId && styles.rowSelected]}
            onPress={() => onOpenConversation(item)}
          >
            <Avatar
              name={item.peerName}
              seed={item.peerId}
              size={40}
              uri={item.avatarUri}
              backgroundColor={item.profileColor ?? undefined}
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle} numberOfLines={1}>{item.peerName}</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {item.lastMessageText ?? 'No messages yet'}
              </Text>
            </View>
            {item.unreadCount > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        )}
        contentContainerStyle={filteredConversations.length === 0 ? styles.emptyContent : styles.listContent}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No direct messages yet</Text>
            <Text style={styles.emptyBody}>
              Start a conversation from Friends and it will show up here like the web mobile shell.
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    paddingTop: 8,
  },
  searchWrap: {
    height: 30,
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgInput,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 12,
    paddingVertical: 0,
  },
  friendsButton: {
    height: 34,
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
    position: 'relative',
  },
  friendsButtonText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 2,
  },
  pendingBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.accentBlue,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.badgeBg,
  },
  pendingBadgeText: {
    color: Colors.badgeText,
    fontSize: 10,
    fontWeight: '700',
  },
  sectionHeader: {
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 3,
  },
  rowSelected: {
    backgroundColor: Colors.bgSecondary,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  rowSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentRed,
    borderWidth: 1,
    borderColor: Colors.accentRed,
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyBody: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
})
