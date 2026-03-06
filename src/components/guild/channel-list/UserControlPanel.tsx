import React from 'react'
import { Mic, MicOff, Headphones, HeadphoneOff } from 'lucide-react'
import { resolveS, resolveColors } from './styles'
import type { UserPanelInfo, LayoutMode } from './types'

interface UserControlPanelProps {
  userPanel: UserPanelInfo
  isMuted: boolean
  isDeafened: boolean
  onMuteToggle?: () => void
  onDeafenToggle?: () => void
  /** Visual mode — defaults to 'classic' */
  mode?: LayoutMode
}

/**
 * Bottom user status + mic/deafen control strip.
 * Flat surface, no chrome, thin border-top separator.
 */
export const UserControlPanel = React.memo(function UserControlPanel({
  userPanel,
  isMuted,
  isDeafened,
  onMuteToggle,
  onDeafenToggle,
  mode = 'classic',
}: UserControlPanelProps) {
  const S = resolveS(mode)
  const COLORS = resolveColors(mode)
  return (
    <div
      style={S.userPanel}
      title={userPanel.username ? `@${userPanel.username}` : undefined}
    >
      {/* Avatar */}
      <div style={{ ...S.avatar, backgroundColor: userPanel.avatarUrl ? 'transparent' : S.avatar.backgroundColor }}>
        {userPanel.avatarUrl ? (
          <img
            src={userPanel.avatarUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          />
        ) : (
          userPanel.displayName.charAt(0).toUpperCase()
        )}
      </div>

      {/* Name + status */}
      <div style={S.userInfo}>
        <span style={S.userName}>{userPanel.displayName}</span>
        {userPanel.status && (
          <span style={S.userStatus}>{userPanel.status}</span>
        )}
      </div>

      {/* Controls */}
      {onMuteToggle && (
        <button
          type="button"
          className="clp-control-btn"
          style={S.controlBtn(isMuted)}
          onClick={onMuteToggle}
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          aria-pressed={isMuted}
        >
          {isMuted ? (
            <MicOff size={18} color={COLORS.iconMuted} aria-hidden="true" />
          ) : (
            <Mic size={18} aria-hidden="true" />
          )}
        </button>
      )}

      {onDeafenToggle && (
        <button
          type="button"
          className="clp-control-btn"
          style={S.controlBtn(isDeafened)}
          onClick={onDeafenToggle}
          title={isDeafened ? 'Undeafen' : 'Deafen'}
          aria-label={isDeafened ? 'Undeafen' : 'Deafen'}
          aria-pressed={isDeafened}
        >
          {isDeafened ? (
            <HeadphoneOff size={18} color={COLORS.iconMuted} aria-hidden="true" />
          ) : (
            <Headphones size={18} aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  )
})
