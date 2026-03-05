import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Identity } from 'spacetimedb/sdk'

import type { RtcSignal, VoiceState } from '../module_bindings/types'
import type { AppData } from './useAppData'
import type { IncomingRtcSignal } from '../lib/webrtc/useRtcOrchestrator'
import {
  toIdKey,
  identityToString,
  toRtcSignalType,
  compareById,
  errorToString,
} from '../lib/helpers'
import type { RtcSignalTypeTag } from '../lib/helpers'
import { RTC_SIGNAL_TYPE_TAGS } from '../lib/helpers'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RtcRecipient {
  id: string
  identity: Identity
  label: string
}

export interface RtcSignalingResult {
  // Debug state
  rtcRecipientId: string
  setRtcRecipientId: (id: string) => void
  rtcSignalTypeTag: RtcSignalTypeTag
  setRtcSignalTypeTag: (tag: RtcSignalTypeTag) => void
  rtcPayload: string
  setRtcPayload: (payload: string) => void

  // Memos
  incomingRtcSignals: RtcSignal[]
  latestIncomingSignal: RtcSignal | null
  selectedRtcRecipient: RtcRecipient | null
  rtcRecipientSelectValue: string
  rtcPayloadRequired: boolean
  canSendRtcDebugSignal: boolean

  // Callbacks
  onAckLatestSignal: () => void
  onSendRtcDebugSignal: () => void
}

// Max number of signal IDs to retain in handled/processing sets
const MAX_SIGNAL_SET_SIZE = 500

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRtcSignaling({
  appData,
  currentVoiceState,
  rtcRecipients,
  sendSignal,
  handleIncomingSignal,
  actions,
  setActionError,
  runAction,
}: {
  appData: AppData
  currentVoiceState: VoiceState | null | undefined
  rtcRecipients: RtcRecipient[]
  sendSignal: (params: { peerId: string; signalType: RtcSignalTypeTag; payload: string }) => void
  handleIncomingSignal: (signal: IncomingRtcSignal) => Promise<void>
  actions: AppData['actions']
  setActionError: (err: string | null) => void
  runAction: (fn: () => Promise<void>, successStatus?: string) => Promise<void>
}): RtcSignalingResult {
  const { identityString, state } = appData

  // -------------------------------------------------------------------------
  // Debug state
  // -------------------------------------------------------------------------
  const [rtcRecipientId, setRtcRecipientId] = useState('')
  const [rtcSignalTypeTag, setRtcSignalTypeTag] = useState<RtcSignalTypeTag>('Offer')
  const [rtcPayload, setRtcPayload] = useState('')

  // -------------------------------------------------------------------------
  // Refs
  // -------------------------------------------------------------------------
  const handledRtcSignalIdsRef = useRef<Set<string>>(new Set())
  const processingRtcSignalIdsRef = useRef<Set<string>>(new Set())

  // -------------------------------------------------------------------------
  // Memos
  // -------------------------------------------------------------------------
  const incomingRtcSignals = useMemo(
    () =>
      state.myRtcSignals.filter(
        (signal) => identityToString(signal.recipientIdentity) === identityString,
      ),
    [identityString, state.myRtcSignals],
  )

  const latestIncomingSignal = useMemo(() => {
    if (incomingRtcSignals.length === 0) {
      return null
    }

    const sorted = incomingRtcSignals.slice().sort((left, right) => compareById(right.signalId, left.signalId))
    return sorted[0] ?? null
  }, [incomingRtcSignals])

  const selectedRtcRecipient = useMemo(
    () => rtcRecipients.find((candidate) => candidate.id === rtcRecipientId) ?? rtcRecipients[0] ?? null,
    [rtcRecipientId, rtcRecipients],
  )

  const rtcRecipientSelectValue = selectedRtcRecipient?.id ?? ''

  const rtcPayloadRequired = rtcSignalTypeTag !== 'Bye'
  const canSendRtcDebugSignal =
    Boolean(currentVoiceState) &&
    Boolean(selectedRtcRecipient) &&
    (!rtcPayloadRequired || rtcPayload.trim().length > 0)

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  // Prune stale handled/processing signal IDs + enforce max size
  useEffect(() => {
    const incomingIds = new Set(incomingRtcSignals.map((signal) => toIdKey(signal.signalId)))
    for (const id of handledRtcSignalIdsRef.current) {
      if (!incomingIds.has(id)) {
        handledRtcSignalIdsRef.current.delete(id)
      }
    }
    for (const id of processingRtcSignalIdsRef.current) {
      if (!incomingIds.has(id)) {
        processingRtcSignalIdsRef.current.delete(id)
      }
    }
    // Enforce max size by pruning oldest entries (Set iteration order = insertion order)
    if (handledRtcSignalIdsRef.current.size > MAX_SIGNAL_SET_SIZE) {
      const excess = handledRtcSignalIdsRef.current.size - MAX_SIGNAL_SET_SIZE
      let removed = 0
      for (const id of handledRtcSignalIdsRef.current) {
        if (removed >= excess) break
        handledRtcSignalIdsRef.current.delete(id)
        removed++
      }
    }
    if (processingRtcSignalIdsRef.current.size > MAX_SIGNAL_SET_SIZE) {
      const excess = processingRtcSignalIdsRef.current.size - MAX_SIGNAL_SET_SIZE
      let removed = 0
      for (const id of processingRtcSignalIdsRef.current) {
        if (removed >= excess) break
        processingRtcSignalIdsRef.current.delete(id)
        removed++
      }
    }
  }, [incomingRtcSignals])

  // Cleanup sets on unmount
  useEffect(() => {
    return () => {
      handledRtcSignalIdsRef.current.clear()
      processingRtcSignalIdsRef.current.clear()
    }
  }, [])

  // Process pending incoming RTC signals sequentially
  useEffect(() => {
    const pendingSignals = incomingRtcSignals
      .slice()
      .sort((left, right) => compareById(left.signalId, right.signalId))
      .filter((signal) => {
        const signalKey = toIdKey(signal.signalId)
        return (
          !handledRtcSignalIdsRef.current.has(signalKey) &&
          !processingRtcSignalIdsRef.current.has(signalKey)
        )
      })

    if (pendingSignals.length === 0) {
      return
    }

    let cancelled = false

    const processSignals = async (): Promise<void> => {
      for (const signal of pendingSignals) {
        if (cancelled) {
          return
        }

        const signalKey = toIdKey(signal.signalId)
        processingRtcSignalIdsRef.current.add(signalKey)

        try {
          await handleIncomingSignal({
            senderIdentity: signal.senderIdentity,
            senderId: identityToString(signal.senderIdentity),
            signalType: signal.signalType,
            payload: signal.payload,
          })
        } catch (error) {
          console.error('[useRtcSignaling] Signal processing failed:', error)
          setActionError(errorToString(error))
        }

        try {
          await actions.ackRtcSignal({ signalId: signal.signalId })
          handledRtcSignalIdsRef.current.add(signalKey)
        } catch (ackError) {
          console.error('[useRtcSignaling] Failed to ack signal:', ackError)
        } finally {
          processingRtcSignalIdsRef.current.delete(signalKey)
        }
      }
    }

    void processSignals()

    return () => {
      cancelled = true
    }
  }, [actions, handleIncomingSignal, incomingRtcSignals])

  // -------------------------------------------------------------------------
  // Callbacks
  // -------------------------------------------------------------------------
  const onAckLatestSignal = useCallback((): void => {
    if (!latestIncomingSignal) {
      setActionError('No incoming signal to ack')
      return
    }

    void runAction(
      () => actions.ackRtcSignal({ signalId: latestIncomingSignal.signalId }),
      'Acked latest signal',
    )
  }, [actions, latestIncomingSignal, runAction, setActionError])

  const onSendRtcDebugSignal = useCallback((): void => {
    if (!currentVoiceState) {
      setActionError('Join a voice channel before sending RTC signals')
      return
    }

    if (!selectedRtcRecipient) {
      setActionError('Select an RTC recipient')
      return
    }

    if (rtcPayloadRequired && rtcPayload.trim().length === 0) {
      setActionError('Payload is required for offer/answer/ice')
      return
    }

    const payload = rtcPayloadRequired ? rtcPayload.trim() : rtcPayload
    void runAction(
      () =>
        actions.sendRtcSignal({
          channelId: currentVoiceState.channelId,
          recipientIdentity: selectedRtcRecipient.identity,
          signalType: toRtcSignalType(rtcSignalTypeTag),
          payload,
        }),
      'Sent RTC debug signal',
    )
  }, [actions, currentVoiceState, rtcPayload, rtcPayloadRequired, rtcSignalTypeTag, runAction, selectedRtcRecipient, setActionError])

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    rtcRecipientId,
    setRtcRecipientId,
    rtcSignalTypeTag,
    setRtcSignalTypeTag,
    rtcPayload,
    setRtcPayload,

    incomingRtcSignals,
    latestIncomingSignal,
    selectedRtcRecipient,
    rtcRecipientSelectValue,
    rtcPayloadRequired,
    canSendRtcDebugSignal,

    onAckLatestSignal,
    onSendRtcDebugSignal,
  }
}

export { RTC_SIGNAL_TYPE_TAGS }
export type { RtcSignalTypeTag }
