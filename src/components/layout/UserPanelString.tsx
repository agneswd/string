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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          padding: '4px 0',
        }}
        onClick={onOpenProfile}
        title={`@${user.username ?? 'unknown'}`}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: '8px', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: '8px',
              backgroundColor: getAvatarColor(displayName),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '15px', fontWeight: 700,
            }}>
              {getInitial(displayName)}
            </div>
          )}
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 10, height: 10, borderRadius: '50%',
            backgroundColor: (() => {
              if (user.status === 'DoNotDisturb') return 'var(--status-dnd)'
              if (user.status === 'Offline') return 'var(--status-offline)'
              return 'var(--status-online)'
            })(),
            border: '2px solid var(--bg-deepest)',
          }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: '13px', fontWeight: 600,
            color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayName}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 1 }}>
            {user.status || 'Online'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
        <button onClick={onOpenSettings} title="Settings" aria-label="Open settings" style={{
          width: 28, height: 28, borderRadius: '6px', border: 'none', padding: 0,
          backgroundColor: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)',
        }}>
          <Settings style={{ width: 15, height: 15 }} />
        </button>
        <button onClick={onToggleMute} title={isMuted ? 'Unmute' : 'Mute'} style={{
          width: 28, height: 28, borderRadius: '6px', border: 'none', padding: 0,
          backgroundColor: isMuted ? 'var(--bg-danger-hover)' : 'transparent',
          color: muteColor, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isMuted ? <MicOff style={{ width: 15, height: 15 }} /> : <Mic style={{ width: 15, height: 15 }} />}
        </button>
        <button onClick={onToggleDeafen} title={isDeafened ? 'Undeafen' : 'Deafen'} style={{
          width: 28, height: 28, borderRadius: '6px', border: 'none', padding: 0,
          backgroundColor: isDeafened ? 'var(--bg-danger-hover)' : 'transparent',
          color: deafenColor, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isDeafened ? <HeadphoneOff style={{ width: 15, height: 15 }} /> : <Headphones style={{ width: 15, height: 15 }} />}
        </button>
      </div>
    </div>
  )
}
