/**
 * Shared primitive types used across features.
 * React Native-safe – no DOM APIs.
 */

/** Opaque string alias for a SpacetimeDB / Clerk user identity. */
export type UserId = string

/** Opaque string alias for a conversation/channel identifier. */
export type ConversationId = string

/** Unix epoch milliseconds timestamp. */
export type EpochMs = number
