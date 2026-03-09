import React, { useCallback, useState } from 'react'
import { Search } from 'lucide-react-native'
import {
  ActivityIndicator,
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { Colors } from '../../../shared/theme/colors'
import { SectionHeader } from '../../../shared/ui/SectionHeader'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { RowSeparator } from '../../../shared/ui/RowSeparator'
import { FriendsAddView } from '../components/FriendsAddView'
import { FriendRow } from '../components/FriendRow'
import { FriendRequestRow } from '../components/FriendRequestRow'
import { FriendsTabBar, type FriendsTabKey } from '../components/FriendsTabBar'
import type { Friend, FriendRequest } from '../types'

interface FriendsScreenProps {
  friends?: Friend[]
  requests?: FriendRequest[]
  isLoading?: boolean
  onOpenDm?: (friendId: string, friendName: string) => void
  onAcceptRequest?: (requestId: FriendRequest['id']) => Promise<void>
  onDeclineRequest?: (requestId: FriendRequest['id']) => Promise<void>
  onCancelRequest?: (requestId: FriendRequest['id']) => Promise<void>
  /** Called when the user submits a username in the Add Friend row. */
  onSendFriendRequest?: (targetUsername: string) => Promise<void>
  /** Called when the user taps Remove on a friend row. */
  onRemoveFriend?: (friendId: string) => Promise<void>
}

/**
 * FriendsScreen
 *
 * Tabbed panel for Online / All friends and Pending requests.
 * Receives `onOpenDm` so navigation coupling lives in the shell.
 * React Native-safe.
 */
export function FriendsScreen({
  friends = [],
  requests = [],
  isLoading = false,
  onOpenDm,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onSendFriendRequest,
  onRemoveFriend,
}: FriendsScreenProps) {
  const [activeTab, setActiveTab] = useState<FriendsTabKey>('online')
  const [showAddFriendView, setShowAddFriendView] = useState(false)
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [addFriendUsername, setAddFriendUsername] = useState('')
  const [addFriendBusy, setAddFriendBusy] = useState(false)
  const [addFriendError, setAddFriendError] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')

  const incomingCount = requests.filter(
    (r) => r.direction === 'incoming',
  ).length

  const handleRequestAction = useCallback(
    async (request: FriendRequest, action?: (requestId: FriendRequest['id']) => Promise<void>) => {
      if (!action) {
        return
      }

      setActiveRequestId(request.id)
      setRequestError(null)

      try {
        await action(request.id)
      } catch (error) {
        setRequestError(error instanceof Error ? error.message : 'Failed to update friend request.')
      } finally {
        setActiveRequestId((current) => (current === request.id ? null : current))
      }
    },
    [],
  )

  const handleAddFriend = useCallback(async () => {
    const username = addFriendUsername.trim()
    if (!username || !onSendFriendRequest) return
    setAddFriendBusy(true)
    setAddFriendError(null)
    try {
      await onSendFriendRequest(username)
      setAddFriendUsername('')
    } catch (error) {
      setAddFriendError(error instanceof Error ? error.message : 'Failed to send friend request.')
    } finally {
      setAddFriendBusy(false)
    }
  }, [addFriendUsername, onSendFriendRequest])

  const displayedFriends =
    activeTab === 'online'
      ? friends.filter((friend) => friend.status === 'online' || friend.status === 'idle')
      : friends

  const normalizedSearch = searchValue.trim().toLowerCase()
  const filteredFriends = normalizedSearch
    ? displayedFriends.filter((friend) => (
      friend.displayName.toLowerCase().includes(normalizedSearch)
      || friend.username.toLowerCase().includes(normalizedSearch)
      || (friend.statusMessage?.toLowerCase().includes(normalizedSearch) ?? false)
    ))
    : displayedFriends

  const filteredRequests = normalizedSearch
    ? requests.filter((request) => (
      request.fromName.toLowerCase().includes(normalizedSearch)
      || request.fromUsername.toLowerCase().includes(normalizedSearch)
    ))
    : requests

  if (isLoading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={Colors.accentBlue} />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <FriendsTabBar
        activeTab={activeTab}
        isAddViewActive={showAddFriendView}
        onSelectTab={(tab) => {
          setShowAddFriendView(false)
          setActiveTab(tab)
        }}
        pendingCount={incomingCount}
        onPressAddFriend={() => {
          setShowAddFriendView(true)
        }}
      />

      {!showAddFriendView ? (
        <View style={styles.searchWrap}>
          <Search color={Colors.textMuted} size={15} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            value={searchValue}
            onChangeText={setSearchValue}
            placeholder="Search"
            placeholderTextColor={Colors.textDisabled}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      ) : null}

      {showAddFriendView ? (
        <FriendsAddView
          username={addFriendUsername}
          busy={addFriendBusy}
          error={addFriendError}
          onChangeUsername={(text) => {
            setAddFriendUsername(text)
            setAddFriendError(null)
          }}
          onSubmit={() => { void handleAddFriend() }}
        />
      ) : null}

      {!showAddFriendView && activeTab !== 'pending' ? (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FriendRow
              friend={item}
              onPress={() => onOpenDm?.(item.id, item.displayName)}
              onMessage={() => onOpenDm?.(item.id, item.displayName)}
              onRemove={onRemoveFriend ? () => { void onRemoveFriend(item.id) } : undefined}
            />
          )}
          ItemSeparatorComponent={RowSeparator}
          ListHeaderComponent={
            <View>
              <SectionHeader title={activeTab === 'online' ? 'Online Friends' : 'All Friends'} trailing={`${filteredFriends.length}`} />
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title={
                activeTab === 'online'
                  ? 'All quiet for now'
                  : 'No friends added yet'
              }
              body={
                activeTab === 'online'
                  ? 'Your online friends will appear here.'
                  : 'Add friends to stay in touch.'
              }
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : !showAddFriendView ? (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FriendRequestRow
              request={item}
              busy={activeRequestId === item.id}
              onAccept={() => {
                void handleRequestAction(item, onAcceptRequest)
              }}
              onDecline={() => {
                void handleRequestAction(item, onDeclineRequest)
              }}
              onCancel={() => {
                void handleRequestAction(item, onCancelRequest)
              }}
            />
          )}
          ItemSeparatorComponent={RowSeparator}
          ListHeaderComponent={
            <View>
              <SectionHeader title="Friend Requests" trailing={`${filteredRequests.length}`} />
              {requestError ? <Text style={styles.errorText}>{requestError}</Text> : null}
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title="No pending requests"
              body="Friend requests will appear here."
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  searchWrap: {
    height: 32,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 2,
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
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  listContent: {
    paddingBottom: 32,
  },
  errorText: {
    color: Colors.accentRed,
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
})
