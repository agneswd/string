import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { identityToString, type AppData } from './useAppData'
import type { TypingIndicatorUser } from '../components/chat/TypingIndicator'

const TYPING_STOP_DELAY_MS = 1800
const TYPING_REFRESH_MS = 2000

type TypingTarget =
  | { kind: 'channel'; key: string; id: unknown }
  | { kind: 'dm'; key: string; id: unknown }

interface UseTypingIndicatorsParams {
  composerValue: string
  setComposerValue: (value: string) => void
  selectedTextChannel: { channelId: unknown } | null
  selectedDmChannel: { dmChannelId: unknown } | null
  identityString: string
  usersByIdentity: AppData['usersByIdentity']
  getAvatarUrlForUser: (identity: string) => string | undefined
  channelTyping: AppData['channelTyping']
  dmTyping: AppData['dmTyping']
  actions: AppData['actions']
}

export interface TypingIndicatorsResult {
  typingUsers: TypingIndicatorUser[]
  handleComposerChange: (value: string) => void
}

export function useTypingIndicators({
  composerValue,
  setComposerValue,
  selectedTextChannel,
  selectedDmChannel,
  identityString,
  usersByIdentity,
  getAvatarUrlForUser,
  channelTyping,
  dmTyping,
  actions,
}: UseTypingIndicatorsParams): TypingIndicatorsResult {
  const activeTargetRef = useRef<TypingTarget | null>(null)
  const lastTypingSentAtRef = useRef(0)
  const stopTimeoutRef = useRef<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const currentTarget = useMemo<TypingTarget | null>(() => {
    if (selectedDmChannel) {
      return {
        kind: 'dm',
        key: `dm:${String(selectedDmChannel.dmChannelId)}`,
        id: selectedDmChannel.dmChannelId,
      }
    }

    if (selectedTextChannel) {
      return {
        kind: 'channel',
        key: `channel:${String(selectedTextChannel.channelId)}`,
        id: selectedTextChannel.channelId,
      }
    }

    return null
  }, [selectedDmChannel, selectedTextChannel])

  const sendTypingState = useCallback(async (target: TypingTarget, isTyping: boolean) => {
    if (target.kind === 'dm') {
      await actions.setDmTyping({ dmChannelId: target.id, isTyping })
      return
    }

    await actions.setChannelTyping({ channelId: target.id, isTyping })
  }, [actions])

  const clearStopTimeout = useCallback(() => {
    if (stopTimeoutRef.current !== null) {
      window.clearTimeout(stopTimeoutRef.current)
      stopTimeoutRef.current = null
    }
  }, [])

  const stopTyping = useCallback((target: TypingTarget | null) => {
    if (!target) {
      return
    }

    clearStopTimeout()
    activeTargetRef.current = null
    lastTypingSentAtRef.current = 0
    void sendTypingState(target, false)
  }, [clearStopTimeout, sendTypingState])

  const scheduleStopTyping = useCallback((target: TypingTarget) => {
    clearStopTimeout()
    stopTimeoutRef.current = window.setTimeout(() => {
      stopTyping(target)
    }, TYPING_STOP_DELAY_MS)
  }, [clearStopTimeout, stopTyping])

  const startTyping = useCallback((target: TypingTarget) => {
    const currentTime = Date.now()
    const isSameTarget = activeTargetRef.current?.key === target.key
    const shouldRefresh = !isSameTarget || currentTime - lastTypingSentAtRef.current >= TYPING_REFRESH_MS

    activeTargetRef.current = target
    if (shouldRefresh) {
      lastTypingSentAtRef.current = currentTime
      void sendTypingState(target, true)
    }

    scheduleStopTyping(target)
  }, [scheduleStopTyping, sendTypingState])

  const handleComposerChange = useCallback((value: string) => {
    setComposerValue(value)

    if (!currentTarget) {
      stopTyping(activeTargetRef.current)
      return
    }

    if (activeTargetRef.current && activeTargetRef.current.key !== currentTarget.key) {
      stopTyping(activeTargetRef.current)
    }

    if (value.trim().length === 0) {
      stopTyping(currentTarget)
      return
    }

    startTyping(currentTarget)
  }, [currentTarget, setComposerValue, startTyping, stopTyping])

  useEffect(() => {
    if (!currentTarget && activeTargetRef.current) {
      stopTyping(activeTargetRef.current)
      return
    }

    if (currentTarget && activeTargetRef.current && activeTargetRef.current.key !== currentTarget.key) {
      stopTyping(activeTargetRef.current)
    }
  }, [currentTarget, stopTyping])

  useEffect(() => {
    if (composerValue.trim().length === 0 && activeTargetRef.current) {
      stopTyping(activeTargetRef.current)
    }
  }, [composerValue, stopTyping])

  useEffect(() => () => {
    clearStopTimeout()
    if (activeTargetRef.current) {
      void sendTypingState(activeTargetRef.current, false)
      activeTargetRef.current = null
    }
  }, [clearStopTimeout, sendTypingState])

  const toMillis = useCallback((value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      const maybeDate = (value as { toDate?: () => Date }).toDate?.()
      if (maybeDate instanceof Date) {
        return maybeDate.getTime()
      }
    }

    return new Date(String(value)).getTime()
  }, [])

  const typingUsers = useMemo(() => {
    const sourceRows = currentTarget?.kind === 'dm' ? dmTyping : channelTyping
    const activeRows = sourceRows.filter((row) => {
      if (currentTarget?.kind === 'dm') {
        return String(row.dmChannelId) === String(currentTarget.id)
      }

      return currentTarget?.kind === 'channel'
        ? String((row as { channelId: unknown }).channelId) === String(currentTarget.id)
        : false
    }).filter((row) => {
      const rowIdentity = identityToString(row.identity)
      if (!rowIdentity || rowIdentity === identityString) {
        return false
      }

      const expiresAtMs = toMillis(row.expiresAt)
      return Number.isFinite(expiresAtMs) && expiresAtMs > now
    })

    return activeRows.map((row) => {
      const identityKey = identityToString(row.identity)
      const user = usersByIdentity.get(identityKey)
      return {
        id: identityKey,
        label: user?.displayName ?? user?.username ?? identityKey.slice(0, 12),
        avatarUrl: getAvatarUrlForUser(identityKey),
      }
    })
  }, [channelTyping, currentTarget, dmTyping, getAvatarUrlForUser, identityString, now, toMillis, usersByIdentity])

  useEffect(() => {
    if (typingUsers.length === 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 500)

    return () => window.clearInterval(intervalId)
  }, [typingUsers.length])

  return {
    typingUsers,
    handleComposerChange,
  }
}