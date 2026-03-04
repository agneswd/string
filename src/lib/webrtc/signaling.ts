export type SignalKind = 'audio' | 'screen';

export type OfferPayload = {
  type: 'offer';
  sdp: string;
  kind?: SignalKind;
};

export type AnswerPayload = {
  type: 'answer';
  sdp: string;
  kind?: SignalKind;
};

export type IcePayload = {
  type: 'ice';
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
  kind?: SignalKind;
};

export type ByePayload = {
  type: 'bye';
  kind?: SignalKind;
};

export type SignalingPayload =
  | OfferPayload
  | AnswerPayload
  | IcePayload
  | ByePayload;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseKind(value: unknown): SignalKind | undefined | null {
  if (value === undefined) return undefined;
  if (value === 'audio' || value === 'screen') return value;
  return null;
}

function parseOptionalNullableString(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return value;
  return typeof value === 'string' ? value : undefined;
}

function parseOptionalNullableNumber(value: unknown): number | null | undefined {
  if (value === undefined || value === null) return value;
  return typeof value === 'number' ? value : undefined;
}

function parsePayloadObject(value: unknown): SignalingPayload | null {
  if (!isRecord(value) || typeof value.type !== 'string') return null;

  const kind = parseKind(value.kind);
  if (kind === null) return null;

  switch (value.type) {
    case 'offer':
      if (typeof value.sdp !== 'string') return null;
      return { type: 'offer', sdp: value.sdp, ...(kind ? { kind } : {}) };

    case 'answer':
      if (typeof value.sdp !== 'string') return null;
      return { type: 'answer', sdp: value.sdp, ...(kind ? { kind } : {}) };

    case 'ice': {
      if (typeof value.candidate !== 'string') return null;

      const sdpMid = parseOptionalNullableString(value.sdpMid);
      const sdpMLineIndex = parseOptionalNullableNumber(value.sdpMLineIndex);
      const usernameFragment = parseOptionalNullableString(value.usernameFragment);

      if (
        (value.sdpMid !== undefined && sdpMid === undefined) ||
        (value.sdpMLineIndex !== undefined && sdpMLineIndex === undefined) ||
        (value.usernameFragment !== undefined && usernameFragment === undefined)
      ) {
        return null;
      }

      return {
        type: 'ice',
        candidate: value.candidate,
        ...(sdpMid !== undefined ? { sdpMid } : {}),
        ...(sdpMLineIndex !== undefined ? { sdpMLineIndex } : {}),
        ...(usernameFragment !== undefined ? { usernameFragment } : {}),
        ...(kind ? { kind } : {}),
      };
    }

    case 'bye':
      return { type: 'bye', ...(kind ? { kind } : {}) };

    default:
      return null;
  }
}

export function parseSignalingPayload(payload: string): SignalingPayload | null {
  try {
    return parsePayloadObject(JSON.parse(payload));
  } catch {
    return null;
  }
}

export function parseOfferPayload(payload: string): OfferPayload | null {
  const parsed = parseSignalingPayload(payload);
  return parsed?.type === 'offer' ? parsed : null;
}

export function parseAnswerPayload(payload: string): AnswerPayload | null {
  const parsed = parseSignalingPayload(payload);
  return parsed?.type === 'answer' ? parsed : null;
}

export function parseIcePayload(payload: string): IcePayload | null {
  const parsed = parseSignalingPayload(payload);
  return parsed?.type === 'ice' ? parsed : null;
}

export function parseByePayload(payload: string): ByePayload | null {
  const parsed = parseSignalingPayload(payload);
  return parsed?.type === 'bye' ? parsed : null;
}

export function stringifySignalingPayload(payload: SignalingPayload): string {
  return JSON.stringify(payload);
}

export function stringifyOfferPayload(sdp: string, kind?: SignalKind): string {
  return stringifySignalingPayload({ type: 'offer', sdp, ...(kind ? { kind } : {}) });
}

export function stringifyAnswerPayload(sdp: string, kind?: SignalKind): string {
  return stringifySignalingPayload({ type: 'answer', sdp, ...(kind ? { kind } : {}) });
}

export type IcePayloadFields = Omit<IcePayload, 'type'>;

export function stringifyIcePayload(payload: IcePayloadFields): string {
  return stringifySignalingPayload({ type: 'ice', ...payload });
}

export function stringifyByePayload(kind?: SignalKind): string {
  return stringifySignalingPayload({ type: 'bye', ...(kind ? { kind } : {}) });
}
