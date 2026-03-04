import { useState, useMemo, useCallback } from 'react'
import type { Identity } from 'spacetimedb/sdk'

import type { AppData } from './useAppData'
import {
  toIdKey,
  identityToString,
  readRuntimeRows,
  getObjectField,
  statusToLabel,
} from '../lib/helpers'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FriendEntry {
  id: string
  identity: Identity
  username: string
  displayName: string
  status: string
}

export interface FriendRequestEntry {
  id: string
  rawRequestId: unknown
  username: string
}

export interface FriendsData {
  friendRequestUsername: string
  setFriendRequestUsername: (value: string) => void
  friendRows: unknown[]
  incomingFriendRequestRows: unknown[]
  outgoingFriendRequestRows: unknown[]
  friends: FriendEntry[]
  incomingFriendRequests: FriendRequestEntry[]
  outgoingFriendRequests: FriendRequestEntry[]
  friendIdentityById: Map<string, Identity>
  incomingFriendRequestIdById: Map<string, unknown>
  outgoingFriendRequestIdById: Map<string, unknown>
  onSendFriendRequest: (targetUsername: string) => void
  onAcceptFriendRequest: (requestId: string | number) => void
  onDeclineFriendRequest: (requestId: string | number) => void
  onCancelOutgoingFriendRequest: (requestId: string | number) => void
  onRemoveFriend: (friendId: string | number) => void
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFriends(
  appData: AppData,
  runAction: (fn: () => Promise<void>, successStatus?: string) => Promise<void>,
  callActionOrReducer: <TParams extends Record<string, unknown>>(
    actionFn: ((params: TParams) => Promise<void>) | undefined,
    reducerName: string,
    params: TParams,
  ) => Promise<void>,
): FriendsData {
  const { extendedState, extendedActions, identityString, usersByIdentity, state } = appData

  const [friendRequestUsername, setFriendRequestUsername] = useState('')

  // -- Raw rows -----------------------------------------------------------

  const friendRows = useMemo(() => {
    const fromState = extendedState.myFriends ?? extendedState.friends
    if (Array.isArray(fromState)) {
      return fromState
    }

    return readRuntimeRows('my_friends')
  }, [extendedState.friends, extendedState.myFriends, state.connectionStatus, state.users])

  const incomingFriendRequestRows = useMemo(() => {
    const fromState = extendedState.myFriendRequestsIncoming ?? extendedState.incomingFriendRequests
    if (Array.isArray(fromState)) {
      return fromState
    }

    return readRuntimeRows('my_friend_requests_incoming')
  }, [
    extendedState.incomingFriendRequests,
    extendedState.myFriendRequestsIncoming,
    state.connectionStatus,
    state.users,
  ])

  const outgoingFriendRequestRows = useMemo(() => {
    const fromState = extendedState.myFriendRequestsOutgoing ?? extendedState.outgoingFriendRequests
    if (Array.isArray(fromState)) {
      return fromState
    }

    return readRuntimeRows('my_friend_requests_outgoing')
  }, [
    extendedState.myFriendRequestsOutgoing,
    extendedState.outgoingFriendRequests,
    state.connectionStatus,
    state.users,
  ])

  // -- Processed lists ----------------------------------------------------

  const friends = useMemo(
    () =>
      friendRows
        .map((friendRow) => {
          const identity = getObjectField(friendRow, 'identity') as Identity | undefined
          const identityKey = identityToString(identity)
          if (!identity || !identityKey || identityKey === identityString) {
            return null
          }

          const user = usersByIdentity.get(identityKey)
          const usernameField = getObjectField(friendRow, 'username')
          const displayNameField = getObjectField(friendRow, 'displayName', 'display_name')
          const statusField = getObjectField(friendRow, 'status')

          const username =
            typeof usernameField === 'string'
              ? usernameField
              : user?.username ?? identityKey.slice(0, 12)

          const displayName =
            typeof displayNameField === 'string'
              ? displayNameField
              : user?.displayName ?? username

          return {
            id: identityKey,
            identity,
            username,
            displayName,
            status: statusToLabel(statusField ?? user?.status),
          }
        })
        .filter(
          (friend): friend is FriendEntry => friend !== null,
        )
        .sort((left, right) => left.displayName.localeCompare(right.displayName)),
    [friendRows, identityString, usersByIdentity],
  )

  const incomingFriendRequests = useMemo(
    () =>
      incomingFriendRequestRows
        .map((requestRow) => {
          const requestId = getObjectField(
            requestRow,
            'friendRequestId',
            'friend_request_id',
            'requestId',
            'request_id',
            'id',
          )
          if (requestId === undefined) {
            return null
          }

          const senderIdentity = getObjectField(requestRow, 'senderIdentity', 'sender_identity')
          const senderKey = identityToString(senderIdentity)
          const senderUser = usersByIdentity.get(senderKey)

          const usernameField = getObjectField(requestRow, 'senderUsername', 'sender_username', 'username')
          const username =
            typeof usernameField === 'string'
              ? usernameField
              : senderUser?.username ?? senderKey.slice(0, 12) ?? toIdKey(requestId)

          return {
            id: toIdKey(requestId),
            rawRequestId: requestId,
            username,
          }
        })
        .filter(
          (request): request is FriendRequestEntry => request !== null,
        )
        .sort((left, right) => left.username.localeCompare(right.username)),
    [incomingFriendRequestRows, usersByIdentity],
  )

  const outgoingFriendRequests = useMemo(
    () =>
      outgoingFriendRequestRows
        .map((requestRow) => {
          const requestId = getObjectField(
            requestRow,
            'friendRequestId',
            'friend_request_id',
            'requestId',
            'request_id',
            'id',
          )
          if (requestId === undefined) {
            return null
          }

          const recipientIdentity = getObjectField(requestRow, 'recipientIdentity', 'recipient_identity')
          const recipientKey = identityToString(recipientIdentity)
          const recipientUser = usersByIdentity.get(recipientKey)

          const usernameField = getObjectField(
            requestRow,
            'recipientUsername',
            'recipient_username',
            'username',
          )

          const username =
            typeof usernameField === 'string'
              ? usernameField
              : recipientUser?.username ?? recipientKey.slice(0, 12) ?? toIdKey(requestId)

          return {
            id: toIdKey(requestId),
            rawRequestId: requestId,
            username,
          }
        })
        .filter(
          (request): request is FriendRequestEntry => request !== null,
        )
        .sort((left, right) => left.username.localeCompare(right.username)),
    [outgoingFriendRequestRows, usersByIdentity],
  )

  // -- Lookup maps --------------------------------------------------------

  const friendIdentityById = useMemo(
    () => new Map(friends.map((friend) => [friend.id, friend.identity])),
    [friends],
  )

  const incomingFriendRequestIdById = useMemo(
    () => new Map(incomingFriendRequests.map((request) => [request.id, request.rawRequestId])),
    [incomingFriendRequests],
  )

  const outgoingFriendRequestIdById = useMemo(
    () => new Map(outgoingFriendRequests.map((request) => [request.id, request.rawRequestId])),
    [outgoingFriendRequests],
  )

  // -- Callbacks ----------------------------------------------------------

  const onSendFriendRequest = useCallback(
    (targetUsername: string): void => {
      void runAction(
        async () => {
          await callActionOrReducer(extendedActions.sendFriendRequest, 'sendFriendRequest', {
            targetUsername,
          })
          setFriendRequestUsername('')
        },
        'Friend request sent',
      )
    },
    [runAction, callActionOrReducer, extendedActions.sendFriendRequest],
  )

  const onAcceptFriendRequest = useCallback(
    (requestId: string | number): void => {
      const rawRequestId = incomingFriendRequestIdById.get(String(requestId)) ?? requestId
      void runAction(
        () =>
          callActionOrReducer(extendedActions.acceptFriendRequest, 'acceptFriendRequest', {
            requestId: rawRequestId,
          }),
        'Friend request accepted',
      )
    },
    [runAction, callActionOrReducer, extendedActions.acceptFriendRequest, incomingFriendRequestIdById],
  )

  const onDeclineFriendRequest = useCallback(
    (requestId: string | number): void => {
      const rawRequestId = incomingFriendRequestIdById.get(String(requestId)) ?? requestId
      void runAction(
        () =>
          callActionOrReducer(extendedActions.declineFriendRequest, 'declineFriendRequest', {
            requestId: rawRequestId,
          }),
        'Friend request declined',
      )
    },
    [runAction, callActionOrReducer, extendedActions.declineFriendRequest, incomingFriendRequestIdById],
  )

  const onCancelOutgoingFriendRequest = useCallback(
    (requestId: string | number): void => {
      const rawRequestId = outgoingFriendRequestIdById.get(String(requestId)) ?? requestId
      void runAction(
        () =>
          callActionOrReducer(extendedActions.cancelFriendRequest, 'cancelFriendRequest', {
            requestId: rawRequestId,
          }),
        'Friend request canceled',
      )
    },
    [runAction, callActionOrReducer, extendedActions.cancelFriendRequest, outgoingFriendRequestIdById],
  )

  const onRemoveFriend = useCallback(
    (friendId: string | number): void => {
      void runAction(async () => {
        const friendIdentity = friendIdentityById.get(String(friendId))
        if (!friendIdentity) {
          throw new Error('Friend identity not available')
        }

        await callActionOrReducer(extendedActions.removeFriend, 'removeFriend', {
          friendIdentity,
        })
      }, 'Friend removed')
    },
    [runAction, callActionOrReducer, extendedActions.removeFriend, friendIdentityById],
  )

  return {
    friendRequestUsername,
    setFriendRequestUsername,
    friendRows,
    incomingFriendRequestRows,
    outgoingFriendRequestRows,
    friends,
    incomingFriendRequests,
    outgoingFriendRequests,
    friendIdentityById,
    incomingFriendRequestIdById,
    outgoingFriendRequestIdById,
    onSendFriendRequest,
    onAcceptFriendRequest,
    onDeclineFriendRequest,
    onCancelOutgoingFriendRequest,
    onRemoveFriend,
  }
}
