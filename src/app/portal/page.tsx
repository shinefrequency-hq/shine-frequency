'use client'

import { useState } from 'react'

export default function PortalPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit() {
    if (!email) return
    setSubmitted(true)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0a', fontFamily: 'system-ui, sans-serif', padding: '2rem 1rem',
    }}>
      <div style={{
        width: '100%', maxWidth: '420px', padding: '2.5rem',
        background: '#111', border: '0.5px solid #222', borderRadius: '16px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.png" alt="Shine Music" style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '12px' }} />
          <div style={{ fontSize: '18px', fontWeight: '500', color: '#fff' }}>Client Portal</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Access your releases, bookings and stats</div>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              padding: '16px', background: '#0a2a1e', border: '0.5px solid #1D9E75',
              borderRadius: '10px', marginBottom: '1rem',
            }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#4ecca3', marginBottom: '6px' }}>Check your email</div>
              <div style={{ fontSize: '13px', color: '#888', lineHeight: 1.6 }}>
                If <strong style={{ color: '#fff' }}>{email}</strong> is registered with Shine Frequency, you'll receive a login link shortly.
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#555' }}>
              Don't have an account? <a href="/onboard" style={{ color: '#1D9E75', textDecoration: 'none' }}>Apply as an artist</a> or <a href="/join" style={{ color: '#1D9E75', textDecoration: 'none' }}>sign up for promos</a>.
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="your@email.com"
                style={{
                  width: '100%', padding: '10px 14px', background: '#1a1a1a',
                  border: '0.5px solid #333', borderRadius: '8px', color: '#fff',
                  fontSize: '13px', outline: 'none',
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!email}
              style={{
                width: '100%', padding: '11px', background: !email ? '#0a4a30' : '#1D9E75',
                border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px',
                fontWeight: '500', cursor: !email ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s', marginBottom: '1rem',
              }}
            >
              Send login link
            </button>

            <div style={{ fontSize: '12px', color: '#555', textAlign: 'center', lineHeight: 1.6 }}>
              For artists, DJs, and press contacts with a Shine Frequency account.
              <br />
              <a href="/onboard" style={{ color: '#1D9E75', textDecoration: 'none' }}>Apply as artist</a>
              {' · '}
              <a href="/join" style={{ color: '#1D9E75', textDecoration: 'none' }}>DJ promo sign-up</a>
            </div>
          </>
        )}

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <a href="/" style={{ fontSize: '12px', color: '#444', textDecoration: 'none' }}>Back to shine-frequency.vercel.app</a>
        </div>
      </div>
    </div>
  )
}
