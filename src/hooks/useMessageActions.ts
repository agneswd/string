import { useCallback } from 'react'
import { playSound } from '../lib/sfx'
import { toIdKey } from '../lib/helpers'
import type { ChatMessageItem } from '../components/chat/ChatViewPane'
import type { ActionFeedback } from './useActionFeedback'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Actions = {
  deleteMessage: (params: { messageId: bigint }) => Promise<void>
  editMessage: (params: { messageId: bigint; newContent: string }) => Promise<void>
  sendMessage: (params: { channelId: unknown; content: string; replyTo: unknown }) => Promise<void>
}

type ExtendedActions = {
  deleteDmMessage?: (params: { dmMessageId: bigint }) => Promise<void>
  editDmMessage?: (params: { dmMessageId: bigint; newContent: string }) => Promise<void>
  sendDmMessage?: (params: { dmChannelId: unknown; content: string; replyTo: unknown }) => Promise<void>
}

type DmChannel = {
  dmChannelId: unknown
}

type TextChannel = {
  channelId: unknown
  name: string
}

export interface UseMessageActionsParams {
  isDmMode: boolean
  selectedDmChannel: DmChannel | null
  selectedTextChannel: TextChannel | null
  selectedDmName: string | null | undefined
  dmMessagesForSelectedChannel: ChatMessageItem[]
  messagesForSelectedTextChannel: ChatMessageItem[]
  stateError: string | null | undefined
  actionError: string | null | undefined
  runAction: ActionFeedback['runAction']
  callActionOrReducer: ActionFeedback['callActionOrReducer']
  extendedActions: ExtendedActions
  actions: Actions
  setActionError: ActionFeedback['setActionError']
  setComposerValue: (value: string) => void
}

export interface MessageActions {
  handleDeleteMessage: (messageId: string | number) => void
  handleEditMessage: (messageId: string | number, newContent: string) => void
  onSendMessage: (content: string) => void
  handleSendMessageWithSfx: (content: string) => void
  activeChannelName: string | undefined
  activeMessages: ChatMessageItem[]
  statusError: string | null | undefined
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMessageActions({
  isDmMode,
  selectedDmChannel,
  selectedTextChannel,
  selectedDmName,
  dmMessagesForSelectedChannel,
  messagesForSelectedTextChannel,
  stateError,
  actionError,
  runAction,
  callActionOrReducer,
  extendedActions,
  actions,
  setActionError,
  setComposerValue,
}: UseMessageActionsParams): MessageActions {
  // Derived values
  const activeChannelName = isDmMode
    ? selectedDmName ?? `dm-${toIdKey(selectedDmChannel?.dmChannelId ?? '')}`
    : selectedTextChannel?.name
  const activeMessages = isDmMode ? dmMessagesForSelectedChannel : messagesForSelectedTextChannel
  const statusError = stateError ?? actionError

  const handleDeleteMessage = useCallback((messageId: string | number) => {
    void runAction(async () => {
      if (isDmMode) {
        await callActionOrReducer(extendedActions.deleteDmMessage, 'deleteDmMessage', {
          dmMessageId: BigInt(messageId),
        })
      } else {
        await actions.deleteMessage({ messageId: BigInt(messageId) })
      }
    })
  }, [isDmMode, runAction, callActionOrReducer, extendedActions, actions])

  const handleEditMessage = useCallback((messageId: string | number, newContent: string) => {
    void runAction(async () => {
      if (isDmMode) {
        await callActionOrReducer(extendedActions.editDmMessage, 'editDmMessage', {
          dmMessageId: BigInt(messageId),
          newContent,
        })
      } else {
        await actions.editMessage({ messageId: BigInt(messageId), newContent })
      }
    })
  }, [isDmMode, runAction, callActionOrReducer, extendedActions, actions])

  const onSendMessage = useCallback((content: string, onSuccess?: () => void): void => {
    if (selectedDmChannel) {
      void runAction(async () => {
        await callActionOrReducer(extendedActions.sendDmMessage, 'sendDmMessage', {
          dmChannelId: selectedDmChannel.dmChannelId,
          content,
          replyTo: undefined,
        })
        setComposerValue('')
        onSuccess?.()
      })
      return
    }

    if (!selectedTextChannel) {
      setActionError('Select a text channel first')
      return
    }

    void runAction(async () => {
      await actions.sendMessage({
        channelId: selectedTextChannel.channelId,
        content,
        replyTo: undefined,
      })
      setComposerValue('')
      onSuccess?.()
    })
  }, [selectedDmChannel, selectedTextChannel, runAction, callActionOrReducer, extendedActions, actions, setActionError, setComposerValue])

  const handleSendMessageWithSfx = useCallback((content: string) => {
    onSendMessage(content, () => playSound('message-sent'))
  }, [onSendMessage])

  return {
    handleDeleteMessage,
    handleEditMessage,
    onSendMessage,
    handleSendMessageWithSfx,
    activeChannelName,
    activeMessages,
    statusError,
  }
}
