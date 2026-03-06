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
  if (!user) return null

  const avatarUrl = user.avatarUrl ?? avatarBytesToUrl(user.avatarBytes)
  const displayName = user.displayName ?? user.username ?? '?'

  return (
    <div style={S_userPanel}>
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
              backgroundColor: getAvatarColor(displayName),
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
            border: '2px solid var(--bg-sidebar-light)',
          }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={S_userPanelName}>
            {displayName}
          </div>
          <div style={S_userPanelStatus}>
            {user.status || 'Online'}
          </div>
        </div>
      </div>
      <div style={S_userPanelActions}>
        <button onClick={onOpenSettings} title="Settings" aria-label="Open settings" style={{
          width: 32, height: 32, borderRadius: '4px', border: 'none', padding: 0,
          backgroundColor: 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted, #b5bac1)',
        }}>
          <Settings style={{ width: 18, height: 18 }} />
        </button>
        <button onClick={onToggleMute} title={isMuted ? 'Unmute' : 'Mute'} style={{
          width: 32, height: 32, borderRadius: '4px', border: 'none', padding: 0,
          backgroundColor: isMuted ? 'var(--bg-danger-hover)' : 'transparent',
          color: muteColor,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isMuted ? (
            <MicOff style={{ width: 20, height: 20, color: muteColor }} />
          ) : (
            <Mic style={{ width: 20, height: 20, color: muteColor }} />
          )}
        </button>
        <button onClick={onToggleDeafen} title={isDeafened ? 'Undeafen' : 'Deafen'} style={{
          width: 32, height: 32, borderRadius: '4px', border: 'none', padding: 0,
          backgroundColor: isDeafened ? 'var(--bg-danger-hover)' : 'transparent',
          color: deafenColor,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isDeafened ? (
            <HeadphoneOff style={{ width: 20, height: 20, color: deafenColor }} />
          ) : (
            <Headphones style={{ width: 20, height: 20, color: deafenColor }} />
          )}
        </button>
      </div>
    </div>
  )
}
