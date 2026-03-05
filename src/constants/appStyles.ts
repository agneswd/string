import type { CSSProperties } from 'react'

// ── Static styles (extracted to avoid re-allocation on every render) ──────────
export const S_appShell: CSSProperties = { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }
export const S_main: CSSProperties = { flex: 1, display: 'flex', minHeight: 0, height: '100%', overflow: 'hidden' }
export const S_userPanel: CSSProperties = {
  display: 'flex', alignItems: 'center', padding: '0 8px', height: '52px',
  backgroundColor: 'var(--bg-sidebar-dark, #232428)',
  borderTop: '1px solid rgba(255,255,255,0.06)',
}
export const S_userPanelInner: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }
export const S_userPanelName: CSSProperties = { fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
export const S_userPanelStatus: CSSProperties = { fontSize: '12px', color: 'var(--text-muted, #949ba4)' }
export const S_userPanelActions: CSSProperties = { display: 'flex', gap: '4px' }
export const S_formCol: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '16px' }
export const S_labelCol: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' }
export const S_labelSpan: CSSProperties = { fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }
export const S_input: CSSProperties = { padding: '10px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--bg-input, #1e1f22)', color: 'var(--text-primary)', fontSize: '14px' }
export const S_inviteAvatar: CSSProperties = { width: 32, height: 32, borderRadius: '50%', backgroundColor: '#5865f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 600 }
export const S_screenShareOverlay: CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 200,
  backgroundColor: 'rgba(0,0,0,0.9)',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
}
export const S_screenShareHeader: CSSProperties = {
  display: 'flex', justifyContent: 'space-between',
  alignItems: 'center', width: '100%', padding: '12px 20px',
  position: 'absolute', top: 0,
}
