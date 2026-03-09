import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Plus } from 'lucide-react-native'

import { Colors } from '../../../shared/theme/colors'
import { buildBrowsePaneModel } from '../browseModel'
import { BrowseChannelList } from '../components/BrowseChannelList'
import { CreateGuildChannelModal, type CreateGuildChannelType } from '../components/CreateGuildChannelModal'
import { CreateLoomModal } from '../components/CreateLoomModal'
import { BrowseDmHomePane } from '../components/BrowseDmHomePane'
import { GuildSettingsPage } from '../components/GuildSettingsPage'
import { BrowseServerRail } from '../components/BrowseServerRail'
import type { DmConversation } from '../../dm/types'
import type { Channel, ChannelScreenParams, Guild, GuildScreenParams } from '../types'

interface InvitableFriend {
  id: string
  displayName: string
  username: string
  avatarUri?: string
  profileColor?: string | null
  identity: unknown
}

interface BrowseScreenProps {
  guilds?: Guild[]
  channels?: Channel[]
  conversations?: DmConversation[]
  isLoading?: boolean
  selectedGuildId?: string | null
  selectedChannelId?: string | null
  selectedConversationId?: string | null
  onOpenGuild?: (params: GuildScreenParams) => void
  onOpenChannel?: (params: ChannelScreenParams) => void
  pendingFriendCount?: number
  onOpenDm?: (conversationId: string, peerName: string) => void
  onCreateLoom?: (name: string) => Promise<void> | void
  onCreateChannel?: (params: { guildId: string; name: string; channelType: CreateGuildChannelType; parentCategoryId: string | null }) => Promise<void> | void
  onUpdateGuild?: (params: { guildId: string; name?: string | null; bio?: string | null; avatarBytes?: Uint8Array | null }) => Promise<void> | void
  invitableFriends?: InvitableFriend[]
  onInviteMember?: (guildId: string, identity: unknown) => Promise<void> | void
  onLeaveGuild?: (guildId: string) => Promise<void> | void
  onDeleteGuild?: (guildId: string) => Promise<void> | void
  onSelectGuild?: (guildId: string) => void
  onSelectBrowseHome?: () => void
  onShowFriends?: () => void
}

export function BrowseScreen({
  guilds = [],
  channels = [],
  conversations = [],
  isLoading = false,
  selectedGuildId,
  selectedChannelId,
  selectedConversationId,
  onOpenGuild,
  onOpenChannel,
  pendingFriendCount = 0,
  onOpenDm,
  onCreateLoom,
  onCreateChannel,
  onUpdateGuild,
  invitableFriends = [],
  onInviteMember,
  onLeaveGuild,
  onDeleteGuild,
  onSelectGuild,
  onSelectBrowseHome,
  onShowFriends,
}: BrowseScreenProps) {
  const [focusedGuildId, setFocusedGuildId] = useState<string | null>(selectedGuildId ?? null)
  const [settingsGuildId, setSettingsGuildId] = useState<string | null>(null)
  const [createChannelOpen, setCreateChannelOpen] = useState(false)
  const [createChannelPending, setCreateChannelPending] = useState(false)
  const [createChannelError, setCreateChannelError] = useState<string | null>(null)
  const [createLoomOpen, setCreateLoomOpen] = useState(false)
  const [createLoomPending, setCreateLoomPending] = useState(false)
  const [createLoomError, setCreateLoomError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedGuildId && selectedGuildId !== focusedGuildId) {
      setFocusedGuildId(selectedGuildId)
    }
  }, [focusedGuildId, selectedGuildId])

  useEffect(() => {
    if (!selectedGuildId) {
      setSettingsGuildId(null)
    }
  }, [selectedGuildId])

  const model = useMemo(
    () => buildBrowsePaneModel({
      guilds,
      channels,
      selectedGuildId: focusedGuildId ?? selectedGuildId,
      selectedChannelId,
    }),
    [channels, focusedGuildId, guilds, selectedChannelId, selectedGuildId],
  )

  useEffect(() => {
    if (focusedGuildId === null) {
      return
    }

    if (model.selectedGuild && model.selectedGuild.id !== focusedGuildId) {
      setFocusedGuildId(model.selectedGuild.id)
    }
  }, [focusedGuildId, model.selectedGuild])

  const availableCategories = useMemo(() => (
    channels
      .filter((channel) => channel.guildId === model.selectedGuild?.id && channel.type === 'category')
      .map((channel) => ({ id: channel.id, name: channel.name }))
  ), [channels, model.selectedGuild?.id])

  const dmQuickEntries = useMemo(() => (
    conversations
      .filter((conversation) => conversation.unreadCount > 0)
      .sort((left, right) => right.unreadCount - left.unreadCount)
      .map((conversation) => ({
        id: conversation.id,
        label: conversation.peerName,
        avatarUri: conversation.avatarUri,
        unreadCount: conversation.unreadCount,
      }))
  ), [conversations])

  if (isLoading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={Colors.accentBlue} />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <BrowseServerRail
        guilds={model.guilds}
        dmQuickEntries={dmQuickEntries}
        isHomeSelected={!model.selectedGuild}
        selectedGuildId={model.selectedGuild?.id}
        selectedConversationId={selectedConversationId}
        onCreateLoom={() => {
          setCreateLoomError(null)
          setCreateLoomOpen(true)
        }}
        onSelectHome={() => {
          setFocusedGuildId(null)
          setSettingsGuildId(null)
          onSelectBrowseHome?.()
        }}
        onSelectGuild={(guildId) => {
          setFocusedGuildId(guildId)
          setSettingsGuildId(null)
          onSelectGuild?.(guildId)
        }}
        onSelectDm={(conversationId) => {
          const conversation = conversations.find((item) => item.id === conversationId)
          if (!conversation) {
            return
          }

          setFocusedGuildId(null)
          setSettingsGuildId(null)
          onOpenDm?.(conversation.id, conversation.peerName)
        }}
      />

      <View style={styles.detailPane}>
        {model.selectedGuild ? (
          <>
            <View style={styles.guildHeader}>
              <Pressable
                style={styles.guildTitleButton}
                onPress={() => setSettingsGuildId(model.selectedGuild!.id)}
              >
                <View style={styles.guildTitleRow}>
                  <Text style={styles.guildTitle} numberOfLines={1}>{model.selectedGuild.name}</Text>
                </View>
                {model.selectedGuild.description ? (
                  <Text style={styles.guildSubtitle} numberOfLines={1}>{model.selectedGuild.description}</Text>
                ) : null}
              </Pressable>

              {onCreateChannel ? (
                <Pressable
                  style={styles.guildActionButton}
                  onPress={() => {
                    setCreateChannelError(null)
                    setCreateChannelOpen(true)
                  }}
                >
                  <Plus color={Colors.textPrimary} size={16} strokeWidth={2.2} />
                </Pressable>
              ) : null}
            </View>

            <BrowseChannelList
              guild={model.selectedGuild}
              sections={model.selectedGuildSections}
              selectedChannelId={selectedChannelId}
              onOpenChannel={(guild, channel) => {
                setSettingsGuildId(null)
                onOpenChannel?.({
                  channelId: channel.id,
                  channelName: channel.name,
                  guildId: guild.id,
                  guildName: guild.name,
                })
              }}
            />
          </>
        ) : (
          <BrowseDmHomePane
            conversations={conversations}
            pendingCount={pendingFriendCount}
            selectedConversationId={selectedConversationId}
            onOpenConversation={(conversation) => onOpenDm?.(conversation.id, conversation.peerName)}
            onShowFriends={onShowFriends}
          />
        )}
      </View>

      <CreateLoomModal
        visible={createLoomOpen}
        submitting={createLoomPending}
        error={createLoomError}
        initialName="New Loom"
        onClose={() => {
          if (!createLoomPending) {
            setCreateLoomOpen(false)
            setCreateLoomError(null)
          }
        }}
        onSubmit={async (name) => {
          if (!onCreateLoom) {
            return
          }

          setCreateLoomPending(true)
          setCreateLoomError(null)

          try {
            await onCreateLoom(name)
            setCreateLoomOpen(false)
          } catch (error) {
            setCreateLoomError(error instanceof Error ? error.message : 'Could not create that loom right now.')
          } finally {
            setCreateLoomPending(false)
          }
        }}
      />

      <CreateGuildChannelModal
        visible={createChannelOpen}
        submitting={createChannelPending}
        error={createChannelError}
        availableCategories={availableCategories}
        onClose={() => {
          if (!createChannelPending) {
            setCreateChannelOpen(false)
            setCreateChannelError(null)
          }
        }}
        onSubmit={async ({ name, channelType, parentCategoryId }) => {
          if (!onCreateChannel || !model.selectedGuild) {
            return
          }

          setCreateChannelPending(true)
          setCreateChannelError(null)

          try {
            await onCreateChannel({
              guildId: model.selectedGuild.id,
              name,
              channelType,
              parentCategoryId,
            })
            setCreateChannelOpen(false)
          } catch (error) {
            setCreateChannelError(error instanceof Error ? error.message : 'Could not create that channel right now.')
          } finally {
            setCreateChannelPending(false)
          }
        }}
      />

      {settingsGuildId && model.selectedGuild && settingsGuildId === model.selectedGuild.id ? (
        <View style={styles.settingsOverlay}>
          <GuildSettingsPage
            guild={model.selectedGuild}
            invitableFriends={invitableFriends}
            onClose={() => setSettingsGuildId(null)}
            onSave={onUpdateGuild
              ? async (params) => {
                await onUpdateGuild({ guildId: model.selectedGuild!.id, ...params })
              }
              : undefined}
            onInviteMember={onInviteMember
              ? async (identity) => {
                await onInviteMember(model.selectedGuild!.id, identity)
              }
              : undefined}
            onLeaveGuild={onLeaveGuild
              ? async () => {
                await onLeaveGuild(model.selectedGuild!.id)
                setSettingsGuildId(null)
                setFocusedGuildId(null)
                onSelectBrowseHome?.()
              }
              : undefined}
            onDeleteGuild={onDeleteGuild
              ? async () => {
                await onDeleteGuild(model.selectedGuild!.id)
                setSettingsGuildId(null)
                setFocusedGuildId(null)
                onSelectBrowseHome?.()
              }
              : undefined}
          />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.bgPrimary,
  },
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  detailPane: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Colors.bgSecondary,
  },
  guildHeader: {
    height: 50,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgSecondary,
  },
  guildTitleButton: {
    flex: 1,
    minWidth: 0,
  },
  guildTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guildTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '500',
  },
  guildSubtitle: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  guildActionButton: {
    width: 28,
    height: 28,
    marginLeft: 12,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bgPrimary,
    zIndex: 10,
  },
})
