/**
 * Shared chat domain types.
 * Kept in a dedicated file to avoid circular imports between
 * ChatViewPane and ChatMessageRow.
 */

export interface ChatMessageItem {
  id: string | number
  authorName: string
  content: string
  timestamp: string
  authorId?: string | number
  profileColor?: string
  canEditDelete?: boolean
  isSystem?: boolean
}
