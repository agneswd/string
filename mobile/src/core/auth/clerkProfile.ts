import type { SignedInSession } from '../../features/auth/types'

function sanitizeUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '')
}

function getEmailLocalPart(email?: string | null): string {
  if (!email) {
    return ''
  }

  return email.split('@')[0] ?? ''
}

export function buildStableSpacetimeUsername(session: SignedInSession) {
  const preferred = sanitizeUsername(getEmailLocalPart(session.email) || session.displayName)
  const suffix = session.userId.replace(/^user_/, '').toLowerCase().slice(-8) || 'string'

  if (preferred.length >= 1 && preferred.length <= 32) {
    return preferred
  }

  const truncatedBase = (preferred || 'user').slice(0, Math.max(1, 32 - suffix.length - 1))
  return `${truncatedBase}-${suffix}`
}

export function buildSpacetimeDisplayName(session: SignedInSession) {
  const displayName = session.displayName.trim() || getEmailLocalPart(session.email) || 'String user'
  return displayName.slice(0, 64)
}

export function isRecoverableRegistrationError(message: string) {
  return message.includes('already taken') || message.includes('No user named')
}
