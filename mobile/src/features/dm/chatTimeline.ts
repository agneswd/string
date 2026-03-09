import type { DmCallEvent, DmMessage, DmParticipant, User } from '../../module_bindings/types'
import type { ChatMessage } from './types'

interface BuildChatTimelineParams {
  conversationId: string
  currentUserId: string
  activeDmChannelId: unknown | null
  dmMessages: DmMessage[]
  dmCallEvents: DmCallEvent[]
  dmParticipants: DmParticipant[]
  users: User[]
}

export function buildChatTimeline({
  conversationId,
  currentUserId,
  activeDmChannelId,
  dmMessages,
  dmCallEvents,
  dmParticipants,
  users,
}: BuildChatTimelineParams): ChatMessage[] {
  if (!activeDmChannelId) {
    return []
  }

  const channelKey = toIdKey(activeDmChannelId)
  const usersByIdentity = new Map(users.map((user) => [identityToString(user.identity), user]))
  const otherParticipantName = resolveOtherParticipantName({
    channelKey,
    currentUserId,
    dmParticipants,
    usersByIdentity,
  })

  const messageTimeline = dmMessages
    .filter((message) => toIdKey(message.dmChannelId) === channelKey && !message.isDeleted)
    .sort((left, right) => compareTimelineItems(
      timestampToMillis(left.sentAt),
      toBigInt(left.dmMessageId),
      timestampToMillis(right.sentAt),
      toBigInt(right.dmMessageId),
    ))
    .map<ChatMessage>((message) => ({
      id: toIdKey(message.dmMessageId),
      conversationId,
      senderId: identityToString(message.authorIdentity),
      text: message.content,
      sentAt: timestampToMillis(message.sentAt),
      kind: 'message',
    }))

  const callTimeline = dmCallEvents
    .filter((event) => toIdKey(event.dmChannelId) === channelKey)
    .map<ChatMessage>((event) => {
      const actorId = identityToString(event.actorIdentity)
      const actorName = usersByIdentity.get(actorId)?.displayName
        ?? usersByIdentity.get(actorId)?.username
        ?? actorId.slice(0, 12)

      return {
        id: `call-event:${toIdKey(event.eventId)}`,
        conversationId,
        senderId: 'system',
        text: formatCallEventText({
          eventType: String(event.eventType),
          actorId,
          actorName,
          currentUserId,
          otherParticipantName,
          durationSeconds: event.durationSeconds,
        }),
        sentAt: timestampToMillis(event.createdAt),
        kind: 'system',
        systemLabel: 'CALL',
      }
    })

  return [...messageTimeline, ...callTimeline].sort((left, right) => compareTimelineItems(
    left.sentAt,
    extractSortId(left.id),
    right.sentAt,
    extractSortId(right.id),
  ))
}

function resolveOtherParticipantName({
  channelKey,
  currentUserId,
  dmParticipants,
  usersByIdentity,
}: {
  channelKey: string
  currentUserId: string
  dmParticipants: DmParticipant[]
  usersByIdentity: Map<string, User>
}): string {
  const otherParticipant = dmParticipants.find((participant) => (
    toIdKey(participant.dmChannelId) === channelKey && identityToString(participant.identity) !== currentUserId
  ))

  if (!otherParticipant) {
    return 'Someone'
  }

  const otherId = identityToString(otherParticipant.identity)
  const otherUser = usersByIdentity.get(otherId)
  return otherUser?.displayName ?? otherUser?.username ?? otherId.slice(0, 12)
}

function formatCallEventText({
  eventType,
  actorId,
  actorName,
  currentUserId,
  otherParticipantName,
  durationSeconds,
}: {
  eventType: string
  actorId: string
  actorName: string
  currentUserId: string
  otherParticipantName: string
  durationSeconds: unknown
}): string {
  switch (eventType) {
    case 'started':
      return `${actorName} started a call`
    case 'missed':
      return actorId === currentUserId
        ? `${otherParticipantName} tried to call you`
        : `${actorName} didn’t pick up`
    case 'canceled':
      return actorId === currentUserId
        ? 'You canceled the call'
        : `${actorName} canceled the call`
    case 'ended': {
      const seconds = toDurationSeconds(durationSeconds)
      return seconds > 0 ? `Call ended after ${formatDuration(seconds)}` : 'Call ended'
    }
    default:
      return 'Call activity'
  }
}

function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  const parts: string[] = []
  if (hours > 0) {
    parts.push(`${hours} hour${hours === 1 ? '' : 's'}`)
  }
  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`)
  }
  if (parts.length === 0 || (hours === 0 && minutes === 0 && remainingSeconds > 0)) {
    parts.push(`${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}`)
  }

  if (parts.length < 2) {
    return parts[0] ?? '0 seconds'
  }

  const tail = parts.pop()
  return `${parts.join(', ')} and ${tail}`
}

function compareTimelineItems(leftTime: number, leftId: bigint | null, rightTime: number, rightId: bigint | null): number {
  if (leftTime !== rightTime) {
    return leftTime - rightTime
  }

  if (leftId !== null && rightId !== null && leftId !== rightId) {
    return leftId < rightId ? -1 : 1
  }

  return 0
}

function extractSortId(id: string): bigint | null {
  const numeric = id.includes(':') ? id.split(':').at(-1) ?? id : id
  return toBigInt(numeric)
}

function toDurationSeconds(value: unknown): number {
  const numeric = toBigInt(value)
  return numeric === null ? 0 : Number(numeric)
}

function toBigInt(value: unknown): bigint | null {
  if (typeof value === 'bigint') {
    return value
  }

  if (typeof value === 'number' && Number.isInteger(value)) {
    return BigInt(value)
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return BigInt(value)
  }

  return null
}

function toIdKey(value: unknown): string {
  if (typeof value === 'bigint') {
    return value.toString()
  }

  return String(value)
}

function identityToString(value: unknown): string {
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

function timestampToMillis(value: unknown): number {
  if (typeof value === 'object' && value !== null) {
    const withToDate = value as { toDate?: () => Date }
    const maybeDate = withToDate.toDate?.()
    if (maybeDate instanceof Date) {
      return maybeDate.getTime()
    }
  }

  const parsed = new Date(String(value)).getTime()
  return Number.isFinite(parsed) ? parsed : Date.now()
}
