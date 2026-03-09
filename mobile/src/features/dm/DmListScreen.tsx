import React from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Colors } from '../../shared/theme/colors'
import { Avatar } from '../../shared/ui/Avatar'
import { EmptyState } from '../../shared/ui/EmptyState'
import { useDmList } from './useDmList'
import type { DmConversation, ChatScreenParams } from './types'

interface DmListScreenProps {
  /**
   * Called when the user taps a conversation row.
   * Kept as a plain callback so this screen is navigation-framework-agnostic;
   * the navigation shell passes its own `navigation.navigate` here.
   */
  onOpenConversation: (params: ChatScreenParams) => void
  showHeading?: boolean
}

function ConversationRow({
  item,
  onPress,
}: {
  item: DmConversation
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Avatar
        name={item.peerName}
        seed={item.peerId}
        size={44}
        uri={item.avatarUri}
        backgroundColor={item.profileColor ?? undefined}
      />
      <View style={styles.rowContent}>
        <View style={styles.rowHeader}>
          <Text style={styles.peerName} numberOfLines={1}>
            {item.peerName}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
        {item.lastMessageText ? (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessageText}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

/**
 * DmListScreen
 *
 * Displays the current user's direct-message conversations.
 * Receives `onOpenConversation` so navigation coupling lives in the shell.
 * React Native-safe – no DOM APIs.
 */
export function DmListScreen({ onOpenConversation, showHeading = true }: DmListScreenProps) {
  const { conversations, isLoading, error, refresh } = useDmList()

  if (isLoading) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator color={Colors.accentBlue} />
      </View>
    )
  }

  if (error) {
    return (
      <EmptyState title="Could not load messages" body={error} />
    )
  }

  return (
    <View style={styles.root}>
      {showHeading ? <Text style={styles.heading}>Direct Messages</Text> : null}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationRow
            item={item}
            onPress={() =>
              onOpenConversation({
                conversationId: item.id,
                peerName: item.peerName,
              })
            }
          />
        )}
        onRefresh={refresh}
        refreshing={isLoading}
        contentContainerStyle={
          conversations.length === 0 ? styles.emptyContainer : undefined
        }
        ListEmptyComponent={
          <EmptyState
            title="No messages yet"
            body="Open a friend's profile to start a conversation."
          />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  heading: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderSubtle,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  peerName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  lastMessage: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  badge: {
    backgroundColor: Colors.badgeBg,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.accentBlue,
    minWidth: 20,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  badgeText: {
    color: Colors.badgeText,
    fontSize: 10,
    fontWeight: '700',
  },
})
