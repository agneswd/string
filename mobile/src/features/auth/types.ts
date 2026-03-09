import type { UserId } from '../../shared/types/common'

/** Lifecycle state of the auth session. */
export type AuthStatus = 'loading' | 'signed-in' | 'signed-out' | 'error'

/** The resolved session when a user is signed in. */
export interface SignedInSession {
  status: 'signed-in'
  userId: UserId
  /** Raw token forwarded to SpacetimeDB on connection. */
  token: string
  /** Display name sourced from the auth provider. */
  displayName: string
  /** Primary email sourced from Clerk when available. */
  email: string | null
}

/** Union of all possible session states. */
export type AuthSession =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'error'; message: string }
  | SignedInSession
