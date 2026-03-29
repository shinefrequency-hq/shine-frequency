'use client'

import { useState } from 'react'

const TYPES = ['DJ', 'Producer', 'Press', 'Label', 'Promoter', 'Venue', 'Other']

const GENRES = [
  'Techno', 'Industrial Techno', 'Hard Techno', 'Dark Techno', 'Acid Techno',
  'Broken Techno', 'EBM', 'Electro', 'Ambient', 'Noise', 'Experimental',
]

export default function JoinPage() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    type: '',
    organisation: '',
    city: '',
    country_code: '',
    genres: [] as string[],
    soundcloud_url: '',
    instagram_handle: '',
    website: '',
    bio: '',
    agreed: false,
  })

  function set(key: string, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function toggleGenre(genre: string) {
    setForm(f => ({
      ...f,
      genres: f.genres.includes(genre)
        ? f.genres.filter(g => g !== genre)
        : [...f.genres, genre],
    }))
  }

  function canSubmit() {
    return form.full_name && form.email && form.type && form.agreed && !submitting
  }

  async function handleSubmit() {
    if (!canSubmit()) return
    setSubmitting(true)
    setError('')

    const genresStr = form.genres.length > 0 ? form.genres.join(', ') : 'None selected'
    const notesStr = `Signed up via /join. Genres: ${genresStr}. Bio: ${form.bio || 'N/A'}`

    try {
      const res = await fetch('/api/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join_promo',
          contact: {
            full_name: form.full_name,
            email: form.email,
            type: form.type.toLowerCase(),
            city: form.city || null,
            country_code: form.country_code || null,
            bio: form.bio || null,
            soundcloud_url: form.soundcloud_url || null,
            instagram_handle: form.instagram_handle || null,
            website: form.website || null,
            is_on_promo_list: false,
            is_trusted: false,
            is_high_value: false,
            is_sf_artist: false,
            promo_tier: 3,
            notes: notesStr,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        setSubmitting(false)
        return
      }
      setSubmitting(false)
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const inp = (style: any = {}) => ({
    width: '100%',
    padding: '10px 14px',
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: '8px',
    color: '#1a1a1a',
    fontSize: '13px',
    outline: 'none',
    ...style,
  } as React.CSSProperties)

  const lbl = {
    fontSize: '11px',
    color: '#666',
    display: 'block',
    marginBottom: '5px',
    letterSpacing: '0.02em',
  } as React.CSSProperties

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#E6E6E6', fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{
          width: '100%', maxWidth: '480px', padding: '2.5rem',
          background: '#fff', border: '1px solid #ddd', borderRadius: '16px',
          textAlign: 'center',
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: '900', fontSize: '32px', letterSpacing: '0.12em', color: '#FF6B35', marginBottom: '12px' }}>SHINE</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px' }}>
            Thanks {form.full_name}!
          </div>
          <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Your application has been received. Sharon will review and approve your access.
          </div>
          <div style={{ padding: '12px', background: '#e6f7f0', border: '1px solid #1D9E75', borderRadius: '8px', fontSize: '12px', color: '#1D9E75' }}>
            We&apos;ll be in touch at {form.email}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#E6E6E6', fontFamily: 'system-ui, sans-serif',
      padding: '0',
    }}>
      {/* Nav */}
      <div style={{
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #ddd', background: 'rgba(255,255,255,0.95)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#1a1a1a' }}>
          <div style={{ fontWeight: '900', fontSize: '16px', letterSpacing: '0.12em', color: '#FF6B35' }}>SHINE</div>
          <span style={{ fontSize: '13px', fontWeight: '500' }}>Shine Frequency</span>
        </a>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/" style={{ fontSize: '12px', color: '#666', textDecoration: 'none' }}>Home</a>
          <a href="/onboard" style={{ fontSize: '12px', color: '#666', textDecoration: 'none' }}>Artist Sign Up</a>
          <a href="/portal" style={{ fontSize: '12px', color: '#1D9E75', textDecoration: 'none' }}>Login</a>
        </div>
      </div>
      <div style={{ padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: '900', fontSize: '32px', letterSpacing: '0.12em', color: '#FF6B35', marginBottom: '12px' }}>SHINE</div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '500', color: '#1a1a1a' }}>
            Join the Promo List
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            Sign up to receive promo releases from Shine Frequency
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '16px', padding: '1.75rem' }}>

          {/* Name & Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '1.5rem' }}>
            <div>
              <label style={lbl}>Full name *</label>
              <input style={inp()} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <label style={lbl}>Email *</label>
              <input style={inp()} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="your@email.com" />
            </div>
            <div>
              <label style={lbl}>I am a... *</label>
              <select style={inp()} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="">Select type...</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Organisation / label name</label>
              <input style={inp()} value={form.organisation} onChange={e => set('organisation', e.target.value)} placeholder="Your label, publication, venue, etc." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl}>City</label>
                <input style={inp()} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Berlin" />
              </div>
              <div>
                <label style={lbl}>Country code</label>
                <input style={inp()} value={form.country_code} onChange={e => set('country_code', e.target.value.toUpperCase().slice(0, 2))} placeholder="DE" maxLength={2} />
              </div>
            </div>
          </div>

          {/* Genre preferences */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '4px' }}>Genre preferences</div>
            <div style={{ fontSize: '11px', color: '#999', marginBottom: '10px' }}>Select all genres you play or cover</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {GENRES.map(g => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  style={{
                    padding: '7px 14px', borderRadius: '20px',
                    background: form.genres.includes(g) ? '#e6f7f0' : '#fff',
                    border: `1px solid ${form.genres.includes(g) ? '#1D9E75' : '#ccc'}`,
                    color: form.genres.includes(g) ? '#1D9E75' : '#666',
                    fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '1.5rem' }}>
            <div>
              <label style={lbl}>SoundCloud</label>
              <input style={inp()} value={form.soundcloud_url} onChange={e => set('soundcloud_url', e.target.value)} placeholder="https://soundcloud.com/..." />
            </div>
            <div>
              <label style={lbl}>Instagram</label>
              <input style={inp()} value={form.instagram_handle} onChange={e => set('instagram_handle', e.target.value)} placeholder="@handle" />
            </div>
            <div>
              <label style={lbl}>Website</label>
              <input style={inp()} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." />
            </div>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={lbl}>Why do you want to receive promos?</label>
            <textarea
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
              placeholder="Tell us a bit about yourself and what you do — where you play, what you cover, your audience, etc."
              style={{ ...inp({ height: '100px', resize: 'none' }) }}
            />
          </div>

          {/* Agreement checkbox */}
          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer',
            fontSize: '12px', color: form.agreed ? '#1D9E75' : '#666', lineHeight: 1.5,
            marginBottom: '1.5rem',
          }}>
            <input
              type="checkbox"
              checked={form.agreed}
              onChange={e => set('agreed', e.target.checked)}
              style={{ accentColor: '#1D9E75', marginTop: '2px', flexShrink: 0 }}
            />
            I agree to receive promo releases from Shine Frequency
          </label>

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 14px', background: '#fff0f0', border: '1px solid #e8a0a0', borderRadius: '8px', fontSize: '12px', color: '#c44', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            style={{
              width: '100%', padding: '12px',
              background: !canSubmit() ? '#a0d4c0' : '#1D9E75',
              border: 'none', borderRadius: '8px',
              color: '#fff', fontSize: '14px', fontWeight: '500',
              cursor: !canSubmit() ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {submitting ? 'Submitting...' : 'Apply to join'}
          </button>

          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '11px', color: '#999' }}>
            Applications are reviewed manually. You&apos;ll hear back once approved.
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '11px', color: '#999' }}>
          Shine Frequency — London, UK
        </div>
      </div>
      </div>
    </div>
  )
}
