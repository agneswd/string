import React from 'react'
import type { LayoutMode } from '../../constants/theme'
import { ChatViewPane, type ChatMessageItem } from '../chat/ChatViewPane'
import { type ReactionBarItem } from '../chat/ReactionBar'
import type { TypingIndicatorUser } from '../chat/TypingIndicator'
import { DmCallOverlay, type CallUser } from '../voice/DmCallOverlay'
import { FriendRequestPanel, type FriendRequestItemId, type FriendUserId, type IncomingFriendRequestItem, type OutgoingFriendRequestItem, type FriendListItem, type GuildInviteItem } from '../social/FriendRequestPanel'

export interface MessageAreaProps {
  layoutMode?: LayoutMode
  isMobile?: boolean
  // View state
  isInDmVoice: boolean
  isDmMode: boolean
  isHomeView: boolean
  selectedDmChannelId?: string
  dmVoiceChannelId?: string | null

  // Call overlay props
  localUser: CallUser
  remoteUser: CallUser
  onMute: () => void
  onDeafen: () => void
  onScreenShare: () => void
  onHangUp: () => void
  isMuted: boolean
  isDeafened: boolean
  isScreenSharing: boolean
  isLocalSpeaking: boolean
  isRemoteSpeaking: boolean
  remoteScreenStream: MediaStream | null
  dmRemoteScreenShareKey?: string | null
  onViewScreenShareFullscreen?: (key: string | null) => void

  // Chat props
  channelName?: string
  messages: ChatMessageItem[]
  dmMessages: ChatMessageItem[]
  composerValue: string
  onComposerChange: (v: string) => void
  onSend: (msg: string) => void
  getDmReactionsForMessage: (messageId: ChatMessageItem['id']) => ReadonlyArray<ReactionBarItem>
  getReactionsForMessage: (messageId: ChatMessageItem['id']) => ReadonlyArray<ReactionBarItem>
  onToggleDmReaction: (messageId: ChatMessageItem['id'], emoji: string) => void
  onToggleReaction: (messageId: ChatMessageItem['id'], emoji: string) => void
  currentUserId?: string
  onViewProfile?: (user: { displayName: string; username: string }, x: number, y: number) => void
  getAvatarUrl: (authorId: string) => string | undefined
  onDeleteMessage: (messageId: ChatMessageItem['id']) => void
  onEditMessage: (messageId: ChatMessageItem['id'], newContent: string) => void
  dmPartnerAvatarUrl?: string
  dmPartnerProfileColor?: string
  selectedTextChannel: { name: string } | null
  dmCallActive: boolean
  activeChannelName?: string
  activeMessages: ChatMessageItem[]

  // Friend panel props
  friendRequestUsername: string
  onRequestUsernameChange: (v: string) => void
  onSendRequest: (username: string) => void
  incomingRequests: IncomingFriendRequestItem[]
  onAcceptRequest: (requestId: FriendRequestItemId) => void
  onDeclineRequest: (requestId: FriendRequestItemId) => void
  outgoingRequests: OutgoingFriendRequestItem[]
  onCancelOutgoingRequest: (requestId: FriendRequestItemId) => void
  friends: FriendListItem[]
  onStartDm: (friendId: FriendUserId) => void
  onRemoveFriend: (friendId: FriendUserId) => void
  guildInvites?: GuildInviteItem[]
  onAcceptGuildInvite?: (inviteId: string) => void
  onDeclineGuildInvite?: (inviteId: string) => void
  typingUsers?: TypingIndicatorUser[]
}

export function MessageArea(props: MessageAreaProps) {
  const {
    layoutMode = 'classic', isMobile = false,
    isInDmVoice, isDmMode, isHomeView, selectedDmChannelId, dmVoiceChannelId,
    localUser, remoteUser, onMute, onDeafen, onScreenShare, onHangUp,
    isMuted, isDeafened, isScreenSharing, isLocalSpeaking, isRemoteSpeaking,
    remoteScreenStream, dmRemoteScreenShareKey, onViewScreenShareFullscreen,
    activeChannelName, activeMessages, dmMessages,
    composerValue, onComposerChange, onSend,
    getDmReactionsForMessage, getReactionsForMessage,
    onToggleDmReaction, onToggleReaction,
    currentUserId, onViewProfile, getAvatarUrl,
    onDeleteMessage, onEditMessage,
    dmPartnerAvatarUrl, dmPartnerProfileColor,
    selectedTextChannel, dmCallActive,
    friendRequestUsername, onRequestUsernameChange, onSendRequest,
    incomingRequests, onAcceptRequest, onDeclineRequest,
    outgoingRequests, onCancelOutgoingRequest,
    friends, onStartDm, onRemoveFriend,
    guildInvites, onAcceptGuildInvite, onDeclineGuildInvite,
    typingUsers,
  } = props

  // DM voice call view with embedded chat
  if (isInDmVoice && isDmMode && selectedDmChannelId === dmVoiceChannelId) {
    return (
      <DmCallOverlay
        layoutMode={layoutMode}
        localUser={localUser}
        remoteUser={remoteUser}
        hideScreenShare={isMobile}
        onMute={onMute}
        onDeafen={onDeafen}
        onScreenShare={onScreenShare}
        onHangUp={onHangUp}
        isMuted={isMuted}
        isDeafened={isDeafened}
        isScreenSharing={isScreenSharing}
        isLocalSpeaking={isLocalSpeaking}
        isRemoteSpeaking={isRemoteSpeaking}
        remoteScreenStream={remoteScreenStream}
        callState="connected"
        onViewScreenShareFullscreen={remoteScreenStream && onViewScreenShareFullscreen
          ? () => onViewScreenShareFullscreen(dmRemoteScreenShareKey ?? null)
          : undefined}
        chatPanel={
          <ChatViewPane
            layoutMode={layoutMode}
            channelName={activeChannelName}
            conversationKey={selectedDmChannelId ? `dm:${selectedDmChannelId}` : `dm-name:${activeChannelName ?? ''}`}
            showHeader={false}
            messages={dmMessages}
            composerValue={composerValue}
            onComposerChange={onComposerChange}
            onSend={onSend}
            getReactionsForMessage={getDmReactionsForMessage}
            onToggleReaction={onToggleDmReaction}
            currentUserId={currentUserId}
            composerPlaceholder={`Message ${activeChannelName ?? 'direct message'}`}
            onViewProfile={onViewProfile}
            getAvatarUrl={getAvatarUrl}
            onDeleteMessage={onDeleteMessage}
            onEditMessage={onEditMessage}
            isDm={true}
            avatarUrl={dmPartnerAvatarUrl}
            profileColor={dmPartnerProfileColor}
            typingUsers={typingUsers}
          />
        }
      />
    )
  }

  // Home view — friend request panel
  if (isHomeView) {
    return (
      <FriendRequestPanel
        layoutMode={layoutMode}
        requestUsername={friendRequestUsername}
        onRequestUsernameChange={onRequestUsernameChange}
        onSendRequest={onSendRequest}
        incomingRequests={incomingRequests}
        onAcceptRequest={onAcceptRequest}
        onDeclineRequest={onDeclineRequest}
        outgoingRequests={outgoingRequests}
        onCancelOutgoingRequest={onCancelOutgoingRequest}
        friends={friends}
        onStartDm={onStartDm}
        onRemoveFriend={onRemoveFriend}
        guildInvites={guildInvites}
        onAcceptGuildInvite={onAcceptGuildInvite}
        onDeclineGuildInvite={onDeclineGuildInvite}
        className="h-full"
      />
    )
  }

  // Default — chat view
  return (
    <ChatViewPane
      layoutMode={layoutMode}
      channelName={activeChannelName}
      conversationKey={isDmMode ? `dm:${selectedDmChannelId ?? ''}` : `channel:${selectedTextChannel?.name ?? activeChannelName ?? ''}`}
      showHeader={false}
      messages={activeMessages}
      composerValue={composerValue}
      onComposerChange={onComposerChange}
      onSend={onSend}
      getReactionsForMessage={isDmMode ? getDmReactionsForMessage : getReactionsForMessage}
      onToggleReaction={isDmMode ? onToggleDmReaction : onToggleReaction}
      currentUserId={currentUserId}
      composerPlaceholder={
        isDmMode
          ? `Message ${activeChannelName ?? 'direct message'}`
          : selectedTextChannel
            ? `Message #${selectedTextChannel.name}`
            : 'Select a text channel or direct message'
      }
      className="h-full"
      callActive={!!dmCallActive}
      onViewProfile={onViewProfile}
      getAvatarUrl={getAvatarUrl}
      onDeleteMessage={onDeleteMessage}
      onEditMessage={onEditMessage}
      isDm={isDmMode}
      avatarUrl={isDmMode ? dmPartnerAvatarUrl : undefined}
      profileColor={isDmMode ? dmPartnerProfileColor : undefined}
      typingUsers={typingUsers}
    />
  )
}
