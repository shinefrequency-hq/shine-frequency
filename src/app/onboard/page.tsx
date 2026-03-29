'use client'

import { useState } from 'react'

const GENRES = [
  'Techno', 'Industrial Techno', 'Hard Techno', 'Minimal Techno',
  'Dark Techno', 'Acid Techno', 'Broken Techno', 'EBM',
  'Electro', 'Ambient', 'Noise', 'Experimental', 'Other'
]

export default function OnboardPage() {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    stage_name: '',
    real_name: '',
    email: '',
    phone: '',
    bio: '',
    soundcloud_url: '',
    instagram_handle: '',
    website: '',
    genre: '',
    bpm_range: '',
    demo_link: '',
    city: '',
    country_code: '',
    agreed_terms: false,
  })

  function set(key: string, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function canNext() {
    if (step === 1) return form.stage_name && form.email
    if (step === 2) return form.genre
    if (step === 3) return form.agreed_terms
    return false
  }

  async function handleSubmit() {
    if (!form.agreed_terms) return
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'onboard_artist',
        contact: {
          full_name: form.stage_name,
          email: form.email,
          phone: form.phone || null,
          type: 'artist',
          city: form.city || null,
          country_code: form.country_code || null,
          bio: form.bio || null,
          soundcloud_url: form.soundcloud_url || null,
          instagram_handle: form.instagram_handle || null,
          website: form.website || null,
          is_sf_artist: true,
          is_on_promo_list: false,
          is_trusted: false,
          is_high_value: false,
          notes: `Submitted via onboarding form. Demo: ${form.demo_link || 'none'}`,
        },
        artist: {
          stage_name: form.stage_name,
          real_name: form.real_name || null,
          email: form.email,
          phone: form.phone || null,
          agent_notes: [
            form.genre ? `Genre: ${form.genre}` : '',
            form.bpm_range ? `BPM: ${form.bpm_range}` : '',
            form.demo_link ? `Demo: ${form.demo_link}` : '',
          ].filter(Boolean).join('\n'),
          is_active: false,
        },
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      setSubmitting(false)
      return
    }
    setSubmitting(false)
    setSubmitted(true)
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
          width: '100%', maxWidth: '440px', padding: '2.5rem',
          background: '#fff', border: '1px solid #ddd', borderRadius: '16px',
          textAlign: 'center',
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ background: '#1D9E75', color: '#fff', fontWeight: '800', fontSize: '32px', letterSpacing: '0.15em', padding: '12px 24px', borderRadius: '6px', display: 'inline-block' }}>SHINE</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px' }}>
            Thanks, {form.stage_name}
          </div>
          <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.6 }}>
            Your submission has been received. Sharon will review your details and get back to you shortly.
          </div>
          <div style={{ marginTop: '1.5rem', padding: '12px', background: '#e6f7f0', border: '1px solid #1D9E75', borderRadius: '8px', fontSize: '12px', color: '#1D9E75' }}>
            Keep an eye on your inbox at {form.email}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#E6E6E6', fontFamily: 'system-ui, sans-serif', padding: '0',
    }}>
      {/* Nav */}
      <div style={{
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #ddd', background: 'rgba(255,255,255,0.95)',
        position: 'sticky', top: 0, zIndex: 50, width: '100%',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#1a1a1a' }}>
          <div style={{ background: '#1D9E75', color: '#fff', fontWeight: '800', fontSize: '12px', letterSpacing: '0.12em', padding: '4px 8px', borderRadius: '3px' }}>SHINE</div>
          <span style={{ fontSize: '13px', fontWeight: '500' }}>Shine Frequency</span>
        </a>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/" style={{ fontSize: '12px', color: '#666', textDecoration: 'none' }}>Home</a>
          <a href="/portal" style={{ fontSize: '12px', color: '#666', textDecoration: 'none' }}>Artist Login</a>
          <a href="/join" style={{ fontSize: '12px', color: '#1D9E75', textDecoration: 'none' }}>DJ Sign Up</a>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', width: '100%' }}>
      <div style={{
        width: '100%', maxWidth: '480px', padding: '2.5rem',
        background: '#fff', border: '1px solid #ddd', borderRadius: '16px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ background: '#1D9E75', color: '#fff', fontWeight: '800', fontSize: '32px', letterSpacing: '0.15em', padding: '12px 24px', borderRadius: '6px', display: 'inline-block' }}>SHINE</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '500', color: '#1a1a1a' }}>
            Join Shine Frequency
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            Artist onboarding — step {step} of 3
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: '3px', borderRadius: '2px',
              background: s <= step ? '#1D9E75' : '#ddd',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Step 1: Basic info */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={lbl}>Stage name *</label>
              <input style={inp()} value={form.stage_name} onChange={e => set('stage_name', e.target.value)} placeholder="Your artist name" />
            </div>
            <div>
              <label style={lbl}>Real name</label>
              <input style={inp()} value={form.real_name} onChange={e => set('real_name', e.target.value)} placeholder="Full legal name" />
            </div>
            <div>
              <label style={lbl}>Email *</label>
              <input style={inp()} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="your@email.com" />
            </div>
            <div>
              <label style={lbl}>Phone</label>
              <input style={inp()} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+44..." />
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
            <div>
              <label style={lbl}>Bio</label>
              <textarea style={{ ...inp({ height: '80px', resize: 'none' }) }} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell us about yourself and your sound..." />
            </div>
          </div>
        )}

        {/* Step 2: Music */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={lbl}>Primary genre *</label>
              <select style={inp()} value={form.genre} onChange={e => set('genre', e.target.value)}>
                <option value="">Select genre...</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>BPM range</label>
              <input style={inp()} value={form.bpm_range} onChange={e => set('bpm_range', e.target.value)} placeholder="130-145" />
            </div>
            <div>
              <label style={lbl}>Demo link</label>
              <input style={inp()} value={form.demo_link} onChange={e => set('demo_link', e.target.value)} placeholder="SoundCloud, Dropbox, WeTransfer, etc." />
            </div>
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
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '4px' }}>
              Review your submission
            </div>

            <div style={{ background: '#E6E6E6', border: '1px solid #ddd', borderRadius: '10px', padding: '1rem' }}>
              {[
                { label: 'Stage name', value: form.stage_name },
                { label: 'Real name', value: form.real_name || '—' },
                { label: 'Email', value: form.email },
                { label: 'Phone', value: form.phone || '—' },
                { label: 'Location', value: [form.city, form.country_code].filter(Boolean).join(', ') || '—' },
                { label: 'Genre', value: form.genre },
                { label: 'BPM range', value: form.bpm_range || '—' },
                { label: 'Demo', value: form.demo_link || '—' },
                { label: 'SoundCloud', value: form.soundcloud_url || '—' },
                { label: 'Instagram', value: form.instagram_handle || '—' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #ddd', fontSize: '12px' }}>
                  <span style={{ color: '#666' }}>{row.label}</span>
                  <span style={{ color: '#1a1a1a', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '12px', color: form.agreed_terms ? '#1D9E75' : '#666', lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={form.agreed_terms}
                onChange={e => set('agreed_terms', e.target.checked)}
                style={{ accentColor: '#1D9E75', marginTop: '2px', flexShrink: 0 }}
              />
              I confirm that the information provided is accurate and I agree to Shine Frequency's terms of use and acceptable use policy. I understand my submission will be reviewed before activation.
            </label>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop: '12px', padding: '10px 12px', background: '#fff0f0', border: '1px solid #e8a0a0', borderRadius: '8px', fontSize: '12px', color: '#c44' }}>
            {error}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '1.5rem' }}>
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} style={{
              padding: '10px 20px', background: 'transparent',
              border: '1px solid #ccc', borderRadius: '8px',
              color: '#666', fontSize: '13px', cursor: 'pointer',
            }}>
              Back
            </button>
          )}
          <button
            onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
            disabled={!canNext() || submitting}
            style={{
              flex: 1, padding: '10px 20px',
              background: !canNext() || submitting ? '#a0d4c0' : '#1D9E75',
              border: 'none', borderRadius: '8px',
              color: '#fff', fontSize: '13px', fontWeight: '500',
              cursor: !canNext() || submitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {submitting ? 'Submitting...' : step < 3 ? 'Next' : 'Submit'}
          </button>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '11px', color: '#999' }}>
          Shine Frequency — London, UK
        </div>
      </div>
      </div>
    </div>
  )
}
