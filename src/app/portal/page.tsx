'use client'

import { useState } from 'react'

export default function PortalPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetSending, setResetSending] = useState(false)

  async function handleLogin() {
    if (!email || !password) return
    setChecking(true)
    setError('')

    const res = await fetch('/api/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'portal_lookup', email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Invalid email or password.')
      setChecking(false)
      return
    }
    sessionStorage.setItem('portal_contact_id', data.contact.id)
    sessionStorage.setItem('portal_name', data.contact.full_name)
    sessionStorage.setItem('portal_email', email)
    window.location.href = '/portal/dashboard'
  }

  async function handleReset() {
    if (!email) return
    setResetSending(true)
    await fetch('/api/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'password_reset', email }),
    })
    setResetSending(false)
    setResetSent(true)
  }

  const inp = {
    width: '100%', padding: '10px 14px', background: '#fff',
    border: '1px solid #ccc', borderRadius: '8px', color: '#1a1a1a',
    fontSize: '13px', outline: 'none',
  } as React.CSSProperties

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: '#E6E6E6', fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Nav */}
      <div style={{
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #ddd', background: 'rgba(255,255,255,0.95)',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#1a1a1a' }}>
          <div style={{ fontWeight: '900', fontSize: '16px', letterSpacing: '0.12em', color: '#FF6B35' }}>SHINE</div>
          <span style={{ fontSize: '13px', fontWeight: '500' }}>Shine Frequency</span>
        </a>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/" style={{ fontSize: '12px', color: '#666', textDecoration: 'none' }}>Home</a>
          <a href="/onboard" style={{ fontSize: '12px', color: '#666', textDecoration: 'none' }}>Artist Sign Up</a>
          <a href="/join" style={{ fontSize: '12px', color: '#1D9E75', textDecoration: 'none' }}>DJ Sign Up</a>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{
          width: '100%', maxWidth: '420px', padding: '2.5rem',
          background: '#fff', border: '1px solid #ddd', borderRadius: '16px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: '900', fontSize: '32px', letterSpacing: '0.12em', color: '#FF6B35', marginBottom: '12px' }}>SHINE</div>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '500', color: '#1a1a1a' }}>
              {resetMode ? 'Reset Password' : 'Client Portal'}
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {resetMode ? 'Enter your email to receive a reset link' : 'View your releases, bookings and stats'}
            </div>
          </div>

          {resetMode ? (
            // Password reset form
            resetSent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ padding: '16px', background: '#e6f7f0', border: '1px solid #1D9E75', borderRadius: '10px', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>Reset link sent</div>
                  <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.6 }}>
                    If <strong style={{ color: '#1a1a1a' }}>{email}</strong> is registered, you'll receive a password reset email shortly.
                  </div>
                </div>
                <button onClick={() => { setResetMode(false); setResetSent(false) }} style={{
                  padding: '8px 20px', background: 'transparent', border: '1px solid #ccc',
                  borderRadius: '8px', color: '#666', fontSize: '12px', cursor: 'pointer',
                }}>Back to login</button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '6px' }}>Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleReset()}
                    placeholder="your@email.com" style={inp} />
                </div>
                <button onClick={handleReset} disabled={!email || resetSending} style={{
                  width: '100%', padding: '11px', background: !email || resetSending ? '#a0d4c0' : '#1D9E75',
                  border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '500',
                  cursor: !email || resetSending ? 'not-allowed' : 'pointer', marginBottom: '1rem',
                }}>
                  {resetSending ? 'Sending...' : 'Send reset link'}
                </button>
                <div style={{ textAlign: 'center' }}>
                  <button onClick={() => setResetMode(false)} style={{
                    background: 'none', border: 'none', color: '#1D9E75', fontSize: '12px', cursor: 'pointer',
                  }}>Back to login</button>
                </div>
              </>
            )
          ) : (
            // Login form
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '6px' }}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" style={inp} />
              </div>

              <div style={{ marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '6px' }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter your password" style={inp} />
              </div>

              <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                <button onClick={() => setResetMode(true)} style={{
                  background: 'none', border: 'none', color: '#1D9E75', fontSize: '11px', cursor: 'pointer',
                }}>Forgot password?</button>
              </div>

              {error && (
                <div style={{ padding: '10px 12px', background: '#fff0f0', border: '1px solid #e8a0a0', borderRadius: '8px', fontSize: '12px', color: '#c44', marginBottom: '1rem' }}>
                  {error}
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    <a href="/onboard" style={{ color: '#1D9E75', fontSize: '11px' }}>Apply as artist</a>
                    <a href="/join" style={{ color: '#1D9E75', fontSize: '11px' }}>Sign up for promos</a>
                  </div>
                </div>
              )}

              <button onClick={handleLogin} disabled={!email || !password || checking} style={{
                width: '100%', padding: '11px',
                background: !email || !password || checking ? '#a0d4c0' : '#1D9E75',
                border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px',
                fontWeight: '500', cursor: !email || !password || checking ? 'not-allowed' : 'pointer',
              }}>
                {checking ? 'Signing in...' : 'Sign in'}
              </button>

              <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '12px', color: '#999', lineHeight: 1.6 }}>
                Don't have an account?<br />
                <a href="/onboard" style={{ color: '#1D9E75', textDecoration: 'none' }}>Apply as artist</a>
                {' · '}
                <a href="/join" style={{ color: '#1D9E75', textDecoration: 'none' }}>DJ / Press sign up</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
