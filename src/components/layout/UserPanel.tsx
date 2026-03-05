import { Settings, Mic, MicOff, Headphones, HeadphoneOff } from 'lucide-react'
import { getAvatarColor, getInitial, avatarBytesToUrl } from '../../lib/avatarUtils'
import {
  S_userPanel,
  S_userPanelInner,
  S_userPanelName,
  S_userPanelStatus,
  S_userPanelActions,
} from '../../constants/appStyles'

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
}

export function UserPanel({
  user,
  isMuted,
  isDeafened,
  muteColor,
  deafenColor,
  onToggleMute,
  onToggleDeafen,
  onOpenSettings,
  onOpenProfile,
}: UserPanelProps) {
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
              if (s === 'DoNotDisturb') return '#ed4245'
              if (s === 'Offline') return '#747f8d'
              return '#43b581'
            })(),
            border: '2px solid var(--bg-sidebar-dark, #232428)',
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
          backgroundColor: isMuted ? 'rgba(237,66,69,0.2)' : 'transparent',
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
          backgroundColor: isDeafened ? 'rgba(237,66,69,0.2)' : 'transparent',
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
