export type DmRtcSignalTag = 'Offer' | 'Answer' | 'IceCandidate' | 'Bye'

type SignalKind = 'audio'

export type OfferPayload = {
  type: 'offer'
  sdp: string
  kind?: SignalKind
}

export type AnswerPayload = {
  type: 'answer'
  sdp: string
  kind?: SignalKind
}

export type IcePayload = {
  type: 'ice'
  candidate: string
  sdpMid?: string | null
  sdpMLineIndex?: number | null
  usernameFragment?: string | null
  kind?: SignalKind
}

export type ByePayload = {
  type: 'bye'
  kind?: SignalKind
}

export type DmRtcPayload = OfferPayload | AnswerPayload | IcePayload | ByePayload

export function parseRtcPayload(payload: string): DmRtcPayload | null {
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>
    if (typeof parsed.type !== 'string') {
      return null
    }

    switch (parsed.type) {
      case 'offer':
        return typeof parsed.sdp === 'string' ? { type: 'offer', sdp: parsed.sdp, kind: 'audio' } : null
      case 'answer':
        return typeof parsed.sdp === 'string' ? { type: 'answer', sdp: parsed.sdp, kind: 'audio' } : null
      case 'ice':
        return typeof parsed.candidate === 'string'
          ? {
            type: 'ice',
            candidate: parsed.candidate,
            sdpMid: typeof parsed.sdpMid === 'string' || parsed.sdpMid == null ? (parsed.sdpMid as string | null | undefined) : undefined,
            sdpMLineIndex: typeof parsed.sdpMLineIndex === 'number' || parsed.sdpMLineIndex == null ? (parsed.sdpMLineIndex as number | null | undefined) : undefined,
            usernameFragment: typeof parsed.usernameFragment === 'string' || parsed.usernameFragment == null
              ? (parsed.usernameFragment as string | null | undefined)
              : undefined,
            kind: 'audio',
          }
          : null
      case 'bye':
        return { type: 'bye', kind: 'audio' }
      default:
        return null
    }
  } catch {
    return null
  }
}

export function stringifyOfferPayload(sdp: string): string {
  return JSON.stringify({ type: 'offer', sdp, kind: 'audio' } satisfies OfferPayload)
}

export function stringifyAnswerPayload(sdp: string): string {
  return JSON.stringify({ type: 'answer', sdp, kind: 'audio' } satisfies AnswerPayload)
}

export function stringifyIcePayload(payload: Omit<IcePayload, 'type'>): string {
  return JSON.stringify({ type: 'ice', ...payload })
}

export function stringifyByePayload(): string {
  return JSON.stringify({ type: 'bye', kind: 'audio' } satisfies ByePayload)
}

export function rtcSignalTag(value: unknown): DmRtcSignalTag | null {
  if (typeof value === 'string') {
    return isRtcSignalTag(value) ? value : null
  }

  if (typeof value === 'object' && value !== null) {
    const enumLike = value as Record<string, unknown>
    const tag = enumLike.tag
    if (typeof tag === 'string' && isRtcSignalTag(tag)) {
      return tag
    }
  }

  return null
}

function isRtcSignalTag(value: string): value is DmRtcSignalTag {
  return value === 'Offer' || value === 'Answer' || value === 'IceCandidate' || value === 'Bye'
}
