import { useState, useCallback, useMemo } from 'react'

import { getConn } from '../lib/connection'
import { toChannelType, toIdKey, isCategoryChannel } from '../lib/helpers'
import type { ChannelTypeTag } from '../lib/helpers'
import type { Channel, Guild, GuildInvite, User } from '../module_bindings/types'
import type { ActionFeedback } from './useActionFeedback'
import { identityToString } from './useAppData'
import type { AppExtendedActions } from './useAppData'

// Re-export for convenience
export type { ChannelTypeTag }

type Actions = {
  createGuild: (params: { name: string }) => Promise<void>
  createChannel: (params: { guildId: unknown; name: string; channelType: unknown }) => Promise<void>
}

export interface GuildActionsParams {
  actions: Actions
  selectedGuild: Guild | null
  channelsForGuild: Channel[]
  runAction: ActionFeedback['runAction']
  callActionOrReducer: ActionFeedback['callActionOrReducer']
  setActionError: ActionFeedback['setActionError']
  setActionStatus: ActionFeedback['setActionStatus']
  setSelectedGuildId: (id: string | undefined) => void
  identityString: string
  guildInvites: GuildInvite[]
  usersByIdentity: Map<string, User>
  extendedActions: AppExtendedActions
}

export interface GuildInviteItem {
  id: string
  guildId: string
  inviterName: string
}

export interface GuildActions {
  newGuildName: string
  setNewGuildName: (v: string) => void
  newChannelName: string
  setNewChannelName: (v: string) => void
  newChannelParentCategoryId: string
  setNewChannelParentCategoryId: (v: string) => void
  newChannelType: ChannelTypeTag
  setNewChannelType: (v: ChannelTypeTag) => void
  showCreateGuildModal: boolean
  setShowCreateGuildModal: (v: boolean) => void
  showCreateChannelModal: boolean
  setShowCreateChannelModal: (v: boolean) => void
  showInviteModal: boolean
  setShowInviteModal: (v: boolean) => void
  editingChannelId: string | null
  openCreateChannelModal: (parentCategoryId?: string | null) => void
  openCreateCategoryModal: () => void
  openEditChannelModal: (channelId: string) => void
  onDeleteChannel: (channelId: string | number) => void
  saveChannelLayout: (layout: Array<{ channelId: string | number; categoryId?: string | number | null; position: number }>) => void
  inviteSearchQuery: string
  setInviteSearchQuery: (v: string) => void
  onCreateGuild: (event?: React.FormEvent<HTMLFormElement>) => Promise<void>
  onCreateChannel: (event?: React.FormEvent<HTMLFormElement>) => Promise<void>
  onUpdateGuild: (params: {
    name?: string | null
    bio?: string | null
    avatarBytes?: Uint8Array | null
  }) => Promise<void>
  onInviteFriend: (friendIdentity: unknown) => void
  onLeaveGuild: (guildId: number | bigint | string) => void
  onDeleteGuild: (guildId: number | bigint | string) => void
  myGuildInvites: GuildInviteItem[]
  onAcceptGuildInvite: (inviteId: string) => void
  onDeclineGuildInvite: (inviteId: string) => void
}

export function useGuildActions({
  actions,
  selectedGuild,
  channelsForGuild,
  runAction,
  callActionOrReducer,
  setActionError,
  setActionStatus,
  setSelectedGuildId,
  identityString,
  guildInvites,
  usersByIdentity,
  extendedActions,
}: GuildActionsParams): GuildActions {
  const [newGuildName, setNewGuildName] = useState('')
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelType, setNewChannelType] = useState<ChannelTypeTag>('Text')
  const [newChannelParentCategoryId, setNewChannelParentCategoryId] = useState('')
  const [showCreateGuildModal, setShowCreateGuildModal] = useState(false)
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteSearchQuery, setInviteSearchQuery] = useState('')
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null)

  const openCreateChannelModal = useCallback((parentCategoryId?: string | null) => {
    setEditingChannelId(null)
    setNewChannelName('')
    setNewChannelType('Text')
    setNewChannelParentCategoryId(parentCategoryId ?? '')
    setShowCreateChannelModal(true)
  }, [])

  const openCreateCategoryModal = useCallback(() => {
    setEditingChannelId(null)
    setNewChannelName('')
    setNewChannelType('Category')
    setNewChannelParentCategoryId('')
    setShowCreateChannelModal(true)
  }, [])

  const openEditChannelModal = useCallback((channelId: string) => {
    const channel = channelsForGuild.find((entry) => toIdKey(entry.channelId) === channelId)
    if (!channel) {
      return
    }

    setEditingChannelId(channelId)
    setNewChannelName(channel.name)
    setNewChannelType(isCategoryChannel(channel) ? 'Category' : toChannelTypeLabel(channel))
    setNewChannelParentCategoryId(channel.categoryId ? toIdKey(channel.categoryId) : '')
    setShowCreateChannelModal(true)
  }, [channelsForGuild])

  const onDeleteChannel = useCallback((channelId: string | number) => {
    const channelKey = String(channelId)
    const channel = channelsForGuild.find((entry) => toIdKey(entry.channelId) === channelKey)
    const label = channel && isCategoryChannel(channel) ? 'category' : 'channel'

    if (!confirm(`Are you sure you want to delete this ${label}? This action cannot be undone.`)) {
      return
    }

    void runAction(() => callActionOrReducer(undefined, 'deleteChannel', {
      channelId: typeof channelId === 'string' ? BigInt(channelId) : channelId,
    }), `${label[0].toUpperCase()}${label.slice(1)} deleted`)
  }, [channelsForGuild, runAction, callActionOrReducer])

  const saveChannelLayout = useCallback((layout: Array<{ channelId: string | number; categoryId?: string | number | null; position: number }>) => {
    if (!selectedGuild) {
      return
    }

    void runAction(() => callActionOrReducer(undefined, 'saveChannelLayout', {
      guildId: selectedGuild.guildId,
      layout: layout.map((item) => ({
        channelId: typeof item.channelId === 'string' ? BigInt(item.channelId) : item.channelId,
        categoryId: item.categoryId == null || item.categoryId === ''
          ? null
          : typeof item.categoryId === 'string'
            ? BigInt(item.categoryId)
            : item.categoryId,
        position: item.position,
      })),
    }))
  }, [selectedGuild, runAction, callActionOrReducer])

  const onCreateGuild = async (event?: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event?.preventDefault()
    const name = newGuildName.trim()
    if (!name) {
      setActionStatus(null)
      setActionError('Guild name is required')
      return
    }

    await runAction(async () => {
      await actions.createGuild({ name })
      setNewGuildName('')
    }, 'Guild created')
  }

  const onCreateChannel = async (event?: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event?.preventDefault()
    if (!selectedGuild) {
      setActionStatus(null)
      setActionError('Select a guild first')
      return
    }

    const name = newChannelName.trim()
    if (!name) {
      setActionStatus(null)
      setActionError('Channel name is required')
      return
    }

    await runAction(async () => {
      if (editingChannelId) {
        await callActionOrReducer(undefined, 'updateChannel', {
          channelId: BigInt(editingChannelId),
          name,
          topic: null,
        })

        const channel = channelsForGuild.find((entry) => toIdKey(entry.channelId) === editingChannelId)
        const nextCategoryId = newChannelType === 'Category' ? null : (newChannelParentCategoryId || null)
        const currentCategoryId = channel?.categoryId ? toIdKey(channel.categoryId) : null
        if (channel && currentCategoryId !== nextCategoryId) {
          const reordered = buildUpdatedLayout(channelsForGuild, editingChannelId, nextCategoryId)
          await callActionOrReducer(undefined, 'saveChannelLayout', {
            guildId: selectedGuild.guildId,
            layout: reordered,
          })
        }
      } else {
        await actions.createChannel({
          guildId: selectedGuild.guildId,
          name,
          channelType: toChannelType(newChannelType),
          parentCategoryId: newChannelType === 'Category' || !newChannelParentCategoryId
            ? null
            : BigInt(newChannelParentCategoryId),
        })
      }
      setNewChannelName('')
      setNewChannelParentCategoryId('')
      setEditingChannelId(null)
    }, editingChannelId ? 'Channel updated' : 'Channel created')
  }

  const onUpdateGuild = useCallback(async (params: {
    name?: string | null
    bio?: string | null
    avatarBytes?: Uint8Array | null
  }) => {
    if (!selectedGuild) {
      setActionError('Select a guild first')
      return
    }

    await runAction(() => callActionOrReducer(undefined, 'updateGuild', {
      guildId: selectedGuild.guildId,
      name: params.name ?? null,
      bio: params.bio ?? null,
      avatarBytes: params.avatarBytes ?? null,
    }), 'Loom updated')
  }, [selectedGuild, runAction, callActionOrReducer, setActionError])

  const onInviteFriend = useCallback((friendIdentity: unknown) => {
    if (!selectedGuild || !selectedGuild.guildId || !friendIdentity) {
      setActionError('Cannot invite: missing guild or friend identity');
      return;
    }
    void runAction(
      () =>
        callActionOrReducer(undefined, 'inviteMember', {
          guildId: selectedGuild.guildId,
          targetIdentity: friendIdentity,
        }),
      'Invite sent!',
    );
  }, [selectedGuild, runAction, callActionOrReducer, setActionError]);

  const onLeaveGuild = useCallback((guildId: number | bigint | string) => {
    void runAction(
      () =>
        callActionOrReducer(undefined, 'leaveGuild', {
          guildId: typeof guildId === 'string' ? BigInt(guildId) : guildId,
        }),
      'Left the Loom',
    );
    setSelectedGuildId(undefined);
  }, [runAction, callActionOrReducer, setSelectedGuildId]);

  const onDeleteGuild = useCallback((guildId: number | bigint | string) => {
    if (!confirm('Are you sure you want to delete this Loom? This action cannot be undone.')) return;
    void runAction(async () => {
      const conn = getConn();
      const reducers = conn.reducers as unknown as Record<string, ((...args: unknown[]) => Promise<void>) | undefined>;
      const fn = reducers['deleteGuild'] ?? reducers['delete_guild'];
      if (!fn) throw new Error('deleteGuild reducer not available');
      await fn({ guildId: typeof guildId === 'string' ? BigInt(guildId) : guildId });
    }, 'Loom deleted');
    setSelectedGuildId(undefined);
  }, [runAction, setSelectedGuildId]);

  const myGuildInvites = useMemo(() => {
    if (!identityString) return []
    return guildInvites
      .filter((inv) => identityToString(inv.inviteeIdentity) === identityString)
      .map((inv) => ({
        id: String(inv.inviteId),
        guildId: String(inv.guildId),
        inviterName: usersByIdentity.get(identityToString(inv.inviterIdentity))?.username ?? 'Unknown',
      }))
  }, [guildInvites, identityString, usersByIdentity])

  const onAcceptGuildInvite = useCallback((inviteId: string) => {
    void runAction(async () => {
      await extendedActions.acceptGuildInvite?.({ inviteId: BigInt(inviteId) })
    }, 'Invite accepted')
  }, [runAction, extendedActions])

  const onDeclineGuildInvite = useCallback((inviteId: string) => {
    void runAction(async () => {
      await extendedActions.declineGuildInvite?.({ inviteId: BigInt(inviteId) })
    }, 'Invite declined')
  }, [runAction, extendedActions])

  return {
    newGuildName,
    setNewGuildName,
    newChannelName,
    setNewChannelName,
    newChannelParentCategoryId,
    setNewChannelParentCategoryId,
    newChannelType,
    setNewChannelType,
    showCreateGuildModal,
    setShowCreateGuildModal,
    showCreateChannelModal,
    setShowCreateChannelModal,
    showInviteModal,
    setShowInviteModal,
    editingChannelId,
    openCreateChannelModal,
    openCreateCategoryModal,
    openEditChannelModal,
    onDeleteChannel,
    saveChannelLayout,
    inviteSearchQuery,
    setInviteSearchQuery,
    onCreateGuild,
    onCreateChannel,
    onUpdateGuild,
    onInviteFriend,
    onLeaveGuild,
    onDeleteGuild,
    myGuildInvites,
    onAcceptGuildInvite,
    onDeclineGuildInvite,
  }
}

function toChannelTypeLabel(channel: Channel): ChannelTypeTag {
  return channel.channelType.tag === 'Voice' ? 'Voice' : 'Text'
}

function buildUpdatedLayout(channels: Channel[], movedChannelId: string, targetCategoryId: string | null) {
  const movedKey = movedChannelId
  const siblingBuckets = new Map<string, Channel[]>()

  for (const channel of channels) {
    const key = channel.categoryId ? toIdKey(channel.categoryId) : '__root__'
    const bucket = siblingBuckets.get(key)
    if (bucket) {
      bucket.push(channel)
    } else {
      siblingBuckets.set(key, [channel])
    }
  }

  for (const bucket of siblingBuckets.values()) {
    bucket.sort((left, right) => Number(left.position) - Number(right.position))
  }

  for (const bucket of siblingBuckets.values()) {
    const index = bucket.findIndex((channel) => toIdKey(channel.channelId) === movedKey)
    if (index >= 0) {
      bucket.splice(index, 1)
      break
    }
  }

  const destinationKey = targetCategoryId ?? '__root__'
  const destinationBucket = siblingBuckets.get(destinationKey) ?? []
  const movedChannel = channels.find((channel) => toIdKey(channel.channelId) === movedKey)
  if (movedChannel) {
    destinationBucket.push(movedChannel)
    siblingBuckets.set(destinationKey, destinationBucket)
  }

  return Array.from(siblingBuckets.entries()).flatMap(([bucketKey, bucket]) =>
    bucket.map((channel, index) => ({
      channelId: channel.channelId,
      categoryId: bucketKey === '__root__' ? null : BigInt(bucketKey),
      position: index,
    })),
  )
}
