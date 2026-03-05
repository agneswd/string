import React, { useEffect, useRef, useState, useCallback, type CSSProperties } from 'react'
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
  background: '#1e1f22',
  borderRadius: 12,
  padding: '40px 48px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  minWidth: 280,
}

const avatarOuter = (pulse: boolean): CSSProperties => ({
  width: 96,
  height: 96,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#2b2d31',
  border: '3px solid #43b581',
  boxShadow: pulse
    ? '0 0 0 8px rgba(67, 181, 129, 0.3)'
    : '0 0 0 0 rgba(67, 181, 129, 0)',
  transition: 'box-shadow 0.8s ease',
  overflow: 'hidden',
  flexShrink: 0,
})

const avatarText: CSSProperties = {
  fontSize: 36,
  fontWeight: 700,
  color: '#f0f1f5',
  userSelect: 'none',
}

const avatarImg: CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  objectFit: 'cover',
}

const callerNameStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  color: '#f0f1f5',
}

const subtitleStyle: CSSProperties = {
  fontSize: 14,
  color: '#b5bac1',
  marginBottom: 8,
}

const buttonRow: CSSProperties = {
  display: 'flex',
  gap: 32,
  marginTop: 8,
}

const btnBase: CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  transition: 'filter 0.15s ease',
  padding: 0,
}

const acceptBtn: CSSProperties = { ...btnBase, background: '#43b581' }
const declineBtn: CSSProperties = { ...btnBase, background: '#ed4245' }

/* ── Icons ── */

const PhoneIcon = () => <Phone style={{ width: 28, height: 28 }} />

const PhoneDownIcon = () => <PhoneOff style={{ width: 28, height: 28 }} />

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

  // Toggle pulse for animation (CSS transition-driven)
  const [pulse, setPulse] = useState(true)

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => !p), 800)
    return () => clearInterval(id)
  }, [])

  // Ringtone: two-tone arpeggio via Web Audio API
  useEffect(() => {
    let ctx: AudioContext | null = null
    let intervalId: number | undefined

    const playRing = () => {
      try {
        if (!ctx) ctx = new AudioContext()
        const now = ctx.currentTime

        // Two-tone ring pattern: 440Hz then 520Hz
        const playTone = (freq: number, start: number, dur: number) => {
          const osc = ctx!.createOscillator()
          const gain = ctx!.createGain()
          osc.type = 'sine'
          osc.frequency.value = freq
          gain.gain.setValueAtTime(0.12, start)
          gain.gain.exponentialRampToValueAtTime(0.001, start + dur)
          osc.connect(gain)
          gain.connect(ctx!.destination)
          osc.start(start)
          osc.stop(start + dur)
        }

        playTone(440, now, 0.3)
        playTone(520, now + 0.35, 0.3)
        playTone(440, now + 0.7, 0.3)
      } catch { /* ignore */ }
    }

    // Play immediately then repeat
    playRing()
    intervalId = window.setInterval(playRing, 3000)

    return () => {
      if (intervalId !== undefined) clearInterval(intervalId)
      try { ctx?.close() } catch { /* */ }
    }
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
        {/* Avatar with pulse ring */}
        <div style={avatarOuter(pulse)}>
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
              color: '#b5bac1',
              cursor: 'pointer',
              fontSize: 13,
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
