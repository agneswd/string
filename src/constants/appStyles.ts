import type { CSSProperties } from 'react'

// ── Static styles (extracted to avoid re-allocation on every render) ──────────
export const S_appShell: CSSProperties = { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }
export const S_main: CSSProperties = { flex: 1, display: 'flex', minHeight: 0, height: '100%', overflow: 'hidden' }
export const S_userPanel: CSSProperties = {
  display: 'flex', alignItems: 'center', padding: '0 8px', height: '48px',
  backgroundColor: 'var(--bg-sidebar-light)',
  borderTop: '1px solid var(--border-subtle)',
}
export const S_userPanelInner: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }
export const S_userPanelName: CSSProperties = { fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
export const S_userPanelStatus: CSSProperties = { fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }
export const S_userPanelActions: CSSProperties = { display: 'flex', gap: '3px' }
export const S_formCol: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '16px' }
export const S_labelCol: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' }
export const S_labelSpan: CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }
export const S_input: CSSProperties = { padding: '8px 10px', borderRadius: '2px', border: 'none', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '13px' }
export const S_inviteAvatar: CSSProperties = { width: 30, height: 30, borderRadius: '3px', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-deepest)', fontSize: '13px', fontWeight: 600 }
export const S_stringOutlineButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 32,
  padding: '7px 14px',
  borderRadius: '2px',
  border: '1px solid var(--border-subtle)',
  backgroundColor: 'transparent',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-mono)',
  fontSize: '13px',
  fontWeight: 500,
  letterSpacing: '0.04em',
  lineHeight: 1.2,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
export const S_stringOutlineButtonDisabled: CSSProperties = {
  ...S_stringOutlineButton,
  opacity: 0.45,
  cursor: 'not-allowed',
}
export const S_screenShareOverlay: CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 200,
  backgroundColor: 'rgba(0,0,0,0.92)',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
}
export const S_screenShareHeader: CSSProperties = {
  display: 'flex', justifyContent: 'space-between',
  alignItems: 'center', width: '100%', padding: '10px 20px',
  position: 'absolute', top: 0,
}
