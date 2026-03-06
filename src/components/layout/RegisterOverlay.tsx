import { useState } from 'react'
import {
  S_formCol,
  S_labelCol,
  S_labelSpan,
  S_input,
} from '../../constants/appStyles'

export interface RegisterOverlayProps {
  onRegister: (username: string, displayName: string) => Promise<void>
  onLoginAsUser: (username: string) => Promise<void>
}

export function RegisterOverlay({ onRegister, onLoginAsUser }: RegisterOverlayProps) {
  const isDevBuild = import.meta.env.DEV
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onRegister(username, displayName)
    setUsername('')
    setDisplayName('')
  }

  const handleLogin = async () => {
    if (!loginUsername.trim()) return
    setLoginError(null)
    try {
      await onLoginAsUser(loginUsername.trim())
    } catch (err) {
      setLoginError(String(err))
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div style={{ backgroundColor: 'var(--bg-panel, #1a1a1a)', border: '1px solid var(--border-subtle, #2a2a2a)', padding: '32px', borderRadius: '2px', display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '380px', maxWidth: '420px' }}>
        <form onSubmit={handleRegister} style={S_formCol}>
          <h2 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 600, textAlign: 'center', letterSpacing: '0.02em' }}>Welcome</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>Create your account to get started</p>
          <label style={S_labelCol}>
            <span style={S_labelSpan}>USERNAME</span>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required style={S_input} />
          </label>
          <label style={S_labelCol}>
            <span style={S_labelSpan}>DISPLAY NAME</span>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display Name" required style={S_input} />
          </label>
          <button type="submit" style={{ padding: '9px 16px', borderRadius: '2px', border: 'none', backgroundColor: 'var(--accent-primary, #c8b8a2)', color: '#111111', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
            Register
          </button>
        </form>

        {isDevBuild && (
          <>
            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted, #949ba4)', textTransform: 'uppercase', fontWeight: 600 }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Login as existing user */}
            <div>
              <button
                type="button"
                onClick={() => { setShowLoginForm(!showLoginForm); setLoginError(null); }}
                style={{
                  background: 'none', border: 'none', color: 'var(--accent-primary, #c8b8a2)',
                  cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-mono)', padding: 0, textAlign: 'center', width: '100%',
                }}
              >
                {showLoginForm ? 'Back to Register' : 'Login as existing user'}
              </button>
              {showLoginForm && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                  <label style={S_labelCol}>
                    <span style={S_labelSpan}>USERNAME</span>
                    <input
                      value={loginUsername}
                      onChange={e => setLoginUsername(e.target.value)}
                      placeholder="Enter your username"
                      style={S_input}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleLogin(); } }}
                    />
                  </label>
                  {loginError && (
                    <div style={{ color: 'var(--text-danger, #f87171)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{loginError}</div>
                  )}
                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={!loginUsername.trim()}
                    style={{
                      padding: '9px 16px', borderRadius: '2px', border: 'none',
                      backgroundColor: loginUsername.trim() ? 'var(--accent-primary, #c8b8a2)' : 'var(--bg-active, #242424)',
                      color: loginUsername.trim() ? '#111111' : 'var(--text-muted)', fontWeight: 600, cursor: loginUsername.trim() ? 'pointer' : 'not-allowed', fontSize: '13px',
                    }}
                  >
                    Login
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
