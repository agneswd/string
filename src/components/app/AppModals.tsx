/**
 * AppModals
 *
 * Renders all modal dialogs and the context-menu / profile-popup overlay.
 * Receives open-state booleans and callbacks from App.
 */
import { ModalSection } from '../layout/ModalSection'
import { SettingsModal } from '../index'
import { ContextMenuOverlay } from '../ui/ContextMenuOverlay'
import type { ProfileSettingsModalProps } from '../modals/ProfileSettingsModal'
import type { GuildSettingsModalProps } from '../modals/GuildSettingsModal'
import type { LayoutMode } from '../../constants/theme'
import type { ContextMenuOverlayProps } from '../ui/ContextMenuOverlay'
import { GuildProfilePopup, type GuildPopupInfo } from '../social/GuildProfilePopup'

export interface AppModalsProps {
  // Create Guild Modal
  showCreateGuildModal: boolean
  onCloseCreateGuild: () => void
  newGuildName: string
  onGuildNameChange: (v: string) => void
  onCreateGuild: () => void
  // Create Channel Modal
  showCreateChannelModal: boolean
  onCloseCreateChannel: () => void
  newChannelName: string
  onChannelNameChange: (v: string) => void
  newChannelType: 'Category' | 'Text' | 'Voice'
  onChannelTypeChange: (v: 'Category' | 'Text' | 'Voice') => void
  newChannelParentCategoryId: string
  onChannelParentCategoryIdChange: (v: string) => void
  availableChannelCategories: Array<{ id: string; name: string }>
  editingChannelId: string | null
  onCreateChannel: () => void
  // Invite Modal
  showInviteModal: boolean
  onCloseInvite: () => void
  friends: Array<{ id: string; username: string; displayName: string; status: string }>
  onInviteFriend: (id: string) => void
  // Profile Modal
  showProfileModal: boolean
  onCloseProfile: () => void
  currentUser: ProfileSettingsModalProps['currentUser']
  onUpdateProfile: (params: {
    username?: string | null
    displayName?: string | null
    bio?: string | null
    avatarBytes?: Uint8Array | null
    profileColor?: string | null
  }) => Promise<void>
  onSetStatus: (statusTag: string) => void
  showGuildSettingsModal: boolean
  onCloseGuildSettings: () => void
  currentGuild: GuildSettingsModalProps['currentGuild']
  onUpdateGuild: GuildSettingsModalProps['onUpdateGuild']
  // Settings Modal
  showSettingsModal: boolean
  onCloseSettings: () => void
  settingsInitialSection?: 'general' | 'account'
  uiSoundLevel: number
  onUiSoundLevelChange: (v: number) => void
  callSoundLevel: number
  onCallSoundLevelChange: (v: number) => void
  dmAlertSoundLevel: number
  onDmAlertSoundLevelChange: (v: number) => void
  friendAlertSoundLevel: number
  onFriendAlertSoundLevelChange: (v: number) => void
  voiceDefaultVolume: number
  onVoiceDefaultVolumeChange: (v: number) => void
  friendStatusNotificationsEnabled: boolean
  onFriendStatusNotificationsChange: (v: boolean) => void
  dmMessageNotificationsEnabled: boolean
  onDmMessageNotificationsChange: (v: boolean) => void
  layoutMode: LayoutMode
  onLayoutModeChange: (v: LayoutMode) => void
  settingsUsername?: string | null
  settingsDisplayName?: string | null
  settingsAvatarUrl?: string | null
  settingsProfileColor?: string | null
  guildPopup: GuildPopupInfo | null
  onCloseGuildPopup: () => void
  // Context Menu / Profile Popup Overlay
  contextMenuOverlay: Omit<ContextMenuOverlayProps, 'layoutMode'> & { layoutMode?: LayoutMode }
}

export function AppModals({
  showCreateGuildModal, onCloseCreateGuild, newGuildName, onGuildNameChange, onCreateGuild,
  showCreateChannelModal, onCloseCreateChannel, newChannelName, onChannelNameChange,
  newChannelType, onChannelTypeChange, newChannelParentCategoryId, onChannelParentCategoryIdChange, availableChannelCategories, editingChannelId, onCreateChannel,
  showInviteModal, onCloseInvite, friends, onInviteFriend,
  showProfileModal, onCloseProfile, currentUser, onUpdateProfile, onSetStatus,
  showGuildSettingsModal, onCloseGuildSettings, currentGuild, onUpdateGuild,
  showSettingsModal, onCloseSettings, settingsInitialSection,
  uiSoundLevel, onUiSoundLevelChange,
  callSoundLevel, onCallSoundLevelChange,
  dmAlertSoundLevel, onDmAlertSoundLevelChange,
  friendAlertSoundLevel, onFriendAlertSoundLevelChange,
  voiceDefaultVolume, onVoiceDefaultVolumeChange,
  friendStatusNotificationsEnabled, onFriendStatusNotificationsChange,
  dmMessageNotificationsEnabled, onDmMessageNotificationsChange,
  layoutMode, onLayoutModeChange,
  settingsUsername, settingsDisplayName, settingsAvatarUrl, settingsProfileColor,
  guildPopup, onCloseGuildPopup,
  contextMenuOverlay,
}: AppModalsProps) {
  return (
    <>
      <ModalSection
        showCreateGuildModal={showCreateGuildModal}
        onCloseCreateGuild={onCloseCreateGuild}
        newGuildName={newGuildName}
        onGuildNameChange={onGuildNameChange}
        onCreateGuild={onCreateGuild}
        showCreateChannelModal={showCreateChannelModal}
        onCloseCreateChannel={onCloseCreateChannel}
        newChannelName={newChannelName}
        onChannelNameChange={onChannelNameChange}
        newChannelType={newChannelType}
        onChannelTypeChange={onChannelTypeChange}
        newChannelParentCategoryId={newChannelParentCategoryId}
        onChannelParentCategoryIdChange={onChannelParentCategoryIdChange}
        availableChannelCategories={availableChannelCategories}
        editingChannelId={editingChannelId}
        onCreateChannel={onCreateChannel}
        showInviteModal={showInviteModal}
        onCloseInvite={onCloseInvite}
        friends={friends}
        onInviteFriend={onInviteFriend}
        showProfileModal={showProfileModal}
        onCloseProfile={onCloseProfile}
        currentUser={currentUser}
        onUpdateProfile={async (params) => {
          await onUpdateProfile({
            username: params.username ?? undefined,
            displayName: params.displayName ?? undefined,
            bio: params.bio === null ? '' : params.bio,
            avatarBytes: params.avatarBytes === null ? null : (params.avatarBytes ?? undefined),
            profileColor: params.profileColor === null ? '' : params.profileColor,
          })
        }}
        onSetStatus={(statusTag) => {
          void onSetStatus(statusTag as never)
        }}
        showGuildSettingsModal={showGuildSettingsModal}
        onCloseGuildSettings={onCloseGuildSettings}
        currentGuild={currentGuild}
        onUpdateGuild={onUpdateGuild}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={onCloseSettings}
        initialSection={settingsInitialSection}
        uiSoundLevel={uiSoundLevel}
        onUiSoundLevelChange={onUiSoundLevelChange}
        callSoundLevel={callSoundLevel}
        onCallSoundLevelChange={onCallSoundLevelChange}
        dmAlertSoundLevel={dmAlertSoundLevel}
        onDmAlertSoundLevelChange={onDmAlertSoundLevelChange}
        friendAlertSoundLevel={friendAlertSoundLevel}
        onFriendAlertSoundLevelChange={onFriendAlertSoundLevelChange}
        voiceDefaultVolume={voiceDefaultVolume}
        onVoiceDefaultVolumeChange={onVoiceDefaultVolumeChange}
        friendStatusNotificationsEnabled={friendStatusNotificationsEnabled}
        onFriendStatusNotificationsChange={onFriendStatusNotificationsChange}
        dmMessageNotificationsEnabled={dmMessageNotificationsEnabled}
        onDmMessageNotificationsChange={onDmMessageNotificationsChange}
        layoutMode={layoutMode}
        onLayoutModeChange={onLayoutModeChange}
        username={settingsUsername}
        displayName={settingsDisplayName}
        avatarUrl={settingsAvatarUrl}
        profileColor={settingsProfileColor}
      />

      <ContextMenuOverlay {...contextMenuOverlay} />

      {guildPopup && (
        <GuildProfilePopup guild={guildPopup} onClose={onCloseGuildPopup} layoutMode={layoutMode} />
      )}
    </>
  )
}
