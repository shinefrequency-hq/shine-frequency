'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function PortalPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  async function handleLogin() {
    if (!email) return
    setChecking(true)
    setError('')

    // Check if email exists as a contact or artist
    const { data: contact } = await (supabase as any)
      .from('contacts')
      .select('id, full_name')
      .eq('email', email)
      .single()

    if (!contact) {
      setError('No account found with this email. Apply as an artist or sign up for promos.')
      setChecking(false)
      return
    }

    // Store in sessionStorage and redirect
    sessionStorage.setItem('portal_contact_id', contact.id)
    sessionStorage.setItem('portal_name', contact.full_name)
    sessionStorage.setItem('portal_email', email)
    window.location.href = '/portal/dashboard'
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
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>View your releases, bookings and stats</div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>Email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="your@email.com"
            style={{
              width: '100%', padding: '10px 14px', background: '#1a1a1a',
              border: '0.5px solid #333', borderRadius: '8px', color: '#fff',
              fontSize: '13px', outline: 'none',
            }}
          />
        </div>

        {error && (
          <div style={{ padding: '10px 12px', background: '#1a0a0a', border: '0.5px solid #5a1a1a', borderRadius: '8px', fontSize: '12px', color: '#f08080', marginBottom: '1rem' }}>
            {error}
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <a href="/onboard" style={{ color: '#1D9E75', fontSize: '11px' }}>Apply as artist</a>
              <a href="/join" style={{ color: '#1D9E75', fontSize: '11px' }}>Sign up for promos</a>
            </div>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={!email || checking}
          style={{
            width: '100%', padding: '11px', background: !email || checking ? '#0a4a30' : '#1D9E75',
            border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px',
            fontWeight: '500', cursor: !email || checking ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {checking ? 'Checking...' : 'Access portal'}
        </button>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '11px', color: '#444' }}>
          <a href="/" style={{ color: '#555', textDecoration: 'none' }}>Back to Shine Frequency</a>
        </div>
      </div>
    </div>
  )
}
