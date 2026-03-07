import { CreateGuildModal } from '../modals/CreateGuildModal'
import { CreateChannelModal } from '../modals/CreateChannelModal'
import { InviteFriendsModal } from '../modals/InviteFriendsModal'
import { ProfileSettingsModal, type ProfileSettingsModalProps } from '../modals/ProfileSettingsModal'
import { GuildSettingsModal, type GuildSettingsModalProps } from '../modals/GuildSettingsModal'

export interface ModalSectionProps {
  // Create Guild
  showCreateGuildModal: boolean
  onCloseCreateGuild: () => void
  newGuildName: string
  onGuildNameChange: (v: string) => void
  onCreateGuild: () => void
  // Create Channel
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
  // Invite Friends
  showInviteModal: boolean
  onCloseInvite: () => void
  friends: Array<any>
  onInviteFriend: (identity: unknown) => void
  // Profile Settings
  showProfileModal: boolean
  onCloseProfile: () => void
  currentUser: ProfileSettingsModalProps['currentUser']
  onUpdateProfile: (params: { username?: string | null; displayName?: string | null; bio?: string | null; avatarBytes?: Uint8Array | null; profileColor?: string | null }) => Promise<void>
  onSetStatus: (tag: string) => void
  showGuildSettingsModal: boolean
  onCloseGuildSettings: () => void
  currentGuild: GuildSettingsModalProps['currentGuild']
  onUpdateGuild: GuildSettingsModalProps['onUpdateGuild']
}

export function ModalSection({
  showCreateGuildModal, onCloseCreateGuild, newGuildName, onGuildNameChange, onCreateGuild,
  showCreateChannelModal, onCloseCreateChannel, newChannelName, onChannelNameChange, newChannelType, onChannelTypeChange, newChannelParentCategoryId, onChannelParentCategoryIdChange, availableChannelCategories, editingChannelId, onCreateChannel,
  showInviteModal, onCloseInvite, friends, onInviteFriend,
  showProfileModal, onCloseProfile, currentUser, onUpdateProfile, onSetStatus,
  showGuildSettingsModal, onCloseGuildSettings, currentGuild, onUpdateGuild,
}: ModalSectionProps) {
  return (
    <>
      <CreateGuildModal
        isOpen={showCreateGuildModal}
        onClose={onCloseCreateGuild}
        guildName={newGuildName}
        onGuildNameChange={onGuildNameChange}
        onSubmit={onCreateGuild}
      />

      <CreateChannelModal
        isOpen={showCreateChannelModal}
        onClose={onCloseCreateChannel}
        channelName={newChannelName}
        onChannelNameChange={onChannelNameChange}
        channelType={newChannelType}
        onChannelTypeChange={onChannelTypeChange}
        parentCategoryId={newChannelParentCategoryId}
        onParentCategoryIdChange={onChannelParentCategoryIdChange}
        availableCategories={availableChannelCategories}
        mode={editingChannelId ? 'edit' : 'create'}
        onSubmit={onCreateChannel}
      />

      <InviteFriendsModal
        isOpen={showInviteModal}
        onClose={onCloseInvite}
        friends={friends}
        onInviteFriend={onInviteFriend}
      />

      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={onCloseProfile}
        currentUser={currentUser}
        onUpdateProfile={onUpdateProfile}
        onSetStatus={onSetStatus}
      />

      <GuildSettingsModal
        isOpen={showGuildSettingsModal}
        onClose={onCloseGuildSettings}
        currentGuild={currentGuild}
        onUpdateGuild={onUpdateGuild}
      />
    </>
  )
}
