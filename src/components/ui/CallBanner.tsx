import { Phone } from 'lucide-react'
import type { CSSProperties } from 'react'

export interface CallBannerProps {
  currentVoiceState: boolean
  outgoingCall: boolean
  calleeName: string
  onCancelCall: () => void
  isDmCall: boolean
  callName: string
  isOnCallPage: boolean
  onNavigateToCall: () => void
}

const S_banner: CSSProperties = {
  width: '100%',
  background: '#248046',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  fontWeight: 500,
  flexShrink: 0,
  zIndex: 50,
}

const S_cancelBtn: CSSProperties = {
  marginLeft: 'auto',
  background: '#ed4245',
  border: 'none',
  color: '#fff',
  padding: '4px 12px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
}

export function CallBanner({
  currentVoiceState,
  outgoingCall,
  calleeName,
  onCancelCall,
  isDmCall,
  callName,
  isOnCallPage,
  onNavigateToCall,
}: CallBannerProps) {
  // Outgoing call banner (not yet connected)
  if (!currentVoiceState && outgoingCall) {
    return (
      <div style={{ ...S_banner, padding: '6px 16px' }}>
        <Phone style={{ width: 16, height: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <span>Calling {calleeName}...</span>
        <button onClick={onCancelCall} style={S_cancelBtn}>
          Cancel
        </button>
      </div>
    )
  }

  // Active / connected call banner
  return (
    <div
      style={{ ...S_banner, padding: '4px 16px', cursor: 'pointer' }}
      onClick={isDmCall ? onNavigateToCall : undefined}
    >
      <Phone style={{ width: 16, height: 16 }} />
      <span>{isDmCall ? `In call with ${callName}` : `Voice Connected — ${callName}`}</span>
      {!isOnCallPage && isDmCall && (
        <span style={{ marginLeft: 'auto', textDecoration: 'underline', fontSize: 12 }}>Return to call</span>
      )}
    </div>
  )
}
