import type { LayoutMode } from '../../constants/theme'
import { TopNavBarClassic } from './TopNavBarClassic'
import { TopNavBarString } from './TopNavBarString'

export interface TopNavBarProps {
  isDmMode: boolean
  isHomeView: boolean
  dmName?: string
  guildName?: string
  selectedDmChannel: boolean
  currentVoiceState: boolean
  outgoingCall: boolean
  dmCallActive: boolean
  selectedDmChannelId?: string
  onCancelOutgoingCall?: () => void
  showMemberList: boolean
  onToggleMemberList: () => void
  onInitiateDmCall: (channelId: string) => void
  /** Controls the visual style — string shows a breadcrumb product bar */
  layoutMode?: LayoutMode
  /** Name of the active channel (for string breadcrumb) */
  channelName?: string
}

export type TopNavBarVariantProps = Omit<TopNavBarProps, 'layoutMode'>

export function TopNavBar({ layoutMode = 'classic', ...props }: TopNavBarProps) {
  if (layoutMode === 'string') {
    return <TopNavBarString {...props} />
  }

  return <TopNavBarClassic {...props} />
}

