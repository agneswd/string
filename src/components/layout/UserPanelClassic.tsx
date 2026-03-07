import { useState, type CSSProperties, type ReactNode } from 'react'
import { Settings, Mic, MicOff, Headphones, HeadphoneOff } from 'lucide-react'
import { getAvatarColor, getInitial, avatarBytesToUrl } from '../../lib/avatarUtils'
import {
  S_userPanel,
  S_userPanelInner,
  S_userPanelName,
  S_userPanelStatus,
  S_userPanelActions,
} from '../../constants/appStyles'
import type { UserPanelVariantProps } from './UserPanel'

export function UserPanelClassic({
  user,
  isMuted,
  isDeafened,
  muteColor,
  deafenColor,
  onToggleMute,
  onToggleDeafen,
  onOpenSettings,
  onOpenProfile,
}: UserPanelVariantProps) {
  const [hovered, setHovered] = useState(false)

  if (!user) return null

  const avatarUrl = user.avatarUrl ?? avatarBytesToUrl(user.avatarBytes)
  const displayName = user.displayName ?? user.username ?? '?'
  const secondaryLabel = hovered ? `@${user.username ?? 'unknown'}` : (user.status || 'Online')

  return (
    <div
      style={{ ...S_userPanel, borderTop: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{ ...S_userPanelInner, cursor: 'pointer' }}
        onClick={onOpenProfile}
        title={`@${user.username ?? 'unknown'}`}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{
              width: 32, height: 32, borderRadius: '50%', objectFit: 'cover',
            }} />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              backgroundColor: user.profileColor || getAvatarColor(displayName),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '14px', fontWeight: 600,
            }}>
              {getInitial(displayName)}
            </div>
          )}
          <div style={{
            position: 'absolute', bottom: -1, right: -1,
            width: 10, height: 10, borderRadius: '50%',
            backgroundColor: (() => {
              const s = user.status
              if (s === 'DoNotDisturb') return 'var(--status-dnd)'
              if (s === 'Offline') return 'var(--status-offline)'
              return 'var(--status-online)'
            })(),
            border: '2px solid var(--bg-panel)',
          }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={S_userPanelName}>
            {displayName}
          </div>
          <div style={S_userPanelStatus}>
            {secondaryLabel}
          </div>
        </div>
      </div>
      <div style={S_userPanelActions}>
        <ClassicIconButton onClick={onOpenSettings} title="Settings" aria-label="Open settings">
          <Settings style={{ width: 18, height: 18 }} />
        </ClassicIconButton>
        <ClassicIconButton
          onClick={onToggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          active={isMuted}
          danger={isMuted}
          style={{ color: isMuted ? muteColor : 'var(--text-secondary)' }}
        >
          {isMuted ? (
            <MicOff style={{ width: 20, height: 20, color: muteColor }} />
          ) : (
            <Mic style={{ width: 20, height: 20, color: muteColor }} />
          )}
        </ClassicIconButton>
        <ClassicIconButton
          onClick={onToggleDeafen}
          title={isDeafened ? 'Undeafen' : 'Deafen'}
          active={isDeafened}
          danger={isDeafened}
          style={{ color: isDeafened ? deafenColor : 'var(--text-secondary)' }}
        >
          {isDeafened ? (
            <HeadphoneOff style={{ width: 20, height: 20, color: deafenColor }} />
          ) : (
            <Headphones style={{ width: 20, height: 20, color: deafenColor }} />
          )}
        </ClassicIconButton>
      </div>
    </div>
  )
}

function ClassicIconButton({
  children,
  onClick,
  title,
  'aria-label': ariaLabel,
  active,
  danger,
  style: extraStyle,
}: {
  children: ReactNode
  onClick?: () => void
  title?: string
  'aria-label'?: string
  active?: boolean
  danger?: boolean
  style?: CSSProperties
}) {
  const [hovered, setHovered] = useState(false)

  const backgroundColor = danger && active
    ? 'var(--bg-danger-hover)'
    : hovered
      ? 'var(--bg-hover)'
      : 'transparent'

  const color = active
    ? undefined
    : hovered
      ? 'var(--text-primary)'
      : 'var(--text-secondary)'

  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={ariaLabel ?? title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 32,
        height: 32,
        borderRadius: '4px',
        border: 'none',
        padding: 0,
        backgroundColor,
        color,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.1s, color 0.1s',
        ...extraStyle,
      }}
    >
      {children}
    </button>
  )
}
