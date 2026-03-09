export const CLERK_PUBLISHABLE_KEY_ENV_VAR =
  'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'

interface ClerkPrimaryEmailAddressLike {
  emailAddress: string
}

interface ClerkUserLike {
  fullName?: string | null
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  primaryEmailAddress?: ClerkPrimaryEmailAddressLike | null
}

export function resolveClerkPublishableKey(
  env: Record<string, string | undefined> = process.env,
) {
  const publishableKey = (
    env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
    ?? process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
  )?.trim()

  if (!publishableKey) {
    throw new Error(
      `Missing ${CLERK_PUBLISHABLE_KEY_ENV_VAR}. Set it in mobile/.env or your Expo runtime environment before starting the app.`,
    )
  }

  return publishableKey
}

export function resolveClerkDisplayName(user: ClerkUserLike | null | undefined) {
  const fullName = user?.fullName?.trim()

  if (fullName) {
    return fullName
  }

  const firstAndLastName = [user?.firstName, user?.lastName]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim())
    .join(' ')

  if (firstAndLastName) {
    return firstAndLastName
  }

  const username = user?.username?.trim()

  if (username) {
    return username
  }

  const emailAddress = user?.primaryEmailAddress?.emailAddress?.trim()

  if (emailAddress) {
    return emailAddress
  }

  return 'Signed in user'
}

export function isLocalDevelopmentHost(hostname?: string | null) {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

export function isLiveClerkKey(publishableKey: string) {
  return publishableKey.startsWith('pk_live_')
}