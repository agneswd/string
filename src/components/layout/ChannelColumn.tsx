import type { ReactNode } from 'react'
import { DmListPane, type DmListItem, type DmChannelId } from '../dm/DmListPane'
import { ChannelListPane, type ChannelListItem, type VoiceChannelUser } from '../guild/ChannelListPane'
import type { GuildId } from '../guild/ServerListPane'
import type { LayoutMode } from '../../constants/theme'

export interface ChannelColumnProps {
  isDmMode: boolean
  selectedGuildId?: string
  dmTopPanel?: ReactNode
  // DM list
  dmListItems: DmListItem[]
  selectedDmChannelId?: DmChannelId
  onSelectDmChannel: (id: DmChannelId) => void
  onLeaveDmChannel: (id: DmChannelId) => void
  onShowFriends: () => void
  activeCallChannelIds: Set<string>
  // Channel List
  guildName?: string
  channels: ChannelListItem[]
  selectedTextChannelId?: GuildId
  onSelectChannel: (id: GuildId) => void
  onCreateChannel: (parentCategoryId?: GuildId | null) => void
  onCreateCategory?: () => void
  onEditChannel?: (id: GuildId) => void
  onDeleteChannel?: (id: GuildId) => void
  onSaveChannelLayout?: (layout: import('../guild/ChannelListPane').ChannelLayoutUpdateItem[]) => void
  onViewScreenShare: (key: string | null) => void
  voiceChannelUsers?: Map<string | number, VoiceChannelUser[]>
  currentVoiceChannelId?: string | number
  locallyMutedUsers: Set<string>
  onToggleLocalMuteUser: (id: string) => void
  localIdentity?: string
  getAvatarUrl: (id: string) => string | undefined
  /** Controls which DM list variant is rendered. Defaults to 'classic'. */
  layoutMode?: LayoutMode
}

export function ChannelColumn(props: ChannelColumnProps) {
  if (props.isDmMode || !props.selectedGuildId) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-2">
        {props.dmTopPanel}
        <DmListPane
          channels={props.dmListItems}
          selectedChannelId={props.selectedDmChannelId}
          onSelectChannel={props.onSelectDmChannel}
          onLeaveChannel={props.onLeaveDmChannel}
          onStartVoiceCall={undefined}
          onCreateChannel={undefined}
          createButtonLabel="New DM"
          onShowFriends={props.onShowFriends}
          activeCallChannelIds={props.activeCallChannelIds}
          layoutMode={props.layoutMode ?? 'classic'}
        />
      </div>
    )
  }

  return (
    <ChannelListPane
      layoutMode={props.layoutMode ?? 'classic'}
      guildName={props.guildName}
      channels={props.channels}
      selectedChannelId={props.selectedTextChannelId}
      onSelectChannel={props.onSelectChannel}
      onCreateChannel={props.onCreateChannel}
      onCreateCategory={props.onCreateCategory}
      onEditChannel={props.onEditChannel}
      onDeleteChannel={props.onDeleteChannel}
      onSaveLayout={props.onSaveChannelLayout}
      onViewScreenShare={props.onViewScreenShare}
      voiceChannelUsers={props.voiceChannelUsers}
      currentVoiceChannelId={props.currentVoiceChannelId}
      locallyMutedUsers={props.locallyMutedUsers}
      onToggleLocalMuteUser={props.onToggleLocalMuteUser}
      localIdentity={props.localIdentity}
      getAvatarUrl={props.getAvatarUrl}
    />
  )
}
