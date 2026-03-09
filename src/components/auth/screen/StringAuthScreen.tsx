import { SignIn, SignUp } from '@clerk/react'
import { useEffect, useMemo, useState } from 'react'

import { signInAppearance, signUpAppearance } from '../shared/authAppearance'
import {
  S_authBody,
  S_authCard,
  S_authClerkShell,
  S_authComponentFrame,
  S_authDivider,
  S_authFooterRow,
  S_authFooterText,
  S_authFormColumn,
  S_authLinkButton,
  S_authMessage,
  S_authTab,
  S_authTabActive,
  S_authTabs,
  S_authTitle,
  S_authVerificationHeader,
} from '../shared/authStyles'

type AuthMode = 'sign-in' | 'sign-up'

export interface StringAuthScreenProps {
  message?: string
}

export function StringAuthScreen({ message }: StringAuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('sign-in')

  useEffect(() => {
    if (!window.location.pathname.endsWith('/sso-callback')) {
      return
    }

    const fallbackUrl = new URL('.', window.location.href)
    window.history.replaceState({}, document.title, `${fallbackUrl.pathname}${fallbackUrl.search}${fallbackUrl.hash}`)
  }, [])

  const heading = useMemo(
    () => (mode === 'sign-in' ? 'Sign in to String' : 'Create your String account'),
    [mode],
  )

  const description = useMemo(
    () => (mode === 'sign-in'
      ? 'Use your email, password, or a linked provider to enter String.'
      : 'Use your email, password, or a linked provider to register for String.'),
    [mode],
  )

  return (
    <div style={S_authCard}>
      <div style={S_authFormColumn}>
        <div style={{ display: 'grid', gap: '18px' }}>
          <div style={S_authTabs}>
            <button type="button" style={mode === 'sign-in' ? S_authTabActive : S_authTab} onClick={() => setMode('sign-in')}>
              Sign in
            </button>
            <button type="button" style={mode === 'sign-up' ? S_authTabActive : S_authTab} onClick={() => setMode('sign-up')}>
              Create account
            </button>
          </div>

          <div style={S_authVerificationHeader}>
            <h2 style={S_authTitle}>{heading}</h2>
            <p style={S_authBody}>{description}</p>
          </div>

          {message && <div style={S_authMessage}>{message}</div>}

          <div style={S_authComponentFrame}>
            <div style={S_authClerkShell}>
              {mode === 'sign-in' ? (
                <SignIn
                  routing="hash"
                  oauthFlow="redirect"
                  appearance={signInAppearance}
                />
              ) : (
                <SignUp
                  routing="hash"
                  oauthFlow="redirect"
                  appearance={signUpAppearance}
                />
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={S_authDivider} />

          <div style={S_authFooterRow}>
            <p style={S_authFooterText}>
              {mode === 'sign-in' ? 'New to String?' : 'Already have an account?'}
            </p>
            <button
              type="button"
              style={S_authLinkButton}
              onClick={() => setMode((currentMode) => (currentMode === 'sign-in' ? 'sign-up' : 'sign-in'))}
            >
              {mode === 'sign-in' ? 'Create account instead' : 'Use sign in instead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}