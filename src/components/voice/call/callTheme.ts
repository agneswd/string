import type { CSSProperties } from 'react'

// ── Palette (follows theme.md strictly) ──────────────────────────────────────
export const T = {
  bg: '#111111',
  surface: '#1a1a1a',
  surfaceHover: '#1e1e1e',
  border: '#2a2a2a',
  borderActive: '#3a3a3a',
  textPrimary: '#d4d0cb',
  textMuted: '#6b6860',
  accent: '#c8b8a2',
  statusGreen: '#5a9e7a',   // muted green – speaking / connected indicator only
  danger: '#b03030',        // flat red for hang-up; not neon
} as const

// ── Shared surface wrapper ────────────────────────────────────────────────────
export const callSurface: CSSProperties = {
  background: T.bg,
  overflow: 'hidden',
  flexShrink: 0,
}

// ── Participants area ─────────────────────────────────────────────────────────
export const participantsGrid: CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '12px 16px',
  minHeight: 0,
}

export const participantCard: CSSProperties = {
  flex: '1 1 0',
  maxWidth: 420,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: 3,
  overflow: 'hidden',
  position: 'relative',
  minHeight: 0,
  height: '100%',
  gap: 4,
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export const avatarFrame = ({
  speaking,
  isString,
  size,
}: {
  speaking: boolean
  isString: boolean
  size: number
}): CSSProperties => ({
  width: size,
  height: size,
  borderRadius: isString ? 3 : '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: T.bg,
  overflow: 'hidden',
  flexShrink: 0,
  // speaking indicator: use the same outline pattern as the working server voice UI
  outline: speaking ? `2px solid ${T.statusGreen}` : '2px solid transparent',
  outlineOffset: isString ? 1 : 0,
  transition: 'outline-color 0.15s',
})

export const avatarImage = (isString: boolean): CSSProperties => ({
  width: '100%',
  height: '100%',
  borderRadius: isString ? 3 : '50%',
  objectFit: 'cover',
})

export const avatarInitial = (size: number): CSSProperties => ({
  fontSize: Math.max(24, Math.round(size * 0.38)),
  fontWeight: 500,
  color: '#ffffff',
  userSelect: 'none',
})

// ── Name labels ───────────────────────────────────────────────────────────────
export const nameBadge: CSSProperties = {
  fontSize: 11,
  fontFamily: 'var(--font-mono, "SFMono-Regular", Consolas, monospace)',
  fontWeight: 500,
  color: T.textMuted,
  marginTop: 6,
  textAlign: 'center',
  padding: '0 8px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '100%',
  letterSpacing: '0.03em',
}

export const nameOverScreenShare: CSSProperties = {
  position: 'absolute',
  bottom: 6,
  left: 8,
  fontSize: 11,
  fontFamily: 'var(--font-mono, "SFMono-Regular", Consolas, monospace)',
  color: T.textPrimary,
  background: 'rgba(17,17,17,0.85)',
  padding: '2px 6px',
  borderRadius: 2,
}

// ── Controls row ──────────────────────────────────────────────────────────────
export const controlsRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '8px 16px 12px',
  flexShrink: 0,
}

/** Square control button following theme: flat, no pill, no shadow, no glow */
export const controlBtn = (active: boolean, isHangUp = false): CSSProperties => ({
  width: 32,
  height: 32,
  borderRadius: 2,
  border: `1px solid ${isHangUp ? 'transparent' : active ? T.borderActive : T.border}`,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  flexShrink: 0,
  color: isHangUp ? '#fff' : active ? T.accent : T.textMuted,
  background: isHangUp ? T.danger : active ? T.surfaceHover : 'transparent',
  transition: 'background 0.15s, color 0.15s',
})

// ── Screen-share video ────────────────────────────────────────────────────────
export const screenVideo: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
}
