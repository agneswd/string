import React, { useState, useMemo, useCallback, type CSSProperties } from 'react'
import { Volume2, PhoneOff, Monitor, MicOff, HeadphoneOff } from 'lucide-react'

/* ── Connected-user representation ── */
export interface VoiceUser {
  id: string
  name: string
  avatarUrl?: string
  speaking?: boolean
  muted?: boolean
  deafened?: boolean
}

export interface VoicePanelProps {
  connected: boolean
  streaming: boolean
  channelName?: string
  connectedUsers?: VoiceUser[]
  remoteSharersCount?: number
  onLeave?: () => void
  onToggleStream?: () => void
  onStartSharing?: () => void
  onStopSharing?: () => void
  className?: string
}

/* ── Inline-style helpers ── */
const styles = {
  root: {
    background: 'var(--bg-sidebar-dark, #1e1f22)',
    borderTop: '1px solid var(--border-subtle, #2d3342)',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    userSelect: 'none',
    fontSize: 13,
  } as CSSProperties,

  /* compact status bar */
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
  } as CSSProperties,

  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#3ba55d',
    flexShrink: 0,
  } as CSSProperties,

  statusInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    minWidth: 0,
  } as CSSProperties,

  statusText: {
    fontWeight: 600,
    fontSize: 13,
    color: '#3ba55d',
    lineHeight: 1.2,
  } as CSSProperties,

  channelName: {
    fontSize: 11,
    color: 'var(--text-secondary, #9ca3af)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    lineHeight: 1.2,
  } as CSSProperties,

  /* user list */
  userList: {
    listStyle: 'none',
    margin: 0,
    padding: '0 8px 6px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    maxHeight: 160,
    overflowY: 'auto',
  } as CSSProperties,

  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '3px 6px',
    borderRadius: 4,
  } as CSSProperties,

  avatar: (speaking: boolean): CSSProperties => ({
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: 'var(--bg-active, #3a4152)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-primary, #f0f1f5)',
    flexShrink: 0,
    boxSizing: 'border-box',
    border: speaking ? '2px solid #3ba55d' : '2px solid transparent',
    transition: 'border-color .15s ease',
    overflow: 'hidden',
  }),

  userName: (muted: boolean): CSSProperties => ({
    fontSize: 13,
    color: muted ? 'var(--text-muted, #6b7280)' : 'var(--text-primary, #f0f1f5)',
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),

  userIcons: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  } as CSSProperties,

  disconnectBtn: (hovered: boolean): CSSProperties => ({
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ed4245',
    color: '#fff',
    transition: 'opacity .15s ease, filter .15s ease',
    padding: 0,
    flexShrink: 0,
    opacity: hovered ? 0.85 : 1,
    filter: hovered ? 'brightness(1.15)' : 'none',
  }),
}

/* ── SVG Icons ── */

const SpeakerIcon = () => <Volume2 style={{ width: 12, height: 12 }} />

const DisconnectIcon = () => <PhoneOff style={{ width: 14, height: 14 }} />

const SmallMuteIcon = () => (
  <MicOff size={16} style={{ opacity: 0.7, color: 'var(--text-muted, #6b7280)' }} />
)

const SmallDeafIcon = () => (
  <HeadphoneOff size={16} style={{ opacity: 0.7, color: 'var(--text-muted, #6b7280)' }} />
)

/* ── Component ── */

/* ── Static share button styles ── */
const shareButtonBase: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  flexShrink: 0,
}
const shareButtonActive: CSSProperties = { ...shareButtonBase, backgroundColor: 'rgba(59,165,93,0.2)', color: '#3ba55d' }
const shareButtonInactive: CSSProperties = { ...shareButtonBase, backgroundColor: 'transparent', color: '#b5bac1' }

export const VoicePanel = React.memo(function VoicePanel({
  connected,
  streaming,
  channelName,
  connectedUsers = [],
  onLeave,
  onStartSharing,
  onStopSharing,
  className,
}: VoicePanelProps) {
  const [hovered, setHovered] = useState(false)
  const handleMouseEnter = useCallback(() => setHovered(true), [])
  const handleMouseLeave = useCallback(() => setHovered(false), [])

  const rootClassName = useMemo(
    () => ['discord-shell__voice', 'tw-pane', 'tw-voice-panel', className ?? ''].filter(Boolean).join(' '),
    [className],
  )

  const disconnectStyle = useMemo(() => styles.disconnectBtn(hovered), [hovered])
  const shareBtnStyle = streaming ? shareButtonActive : shareButtonInactive

  if (!connected) {
    return null
  }

  return (
    <section className={rootClassName} style={styles.root} aria-label="Voice controls">
      {/* ── Compact status bar ── */}
      <div style={styles.statusBar}>
        <span style={styles.dot} />
        <div style={styles.statusInfo as CSSProperties}>
          <span style={styles.statusText}>Voice Connected</span>
          {channelName && (
            <span style={styles.channelName as CSSProperties} title={channelName}>
              <SpeakerIcon /> {channelName}
            </span>
          )}
        </div>
        {onStartSharing && onStopSharing && (
          <button
            type="button"
            onClick={streaming ? onStopSharing : onStartSharing}
            title={streaming ? 'Stop Sharing' : 'Share Screen'}
            aria-label={streaming ? 'Stop Sharing' : 'Share Screen'}
            style={shareBtnStyle}
          >
            <Monitor style={{ width: 20, height: 20 }} />
          </button>
        )}
        <button
          type="button"
          onClick={onLeave}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          aria-label="Disconnect"
          title="Disconnect"
          style={disconnectStyle}
        >
          <DisconnectIcon />
        </button>
      </div>

      {/* ── Connected users ── */}
      {connectedUsers.length > 0 && (
        <ul style={styles.userList}>
          {connectedUsers.map((user) => (
            <VoiceUserRow key={user.id} user={user} />
          ))}
        </ul>
      )}
    </section>
  )
})

/* ── Extracted per-user row to avoid re-rendering all rows ── */
const imgStyle: CSSProperties = { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }

const VoiceUserRow = React.memo(function VoiceUserRow({ user }: { user: VoiceUser }) {
  const avatarStyle = useMemo(() => styles.avatar(!!user.speaking), [user.speaking])
  const nameStyle = useMemo(() => styles.userName(!!user.muted), [user.muted])

  return (
    <li style={styles.userRow}>
      <span style={avatarStyle}>
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" style={imgStyle} />
        ) : (
          user.name.charAt(0).toUpperCase()
        )}
      </span>
      <span style={nameStyle}>{user.name}</span>
      <span style={styles.userIcons}>
        {user.muted && <SmallMuteIcon />}
        {user.deafened && <SmallDeafIcon />}
      </span>
    </li>
  )
})
