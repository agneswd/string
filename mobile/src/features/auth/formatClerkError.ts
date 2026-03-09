interface ClerkErrorItemLike {
  longMessage?: string
  message?: string
  code?: string
}

interface ClerkErrorLike {
  longMessage?: string
  message?: string
  errors?: ClerkErrorItemLike[]
}

export function formatClerkError(
  error: unknown,
  fallbackMessage: string,
) {
  if (!error || typeof error !== 'object') {
    return fallbackMessage
  }

  const maybeClerkError = error as ClerkErrorLike
  const firstNestedMessage = maybeClerkError.errors
    ?.map((item) => item.longMessage?.trim() || item.message?.trim() || item.code?.trim())
    .find((value): value is string => Boolean(value))

  return maybeClerkError.longMessage?.trim()
    || maybeClerkError.message?.trim()
    || firstNestedMessage
    || fallbackMessage
}