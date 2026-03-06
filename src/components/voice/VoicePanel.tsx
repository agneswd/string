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
    background: 'var(--bg-sidebar-dark, #111111)',
    borderTop: '1px solid var(--border-subtle, #2a2a2a)',
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
    width: 6,
    height: 6,
    borderRadius: 1,
    background: '#5a9e7a',
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
    fontFamily: 'var(--font-mono, "SFMono-Regular", Consolas, monospace)',
    fontWeight: 500,
    fontSize: 11,
    letterSpacing: '0.04em',
    color: '#5a9e7a',
    lineHeight: 1.2,
  } as CSSProperties,

  channelName: {
    fontFamily: 'var(--font-mono, "SFMono-Regular", Consolas, monospace)',
    fontSize: 11,
    color: 'var(--text-muted, #6b6860)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    lineHeight: 1.2,
    letterSpacing: '0.03em',
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
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-active, #2a2a2a)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--text-primary, #d4d0cb)',
    flexShrink: 0,
    boxSizing: 'border-box',
    // muted speaking ring – no glow, no shadow
    border: speaking ? '2px solid #5a9e7a' : '2px solid transparent',
    transition: 'border-color .15s ease',
    overflow: 'hidden',
  }),

  userName: (muted: boolean): CSSProperties => ({
    fontSize: 12,
    color: muted ? 'var(--text-muted, #6b6860)' : 'var(--text-primary, #d4d0cb)',
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
    // square – no pill shape
    borderRadius: 2,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: hovered ? '#a02828' : '#b03030',
    color: '#d4d0cb',
    transition: 'background .15s ease',
    padding: 0,
    flexShrink: 0,
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

/* ── Static share button styles (square, flat, no glow) ── */
const shareButtonBase: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: 2,
  border: '1px solid #2a2a2a',
  cursor: 'pointer',
  padding: 0,
  flexShrink: 0,
  transition: 'background 0.15s, color 0.15s',
}
const shareButtonActive: CSSProperties = { ...shareButtonBase, backgroundColor: '#1e1e1e', borderColor: '#3a3a3a', color: '#5a9e7a' }
const shareButtonInactive: CSSProperties = { ...shareButtonBase, backgroundColor: 'transparent', borderColor: '#2a2a2a', color: '#6b6860' }

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
const imgStyle: CSSProperties = { width: '100%', height: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }

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
