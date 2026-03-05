import {
  S_screenShareOverlay,
  S_screenShareHeader,
} from '../../constants/appStyles'

export interface ScreenShareViewerProps {
  stream: MediaStream
  sharerName: string
  onClose: () => void
}

export function ScreenShareViewer({ stream, sharerName, onClose }: ScreenShareViewerProps) {
  return (
    <div style={S_screenShareOverlay}>
      <div style={S_screenShareHeader}>
        <span style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>{sharerName}</span>
        <button onClick={onClose} style={{
          background: '#ed4245', border: 'none', color: '#fff',
          padding: '8px 16px', borderRadius: '4px', cursor: 'pointer',
          fontWeight: 600,
        }}>Close</button>
      </div>
      <video
        autoPlay
        style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: '8px' }}
        ref={(el) => {
          if (el && el.srcObject !== stream) {
            el.srcObject = stream;
          }
        }}
      />
    </div>
  )
}
