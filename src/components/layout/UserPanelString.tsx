import type { CSSProperties, ReactNode } from 'react'
import { Settings, Mic, MicOff, Headphones, HeadphoneOff } from 'lucide-react'
import { getAvatarColor, getInitial, avatarBytesToUrl } from '../../lib/avatarUtils'
import type { UserPanelVariantProps } from './UserPanel'

export function UserPanelString({
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
  if (!user) return null

  const avatarUrl = user.avatarUrl ?? avatarBytesToUrl(user.avatarBytes)
  const displayName = user.displayName ?? user.username ?? '?'

  const statusColor = (() => {
    if (user.status === 'DoNotDisturb') return 'var(--status-dnd)'
    if (user.status === 'Offline') return 'var(--status-offline)'
    return 'var(--status-online)'
  })()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Identity row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          padding: '3px 0',
        }}
        onClick={onOpenProfile}
        title={`@${user.username ?? 'unknown'}`}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              style={{ width: 32, height: 32, borderRadius: '8px', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: '8px',
              backgroundColor: getAvatarColor(displayName),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '13px', fontWeight: 600,
            }}>
              {getInitial(displayName)}
            </div>
          )}
          {/* Status dot */}
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: statusColor,
            border: '2px solid var(--bg-deepest)',
          }} />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayName}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--text-muted)',
            marginTop: 1,
            letterSpacing: '0.03em',
          }}>
            {user.status?.toLowerCase() ?? 'online'}
          </div>
        </div>
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', gap: '3px', justifyContent: 'flex-end' }}>
        <IconButton onClick={onOpenSettings} title="Settings" aria-label="Open settings">
          <Settings style={{ width: 14, height: 14 }} />
        </IconButton>
        <IconButton
          onClick={onToggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          active={isMuted}
          danger={isMuted}
          style={{ color: muteColor }}
        >
          {isMuted
            ? <MicOff style={{ width: 14, height: 14 }} />
            : <Mic style={{ width: 14, height: 14 }} />
          }
        </IconButton>
        <IconButton
          onClick={onToggleDeafen}
          title={isDeafened ? 'Undeafen' : 'Deafen'}
          active={isDeafened}
          danger={isDeafened}
          style={{ color: deafenColor }}
        >
          {isDeafened
            ? <HeadphoneOff style={{ width: 14, height: 14 }} />
            : <Headphones style={{ width: 14, height: 14 }} />
          }
        </IconButton>
      </div>
    </div>
  )
}

// ── Small icon button used in the user panel ────────────────────────────────
function IconButton({
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
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={ariaLabel ?? title}
      style={{
        width: 26,
        height: 26,
        borderRadius: '2px',
        border: '1px solid transparent',
        padding: 0,
        backgroundColor: danger && active ? 'var(--bg-danger-hover)' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        transition: 'background-color 0.1s, border-color 0.1s, color 0.1s',
        ...extraStyle,
      }}
    >
      {children}
    </button>
  )
}
