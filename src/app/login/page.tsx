'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#E6E6E6',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        padding: '2.5rem',
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: '16px'
      }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: '900', fontSize: '32px', letterSpacing: '0.12em', color: '#FF6B35', marginBottom: '12px' }}>SHINE</div>
          </div>
          <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: '#999', textTransform: 'uppercase', marginBottom: '6px' }}>
            Management platform
          </div>
          <div style={{ fontSize: '22px', fontWeight: '500', color: '#1a1a1a' }}>
            Shine Frequency
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: '8px',
                color: '#1a1a1a',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: '8px',
                color: '#1a1a1a',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 12px',
              background: '#fff0f0',
              border: '1px solid #e8a0a0',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#c44'
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px',
              background: loading ? '#a0d4c0' : '#1D9E75',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px',
              transition: 'background 0.15s'
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
