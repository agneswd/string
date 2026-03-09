import type { UserId, ConversationId, EpochMs } from '../../shared/types/common'
export type { UserId, ConversationId, EpochMs }

/** A single direct-message conversation entry shown in the DM list. */
export interface DmConversation {
  id: ConversationId
  peerId: UserId
  peerName: string
  avatarUri?: string
  profileColor?: string | null
  /** Snippet of the most recent message, or null when no messages yet. */
  lastMessageText: string | null
  /** Timestamp of the most recent message activity. */
  lastActivityAt: EpochMs | null
  /** Number of unread messages (0 = no badge). */
  unreadCount: number
}

/** A single message inside a DM thread. */
export interface ChatMessage {
  id: string
  conversationId: ConversationId
  senderId: UserId
  text: string
  sentAt: EpochMs
  kind: 'message' | 'system'
  systemLabel?: string
  /** Optimistic messages are pending server acknowledgement. */
  pending?: boolean
}

/** Parameters passed to the ChatScreen. Kept navigation-framework-agnostic. */
export interface ChatScreenParams {
  conversationId: ConversationId
  peerName: string
}
