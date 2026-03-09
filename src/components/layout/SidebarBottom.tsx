import type { LayoutMode } from '../../constants/theme'
import type { UserPanelProps } from './UserPanel'
import { SidebarBottomClassic } from './SidebarBottomClassic'
import { SidebarBottomString } from './SidebarBottomString'

export interface SidebarBottomProps {
  showVoicePanel?: boolean
  currentVoiceState: {
    isMuted?: boolean
    isDeafened?: boolean
    isStreaming?: boolean
  } | null
  outgoingCall?: boolean
  outgoingCallLabel?: string
  onLeave: () => void
  remoteSharersCount: number
  onStartSharing: () => void
  onStopSharing: () => void
  user: UserPanelProps['user']
  isMuted: boolean
  isDeafened: boolean
  muteColor: string
  deafenColor: string
  onToggleMute: () => void
  onToggleDeafen: () => void
  onOpenSettings: () => void
  onOpenProfile: () => void
  layoutMode?: LayoutMode
}

export type SidebarBottomVariantProps = Omit<SidebarBottomProps, 'layoutMode'>

export function SidebarBottom({ layoutMode = 'classic', ...props }: SidebarBottomProps) {
  if (layoutMode === 'string') {
    return <SidebarBottomString {...props} />
  }

  return <SidebarBottomClassic {...props} />
}
