import type { RtcSignal, VoiceState } from '../../../module_bindings/types'
import type { MobileCallPeer } from '../hooks/useMobileCallState'

export interface UseDmRtcMediaParams {
  identity: string | null
  activeDmChannelId: unknown | null
  currentCallPeer: MobileCallPeer | null
  outgoingCallActive: boolean
  incomingCallActive: boolean
  voiceStates: VoiceState[]
  rtcSignals: RtcSignal[]
  isMuted: boolean
  sendDmRtcSignal: (params: {
    dmChannelId: unknown
    recipientIdentity: unknown
    signalType: unknown
    payload: string
  }) => Promise<void>
  ackRtcSignal: (signalId: unknown) => Promise<void>
  onError?: (message: string | null) => void
}

export interface UseDmRtcMediaResult {
  rtcReady: boolean
  rtcError: string | null
}
