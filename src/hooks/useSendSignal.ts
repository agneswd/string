import { useCallback } from 'react'
import { toIdKey } from '../lib/helpers'
import type { RtcSignalTypeTag } from '../lib/helpers'
import type { VoiceState, User } from '../module_bindings/types'
import type { AppExtendedActions } from './useAppData'
import type { useStringActions } from '../lib/useStringStore'

interface UseSendSignalParams {
  currentVoiceState: VoiceState | null
  usersByIdentity: Map<string, User>
  actions: ReturnType<typeof useStringActions>
  extendedActions: ReturnType<typeof useStringActions> & AppExtendedActions
}

export function useSendSignal({
  currentVoiceState,
  usersByIdentity,
  actions,
  extendedActions,
}: UseSendSignalParams) {
  return useCallback(
    ({ peerId, signalType, payload }: { peerId: string; signalType: RtcSignalTypeTag; payload: string }) => {
      if (!currentVoiceState) return
      const recipientIdentity = usersByIdentity.get(peerId)?.identity
      if (!recipientIdentity) return

      // DM voice: guildId === 0n
      const isDmVoice = toIdKey(currentVoiceState.guildId) === '0'
      if (isDmVoice) {
        return extendedActions.sendDmRtcSignal?.({
          dmChannelId: currentVoiceState.channelId as bigint,
          recipientIdentity,
          signalType: { tag: signalType },
          payload,
        })
      }

      return actions.sendRtcSignal({
        channelId: currentVoiceState.channelId,
        recipientIdentity,
        signalType: { tag: signalType },
        payload,
      })
    },
    [currentVoiceState, usersByIdentity, actions, extendedActions],
  )
}
