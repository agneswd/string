import type { CSSProperties } from 'react'

import type { LayoutMode } from '../../../constants/theme'
import { getAvatarColor } from '../../../lib/avatarUtils'
import { T, avatarFrame, avatarImage, avatarInitial } from './callTheme'

export interface CallAvatarProps {
  name: string
  avatarUrl?: string
  profileColor?: string
  speaking?: boolean
  layoutMode?: LayoutMode
  size?: number
  style?: CSSProperties
}

export function CallAvatar({
  name,
  avatarUrl,
  profileColor,
  speaking = false,
  layoutMode = 'classic',
  size = 64,
  style,
}: CallAvatarProps) {
  const resolvedName = name || '?'
  const initial = resolvedName.charAt(0).toUpperCase()
  const fallbackColor = profileColor || getAvatarColor(resolvedName)
  const isString = layoutMode === 'string'

  return (
    <div
      style={{
        ...avatarFrame({ speaking, isString, size }),
        background: avatarUrl ? T.bg : fallbackColor,
        ...style,
      }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={resolvedName} style={avatarImage(isString)} />
      ) : (
        <span style={avatarInitial(size)}>{initial}</span>
      )}
    </div>
  )
}