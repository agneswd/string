import { LineSquiggle } from 'lucide-react'

import { StringAuthScreen } from '../auth/screen/StringAuthScreen'
import {
  S_authBody,
  S_authCardCompact,
  S_authEyebrow,
  S_authLoadingMark,
  S_authLoadingPulse,
  S_authLoadingStack,
  S_authOverlay,
} from '../auth/shared/authStyles'

export interface ClerkAuthOverlayProps {
  isAuthenticating?: boolean
  message?: string
}

export function ClerkAuthOverlay({ isAuthenticating = false, message }: ClerkAuthOverlayProps) {
  if (!isAuthenticating) {
    return (
      <div style={S_authOverlay}>
        <StringAuthScreen message={message} />
      </div>
    )
  }

  return (
    <div
      style={{
        ...S_authOverlay,
        alignItems: 'center',
        padding: '24px',
        backgroundColor: 'rgba(7, 8, 10, 0.38)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <style>{'@keyframes string-auth-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'}</style>
      <div style={S_authCardCompact}>
        <div style={S_authLoadingStack}>
          <div style={S_authLoadingMark}>
            <LineSquiggle size={24} />
            <div style={{ ...S_authLoadingPulse, position: 'absolute' }} />
          </div>
          <span style={S_authEyebrow}>String / session sync</span>
        </div>
        <p style={{ ...S_authBody, color: 'var(--text-primary)' }}>{message ?? 'Restoring your session…'}</p>
      </div>
    </div>
  )
}