import { useState, useCallback } from 'react'

import { getConn } from '../lib/connection'
import { toChannelType } from '../lib/helpers'
import type { ChannelTypeTag } from '../lib/helpers'
import type { Guild } from '../module_bindings/types'
import type { ActionFeedback } from './useActionFeedback'

// Re-export for convenience
export type { ChannelTypeTag }

type Actions = {
  createGuild: (params: { name: string }) => Promise<void>
  createChannel: (params: { guildId: unknown; name: string; channelType: unknown }) => Promise<void>
}

export interface GuildActionsParams {
  actions: Actions
  selectedGuild: Guild | null
  runAction: ActionFeedback['runAction']
  callActionOrReducer: ActionFeedback['callActionOrReducer']
  setActionError: ActionFeedback['setActionError']
  setActionStatus: ActionFeedback['setActionStatus']
  setSelectedGuildId: (id: string | undefined) => void
}

export interface GuildActions {
  newGuildName: string
  setNewGuildName: (v: string) => void
  newChannelName: string
  setNewChannelName: (v: string) => void
  newChannelType: ChannelTypeTag
  setNewChannelType: (v: ChannelTypeTag) => void
  showCreateGuildModal: boolean
  setShowCreateGuildModal: (v: boolean) => void
  showCreateChannelModal: boolean
  setShowCreateChannelModal: (v: boolean) => void
  showInviteModal: boolean
  setShowInviteModal: (v: boolean) => void
  inviteSearchQuery: string
  setInviteSearchQuery: (v: string) => void
  onCreateGuild: (event?: React.FormEvent<HTMLFormElement>) => Promise<void>
  onCreateChannel: (event?: React.FormEvent<HTMLFormElement>) => Promise<void>
  onInviteFriend: (friendIdentity: unknown) => void
  onLeaveGuild: (guildId: number | bigint | string) => void
  onDeleteGuild: (guildId: number | bigint | string) => void
}

export function useGuildActions({
  actions,
  selectedGuild,
  runAction,
  callActionOrReducer,
  setActionError,
  setActionStatus,
  setSelectedGuildId,
}: GuildActionsParams): GuildActions {
  const [newGuildName, setNewGuildName] = useState('')
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelType, setNewChannelType] = useState<ChannelTypeTag>('Text')
  const [showCreateGuildModal, setShowCreateGuildModal] = useState(false)
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteSearchQuery, setInviteSearchQuery] = useState('')

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
      await actions.createChannel({
        guildId: selectedGuild.guildId,
        name,
        channelType: toChannelType(newChannelType),
      })
      setNewChannelName('')
    }, 'Channel created')
  }

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
      'Left the server',
    );
    setSelectedGuildId(undefined);
  }, [runAction, callActionOrReducer, setSelectedGuildId]);

  const onDeleteGuild = useCallback((guildId: number | bigint | string) => {
    if (!confirm('Are you sure you want to delete this server? This action cannot be undone.')) return;
    void runAction(async () => {
      const conn = getConn();
      const reducers = conn.reducers as unknown as Record<string, ((...args: unknown[]) => void) | undefined>;
      const fn = reducers['deleteGuild'] ?? reducers['delete_guild'];
      if (!fn) throw new Error('deleteGuild reducer not available');
      fn({ guildId: typeof guildId === 'string' ? BigInt(guildId) : guildId });
    }, 'Server deleted');
    setSelectedGuildId(undefined);
  }, [runAction, setSelectedGuildId]);

  return {
    newGuildName,
    setNewGuildName,
    newChannelName,
    setNewChannelName,
    newChannelType,
    setNewChannelType,
    showCreateGuildModal,
    setShowCreateGuildModal,
    showCreateChannelModal,
    setShowCreateChannelModal,
    showInviteModal,
    setShowInviteModal,
    inviteSearchQuery,
    setInviteSearchQuery,
    onCreateGuild,
    onCreateChannel,
    onInviteFriend,
    onLeaveGuild,
    onDeleteGuild,
  }
}
