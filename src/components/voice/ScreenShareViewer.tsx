import type { CSSProperties } from 'react'

// ── Local styles (theme.md compliant) ────────────────────────────────────────
const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  backgroundColor: 'rgba(17,17,17,0.96)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}

const header: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  padding: '10px 20px',
  position: 'absolute',
  top: 0,
  borderBottom: '1px solid #2a2a2a',
}

const sharerName: CSSProperties = {
  fontFamily: '"SFMono-Regular", Consolas, monospace',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.04em',
  color: '#d4d0cb',
}

const closeBtn: CSSProperties = {
  background: '#b03030',
  border: 'none',
  color: '#d4d0cb',
  padding: '6px 14px',
  borderRadius: 2,
  cursor: 'pointer',
  fontFamily: '"SFMono-Regular", Consolas, monospace',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.04em',
}

export interface ScreenShareViewerProps {
  stream: MediaStream
  sharerName: string
  onClose: () => void
}

export function ScreenShareViewer({ stream, sharerName: name, onClose }: ScreenShareViewerProps) {
  return (
    <div style={overlay}>
      <div style={header}>
        <span style={sharerName}>{name}</span>
        <button onClick={onClose} style={closeBtn}>close</button>
      </div>
      <video
        autoPlay
        style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: 2 }}
        ref={(el) => {
          if (el && el.srcObject !== stream) {
            el.srcObject = stream
          }
        }}
      />
    </div>
  )
}
