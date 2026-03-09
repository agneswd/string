import { useCallback, useEffect, useMemo, useState } from 'react'

import { getStoredValue, setStoredValue } from '../../../core/spacetime/spacetimeStorage'
import type { Channel, Guild } from '../../browse/types'
import type { DmConversation } from '../../dm/types'
import type { ShellActiveDetail } from '../presentation'

const STORAGE_KEY_PREFIX = 'string.mobile.shell-selection.v1'

interface PersistedDmSelection {
  conversationId: string
  peerName: string
}

interface PersistedChannelSelection {
  guildId: string
  guildName: string
  channelId: string
  channelName: string
}

type PersistedActiveSelection =
  | null
  | ({ kind: 'dm' } & PersistedDmSelection)
  | ({ kind: 'channel' } & PersistedChannelSelection)

interface PersistedShellSelectionState {
  lastDm: PersistedDmSelection | null
  lastActive: PersistedActiveSelection
  guildChannels: Record<string, PersistedChannelSelection>
}

const EMPTY_STATE: PersistedShellSelectionState = {
  lastDm: null,
  lastActive: null,
  guildChannels: {},
}

interface ResolveInitialDetailArgs {
  guilds: Guild[]
  channels: Channel[]
  conversations: DmConversation[]
}

interface ResolveGuildDetailArgs {
  guildId: string
  guildName: string
  channels: Channel[]
}

export function usePersistedShellSelection(userId: string | null) {
  const storageKey = useMemo(
    () => (userId ? `${STORAGE_KEY_PREFIX}.${userId}` : null),
    [userId],
  )
  const [state, setState] = useState<PersistedShellSelectionState>(EMPTY_STATE)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (!storageKey) {
      setState(EMPTY_STATE)
      setHydrated(true)
      return
    }

    let cancelled = false
    setHydrated(false)

    void (async () => {
      try {
        const raw = await getStoredValue(storageKey)
        if (cancelled) {
          return
        }

        if (!raw) {
          setState(EMPTY_STATE)
          setHydrated(true)
          return
        }

        setState(normalizePersistedState(JSON.parse(raw)))
      } catch {
        setState(EMPTY_STATE)
      } finally {
        if (!cancelled) {
          setHydrated(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [storageKey])

  useEffect(() => {
    if (!storageKey || !hydrated) {
      return
    }

    void setStoredValue(storageKey, JSON.stringify(state)).catch(() => {
      // ignore mobile shell persistence failures
    })
  }, [hydrated, state, storageKey])

  const rememberDetail = useCallback((detail: ShellActiveDetail) => {
    if (!detail) {
      return
    }

    setState((current) => {
      if (detail.kind === 'dm') {
        const nextDm = {
          conversationId: detail.conversationId,
          peerName: detail.peerName,
        }

        if (
          current.lastDm?.conversationId === nextDm.conversationId
          && current.lastDm?.peerName === nextDm.peerName
          && current.lastActive?.kind === 'dm'
          && current.lastActive.conversationId === nextDm.conversationId
          && current.lastActive.peerName === nextDm.peerName
        ) {
          return current
        }

        return {
          ...current,
          lastDm: nextDm,
          lastActive: {
            kind: 'dm',
            ...nextDm,
          },
        }
      }

      if (detail.kind === 'channel' && detail.guildId) {
        const nextChannel = {
          guildId: detail.guildId,
          guildName: detail.guildName,
          channelId: detail.channelId,
          channelName: detail.channelName,
        }

        const existingChannel = current.guildChannels[detail.guildId]
        if (
          existingChannel?.guildId === nextChannel.guildId
          && existingChannel.guildName === nextChannel.guildName
          && existingChannel.channelId === nextChannel.channelId
          && existingChannel.channelName === nextChannel.channelName
          && current.lastActive?.kind === 'channel'
          && current.lastActive.guildId === nextChannel.guildId
          && current.lastActive.guildName === nextChannel.guildName
          && current.lastActive.channelId === nextChannel.channelId
          && current.lastActive.channelName === nextChannel.channelName
        ) {
          return current
        }

        return {
          ...current,
          lastActive: {
            kind: 'channel',
            ...nextChannel,
          },
          guildChannels: {
            ...current.guildChannels,
            [detail.guildId]: nextChannel,
          },
        }
      }

      return current
    })
  }, [])

  const resolveGuildDetail = useCallback(({
    guildId,
    guildName,
    channels,
  }: ResolveGuildDetailArgs): ShellActiveDetail => {
    const guildChannels = channels
      .filter((channel) => channel.guildId === guildId && channel.type !== 'category')
      .sort(compareChannels)

    if (!guildChannels.length) {
      return {
        kind: 'guild',
        guildId,
        title: guildName,
        subtitle: 'Server overview and member context will appear here.',
      }
    }

    const persistedChannel = state.guildChannels[guildId]
    const selectedChannel = persistedChannel
      ? guildChannels.find((channel) => channel.id === persistedChannel.channelId) ?? null
      : null

    const fallbackChannel = guildChannels.find((channel) => channel.type !== 'voice') ?? guildChannels[0]
    const resolvedChannel = selectedChannel ?? fallbackChannel

    return buildChannelDetail({
      guildId,
      guildName,
      channelId: resolvedChannel.id,
      channelName: resolvedChannel.name,
    })
  }, [state.guildChannels])

  const resolveLastDmDetail = useCallback((conversations: DmConversation[]): ShellActiveDetail => {
    const persistedDm = state.lastDm
    const matchingConversation = persistedDm
      ? conversations.find((conversation) => conversation.id === persistedDm.conversationId) ?? null
      : null

    if (matchingConversation) {
      return buildDmDetail({
        conversationId: matchingConversation.id,
        peerName: matchingConversation.peerName,
      })
    }

    const fallbackConversation = conversations[0]
    if (!fallbackConversation) {
      return null
    }

    return buildDmDetail({
      conversationId: fallbackConversation.id,
      peerName: fallbackConversation.peerName,
    })
  }, [state.lastDm])

  const resolveInitialDetail = useCallback(({
    guilds,
    channels,
    conversations,
  }: ResolveInitialDetailArgs): ShellActiveDetail => {
    const active = state.lastActive

    if (active?.kind === 'dm') {
      const matchingConversation = conversations.find((conversation) => conversation.id === active.conversationId)
      if (matchingConversation) {
        return buildDmDetail({
          conversationId: matchingConversation.id,
          peerName: matchingConversation.peerName,
        })
      }
    }

    if (active?.kind === 'channel') {
      const matchingChannel = channels.find((channel) => (
        channel.id === active.channelId
        && channel.guildId === active.guildId
        && channel.type !== 'category'
      ))
      if (matchingChannel) {
        const matchingGuild = guilds.find((guild) => guild.id === active.guildId)
        return buildChannelDetail({
          guildId: active.guildId,
          guildName: matchingGuild?.name ?? active.guildName,
          channelId: matchingChannel.id,
          channelName: matchingChannel.name,
        })
      }
    }

    return resolveLastDmDetail(conversations)
  }, [resolveLastDmDetail, state.lastActive])

  return useMemo(() => ({
    hydrated,
    rememberDetail,
    resolveGuildDetail,
    resolveInitialDetail,
    resolveLastDmDetail,
  }), [hydrated, rememberDetail, resolveGuildDetail, resolveInitialDetail, resolveLastDmDetail])
}

function buildDmDetail(selection: PersistedDmSelection): ShellActiveDetail {
  return {
    kind: 'dm',
    conversationId: selection.conversationId,
    peerName: selection.peerName,
  }
}

function buildChannelDetail(selection: PersistedChannelSelection): ShellActiveDetail {
  return {
    kind: 'channel',
    guildId: selection.guildId,
    guildName: selection.guildName,
    channelId: selection.channelId,
    channelName: selection.channelName,
    title: `#${selection.channelName}`,
    subtitle: `Inside ${selection.guildName}. Channel history and composer will connect here.`,
  }
}

function compareChannels(left: Channel, right: Channel): number {
  const leftPosition = left.position ?? Number.MAX_SAFE_INTEGER
  const rightPosition = right.position ?? Number.MAX_SAFE_INTEGER
  if (leftPosition !== rightPosition) {
    return leftPosition - rightPosition
  }

  return left.name.localeCompare(right.name)
}

function normalizePersistedState(value: unknown): PersistedShellSelectionState {
  if (!value || typeof value !== 'object') {
    return EMPTY_STATE
  }

  const parsed = value as Partial<PersistedShellSelectionState>

  return {
    lastDm: isPersistedDmSelection(parsed.lastDm) ? parsed.lastDm : null,
    lastActive: isPersistedActiveSelection(parsed.lastActive) ? parsed.lastActive : null,
    guildChannels: normalizeGuildChannels(parsed.guildChannels),
  }
}

function normalizeGuildChannels(value: unknown): Record<string, PersistedChannelSelection> {
  if (!value || typeof value !== 'object') {
    return {}
  }

  return Object.entries(value).reduce<Record<string, PersistedChannelSelection>>((result, [key, item]) => {
    if (isPersistedChannelSelection(item)) {
      result[key] = item
    }

    return result
  }, {})
}

function isPersistedDmSelection(value: unknown): value is PersistedDmSelection {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as PersistedDmSelection
  return typeof candidate.conversationId === 'string' && typeof candidate.peerName === 'string'
}

function isPersistedChannelSelection(value: unknown): value is PersistedChannelSelection {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as PersistedChannelSelection
  return (
    typeof candidate.guildId === 'string'
    && typeof candidate.guildName === 'string'
    && typeof candidate.channelId === 'string'
    && typeof candidate.channelName === 'string'
  )
}

function isPersistedActiveSelection(value: unknown): value is PersistedActiveSelection {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as { kind?: string }
  if (candidate.kind === 'dm') {
    return isPersistedDmSelection(candidate)
  }

  if (candidate.kind === 'channel') {
    return isPersistedChannelSelection(candidate)
  }

  return false
}
