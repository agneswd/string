import type { LayoutMode } from '../../constants/theme'
import { UserPanelClassic } from './UserPanelClassic'
import { UserPanelString } from './UserPanelString'

export interface UserPanelProps {
  user: {
    username: string
    displayName?: string
    status: string
    avatarUrl?: string
    avatarBytes?: Uint8Array | null
  } | null
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

export type UserPanelVariantProps = Omit<UserPanelProps, 'layoutMode'>

export function UserPanel({ layoutMode = 'classic', ...props }: UserPanelProps) {
  if (layoutMode === 'string') {
    return <UserPanelString {...props} />
  }

  return <UserPanelClassic {...props} />
}
