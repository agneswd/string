import type { Identity } from 'spacetimedb/sdk'

import type { Channel, DmChannel, DmMessage, DmParticipant, Reaction, RtcSignal } from '../module_bindings/types'
import { getConn } from './connection'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Tag literals for RTC signal type enum construction. */
export const RTC_SIGNAL_TYPE_TAGS = ['Offer', 'Answer', 'IceCandidate', 'Bye'] as const
export type RtcSignalTypeTag = (typeof RTC_SIGNAL_TYPE_TAGS)[number]

/** Tag literals for channel-type enum construction. */
export const CHANNEL_TYPE_TAGS = ['Category', 'Text', 'Voice'] as const
export type ChannelTypeTag = (typeof CHANNEL_TYPE_TAGS)[number]

/** Minimal duck-type for a runtime table that exposes `.iter()`. */
export type RuntimeTableLike = {
  iter?: () => IterableIterator<unknown>
}

/** Extended state shape surfaced by App for DM / friend features. */
export type AppExtendedState = {
  dmChannels?: DmChannel[]
  dmParticipants?: DmParticipant[]
  dmMessages?: DmMessage[]
  reactions?: Reaction[]
  myFriends?: unknown[]
  friends?: unknown[]
  myFriendRequestsIncoming?: unknown[]
  incomingFriendRequests?: unknown[]
  myFriendRequestsOutgoing?: unknown[]
  outgoingFriendRequests?: unknown[]
}

/** Extended action callbacks surfaced by App for DM / friend features. */
export type AppExtendedActions = {
  createDmChannel?: (params: { participants: Identity[]; title?: string }) => Promise<void>
  sendDmMessage?: (params: { dmChannelId: unknown; content: string; replyTo: unknown }) => Promise<void>
  toggleReaction?: (params: { messageId: unknown; emoji: string }) => Promise<void>
  joinGuild?: (params: { guildName: string }) => Promise<void>
  sendFriendRequest?: (params: { targetUsername: string }) => Promise<void>
  acceptFriendRequest?: (params: { requestId: unknown }) => Promise<void>
  declineFriendRequest?: (params: { requestId: unknown }) => Promise<void>
  cancelFriendRequest?: (params: { requestId: unknown }) => Promise<void>
  removeFriend?: (params: { friendIdentity: Identity }) => Promise<void>
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/** Convert a bigint (or any value) to a string suitable for use as a key. */
export const toIdKey = (value: unknown): string => {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  return String(value)
}

/** Extract a hex string representation from an Identity-like value. */
export const identityToString = (value: unknown): string => {
  if (!value) {
    return ''
  }

  if (typeof value === 'object') {
    const withToHex = value as { toHex?: () => { toString: () => string } }
    const hex = withToHex.toHex?.()
    if (hex) {
      return hex.toString()
    }
  }

  return String(value)
}

/** Check whether a channel-type enum value matches the given variant tag. */
export const isChannelVariant = (value: unknown, variant: 'Text' | 'Voice'): boolean => {
  if (value === variant) {
    return true
  }

  if (typeof value !== 'object' || value === null) {
    return false
  }

  const enumLike = value as Record<string, unknown>
  if (enumLike.tag === variant) {
    return true
  }

  return variant in enumLike
}

/** Returns `true` if `channel` is a Text channel. */
export const isTextChannel = (channel: Channel): boolean => isChannelVariant(channel.channelType, 'Text')

/** Returns `true` if `channel` is a Voice channel. */
export const isVoiceChannel = (channel: Channel): boolean => isChannelVariant(channel.channelType, 'Voice')

/** Returns `true` if `channel` is a Category channel. */
export const isCategoryChannel = (channel: Channel): boolean => isChannelVariant(channel.channelType, 'Category')

/** Parse any value to a BigInt for sorting, or `null` if not convertible. */
export const toSortableBigInt = (value: unknown): bigint | null => {
  if (typeof value === 'bigint') {
    return value
  }

  if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value)) {
    return BigInt(value)
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return BigInt(value)
  }

  return null
}

/** Comparator that sorts by numeric (bigint) id, falling back to string compare. */
export const compareById = (left: unknown, right: unknown): number => {
  const leftBigInt = toSortableBigInt(left)
  const rightBigInt = toSortableBigInt(right)

  if (leftBigInt !== null && rightBigInt !== null) {
    if (leftBigInt < rightBigInt) {
      return -1
    }
    if (leftBigInt > rightBigInt) {
      return 1
    }
    return 0
  }

  return String(left).localeCompare(String(right))
}

/** Format a timestamp-like value to a locale time string. */
export const formatTimestamp = (value: unknown): string => {
  if (!value) {
    return '-'
  }

  if (typeof value === 'object') {
    const withToDate = value as { toDate?: () => Date }
    const date = withToDate.toDate?.()
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString()
    }
  }

  const parsed = new Date(String(value))
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString()
  }

  return String(value)
}

/** Convert an unknown error value to a human-readable message string. */
export const errorToString = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

/** Extract a human-readable label from a status enum value. */
export const statusToLabel = (value: unknown): string => {
  if (!value) {
    return 'Unknown'
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'object') {
    const enumLike = value as Record<string, unknown>
    if (typeof enumLike.tag === 'string') {
      return enumLike.tag
    }

    const keys = Object.keys(enumLike)
    if (keys.length > 0) {
      return keys[0]
    }
  }

  return String(value)
}

/** Read all rows from a runtime DB table by name.  Returns `[]` on error. */
export const readRuntimeRows = (tableName: string): unknown[] => {
  try {
    const db = getConn().db as unknown as Record<string, RuntimeTableLike | undefined>
    const table = db[tableName]

    if (!table?.iter) {
      return []
    }

    return Array.from(table.iter())
  } catch {
    return []
  }
}

/** Safely access a field from an object, trying each candidate key in order. */
export const getObjectField = (value: unknown, ...candidateKeys: string[]): unknown => {
  if (typeof value !== 'object' || value === null) {
    return undefined
  }

  const record = value as Record<string, unknown>
  for (const key of candidateKeys) {
    if (key in record) {
      return record[key]
    }
  }

  return undefined
}

/** Construct an `RtcSignal['signalType']` enum variant from a tag string. */
export const toRtcSignalType = (tag: RtcSignalTypeTag): RtcSignal['signalType'] => ({ tag })

/** Construct a `Channel['channelType']` enum variant from a tag string. */
export const toChannelType = (tag: ChannelTypeTag): Channel['channelType'] => ({ tag })

/** Describe whether an RTC signal is incoming or outgoing relative to the given identity. */
export function describeSignalDirection(signal: RtcSignal, identity: string): string {
  if (identityToString(signal.recipientIdentity) === identity) {
    return 'incoming'
  }
  return 'outgoing'
}
