import type { CSSProperties } from 'react'

import {
  S_formCol,
  S_labelSpan,
  S_stringOutlineButton,
  S_stringOutlineButtonDisabled,
} from '../../../constants/appStyles'

export const S_authOverlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '56px 24px 24px',
  backgroundColor: 'rgba(0, 0, 0, 0.78)',
}

export const S_authCard: CSSProperties = {
  width: 'min(520px, 100%)',
  maxHeight: 'calc(100vh - 56px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--bg-panel)',
}

export const S_authCardCompact: CSSProperties = {
  width: 'min(460px, 100%)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  padding: '28px',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--bg-panel)',
}

export const S_authLoadingMark: CSSProperties = {
  width: 72,
  height: 72,
  margin: '0 auto',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  border: '1px solid var(--border-subtle)',
  background: 'radial-gradient(circle at center, rgba(200, 184, 162, 0.16), transparent 72%)',
  color: 'var(--brand-primary)',
  boxShadow: '0 0 0 8px rgba(200, 184, 162, 0.05)',
}

export const S_authLoadingPulse: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  border: '2px solid rgba(200, 184, 162, 0.2)',
  borderTopColor: 'var(--brand-primary)',
  animation: 'string-auth-spin 0.9s linear infinite',
}

export const S_authLoadingStack: CSSProperties = {
  display: 'grid',
  gap: '14px',
  justifyItems: 'center',
}

export const S_authFormColumn: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: '18px',
  minHeight: 0,
  height: '100%',
  padding: '32px',
}

export const S_authEyebrow: CSSProperties = {
  ...S_labelSpan,
  fontSize: '10px',
}

export const S_authTitle: CSSProperties = {
  margin: 0,
  color: 'var(--text-primary)',
  fontSize: '1.16rem',
  fontWeight: 600,
  lineHeight: 1.25,
  textAlign: 'center',
}

export const S_authBody: CSSProperties = {
  margin: 0,
  color: 'var(--text-secondary)',
  fontSize: '13px',
  lineHeight: 1.6,
  textAlign: 'center',
}

export const S_authTabs: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px',
}

export const S_authTab: CSSProperties = {
  ...S_stringOutlineButton,
  width: '100%',
  minHeight: 36,
  backgroundColor: 'var(--bg-input)',
  color: 'var(--text-secondary)',
}

export const S_authTabActive: CSSProperties = {
  ...S_authTab,
  border: '1px solid var(--accent-primary)',
  color: 'var(--text-primary)',
  backgroundColor: 'var(--bg-active)',
}

export const S_authForm: CSSProperties = {
  ...S_formCol,
  gap: '14px',
}

export const S_authMessage: CSSProperties = {
  padding: '10px 12px',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'var(--bg-input)',
  color: 'var(--text-secondary)',
  fontSize: '12px',
  lineHeight: 1.5,
  textAlign: 'center',
}

export const S_authFooterRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  paddingTop: '4px',
}

export const S_authFooterText: CSSProperties = {
  margin: 0,
  color: 'var(--text-muted)',
  fontSize: '12px',
  lineHeight: 1.5,
}

export const S_authLinkButton: CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'none',
  color: 'var(--accent-primary)',
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
  fontWeight: 500,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

export const S_authVerificationHeader: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  alignItems: 'center',
}

export const S_authDivider: CSSProperties = {
  height: 1,
  backgroundColor: 'var(--border-subtle)',
}

export const S_authComponentFrame: CSSProperties = {
  display: 'grid',
  gap: '16px',
  flex: 1,
  minHeight: 0,
  justifyItems: 'center',
  alignContent: 'start',
  overflowY: 'auto',
  paddingInline: '6px',
}

export const S_authClerkShell: CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
}

export const S_authProviderNote: CSSProperties = {
  ...S_authBody,
  fontSize: '12px',
}

export const S_authPrimaryButtonDisabled: CSSProperties = {
  ...S_stringOutlineButtonDisabled,
  minHeight: 36,
  border: '1px solid var(--accent-primary)',
  backgroundColor: 'var(--accent-primary)',
  color: 'var(--bg-deepest)',
}