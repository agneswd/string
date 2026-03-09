import React, { useEffect, useRef, useCallback, type CSSProperties } from 'react'
import { Phone, PhoneOff } from 'lucide-react'

export interface IncomingCallModalProps {
  callerName: string
  callerAvatarUrl?: string
  onAccept: () => void
  onDecline: () => void
  onIgnore?: () => void
}

/* ── Styles ── */

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
}

const card: CSSProperties = {
  background: 'var(--bg-panel)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '2px',
  padding: '36px 44px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  minWidth: 280,
}

const avatarOuter: CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-active)',
  border: '2px solid var(--border-subtle)',
  overflow: 'hidden',
  flexShrink: 0,
}

const avatarText: CSSProperties = {
  fontSize: 28,
  fontWeight: 600,
  color: 'var(--text-primary)',
  userSelect: 'none',
}

const avatarImg: CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  objectFit: 'cover',
}

const callerNameStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: 'var(--text-primary)',
}

const subtitleStyle: CSSProperties = {
  fontSize: 12,
  fontFamily: 'var(--font-mono)',
  color: 'var(--text-muted)',
  marginBottom: 8,
}

const buttonRow: CSSProperties = {
  display: 'flex',
  gap: 32,
  marginTop: 8,
}

const btnBase: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: '2px',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  transition: 'filter 0.15s ease',
  padding: 0,
}

// Use the same muted editorial green as the call UI palette (callTheme.statusGreen)
const acceptBtn: CSSProperties = { ...btnBase, background: '#5a9e7a' }
const declineBtn: CSSProperties = { ...btnBase, background: '#b94040' }

/* ── Icons ── */

const PhoneIcon = () => <Phone style={{ width: 22, height: 22 }} />

const PhoneDownIcon = () => <PhoneOff style={{ width: 22, height: 22 }} />

/* ── Component ── */

export const IncomingCallModal = React.memo(function IncomingCallModal({
  callerName,
  callerAvatarUrl,
  onAccept,
  onDecline,
  onIgnore,
}: IncomingCallModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-focus the container so keyboard shortcuts work immediately
  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onDecline()
      if (e.key === 'Enter') onAccept()
    },
    [onAccept, onDecline],
  )

  return (
    <div ref={containerRef} tabIndex={-1} style={overlay} role="dialog" aria-label={`Incoming call from ${callerName}`} onKeyDown={handleKeyDown}>
      <div style={card}>
        {/* Avatar */}
        <div style={avatarOuter}>
          {callerAvatarUrl ? (
            <img src={callerAvatarUrl} alt={callerName} style={avatarImg} />
          ) : (
            <span style={avatarText}>{callerName.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <span style={callerNameStyle}>{callerName}</span>
        <span style={subtitleStyle}>Incoming call…</span>

        <div style={buttonRow}>
          <button
            type="button"
            style={acceptBtn}
            onClick={onAccept}
            aria-label="Accept call"
            title="Accept"
            onMouseEnter={(e) => { (e.currentTarget.style.filter = 'brightness(1.15)') }}
            onMouseLeave={(e) => { (e.currentTarget.style.filter = 'none') }}
          >
            <PhoneIcon />
          </button>
          <button
            type="button"
            style={declineBtn}
            onClick={onDecline}
            aria-label="Decline call"
            title="Decline"
            onMouseEnter={(e) => { (e.currentTarget.style.filter = 'brightness(1.15)') }}
            onMouseLeave={(e) => { (e.currentTarget.style.filter = 'none') }}
          >
            <PhoneDownIcon />
          </button>
        </div>

        {onIgnore && (
          <button
            type="button"
            onClick={onIgnore}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              fontWeight: 500,
              padding: '4px 12px',
              marginTop: 8,
              textDecoration: 'underline',
            }}
          >
            Ignore
          </button>
        )}
      </div>
    </div>
  )
})
