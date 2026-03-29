'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const ENERGY_OPTIONS = ['Low & hypnotic', 'Slow build', 'Mid energy', 'High energy', 'Peak time destroyer']
const MIXABILITY_OPTIONS = ['Very easy to mix', 'Easy', 'Moderate', 'Challenging', 'DJ tool — loop-friendly']
const SOUND_QUALITY_OPTIONS = ['Needs work', 'Decent', 'Good', 'Very good', 'Pristine — mastering is perfect']
const CROWD_REACTION = ['Not tested yet', 'Subtle — heads nodding', 'Good — floor moving', 'Strong — hands up', 'Massive — room erupted']
const PLAY_CONTEXT = ['Warm-up set', 'Opening', 'Peak time', 'Late night / closing', 'After hours', 'Radio / podcast', 'Home listening']
const GENRE_FIT = ['Perfect fit for my sets', 'Works in some sets', 'Outside my usual style', 'Would play as a wildcard']

type Release = {
  id: string
  catalogue_number: string
  title: string
  artist_name: string
  genre: string | null
  artwork_url: string | null
  bpm_range: string | null
}

export default function ReviewPageWrapper() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E6E6E6', color: '#999', fontFamily: 'system-ui' }}>Loading...</div>}>
      <ReviewPage />
    </Suspense>
  )
}

function ReviewPage() {
  const searchParams = useSearchParams()
  const releaseParam = searchParams.get('release') // catalogue number e.g. SF-042
  const contactParam = searchParams.get('contact') // contact email for pre-fill

  const [releases, setReleases] = useState<Release[]>([])
  const [selectedRelease, setSelectedRelease] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: contactParam || '',
    overall_rating: 0,
    energy: '',
    mixability: '',
    sound_quality: '',
    crowd_reaction: '',
    play_context: [] as string[],
    genre_fit: '',
    would_chart: null as boolean | null,
    would_play_out: null as boolean | null,
    favourite_track: '',
    body: '',
    chart_name: '',
  })

  function set(key: string, value: any) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function togglePlayContext(ctx: string) {
    setForm(f => ({
      ...f,
      play_context: f.play_context.includes(ctx)
        ? f.play_context.filter(c => c !== ctx)
        : [...f.play_context, ctx]
    }))
  }

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_releases' }),
      })
      const result = await res.json()
      const data = result.releases ?? []
      setReleases(data)
      if (releaseParam && data) {
        const match = data.find((r: Release) => r.catalogue_number === releaseParam)
        if (match) setSelectedRelease(match.id)
      }
      setLoading(false)
    }
    load()
  }, [])

  const release = releases.find(r => r.id === selectedRelease)

  async function handleSubmit() {
    if (!selectedRelease || !form.name || !form.email || form.overall_rating === 0) {
      setError('Please fill in your name, email, select a release, and give an overall rating.')
      return
    }
    setSubmitting(true)
    setError('')

    // Build review body with structured data
    const structured = [
      `Overall: ${form.overall_rating}/5`,
      form.energy ? `Energy: ${form.energy}` : '',
      form.mixability ? `Mixability: ${form.mixability}` : '',
      form.sound_quality ? `Sound quality: ${form.sound_quality}` : '',
      form.crowd_reaction ? `Crowd reaction: ${form.crowd_reaction}` : '',
      form.play_context.length > 0 ? `Play context: ${form.play_context.join(', ')}` : '',
      form.genre_fit ? `Genre fit: ${form.genre_fit}` : '',
      form.would_chart !== null ? `Would chart: ${form.would_chart ? 'Yes' : 'No'}` : '',
      form.would_play_out !== null ? `Would play out: ${form.would_play_out ? 'Yes' : 'No'}` : '',
      form.favourite_track ? `Favourite track: ${form.favourite_track}` : '',
      form.chart_name ? `Chart: ${form.chart_name}` : '',
      '',
      form.body || '',
    ].filter(Boolean).join('\n')

    try {
      const res = await fetch('/api/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_review',
          email: form.email,
          name: form.name,
          review: {
            release_id: selectedRelease,
            status: 'pending',
            rating: form.overall_rating,
            body: structured,
            charted: form.would_chart ?? false,
            chart_name: form.chart_name || null,
            is_featured: false,
            catalogue_number: release?.catalogue_number,
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

  const starButton = (n: number) => (
    <button
      key={n}
      onClick={() => set('overall_rating', n)}
      style={{
        width: '44px', height: '44px', borderRadius: '10px',
        background: form.overall_rating >= n ? '#1D9E75' : '#fff',
        border: `1px solid ${form.overall_rating >= n ? '#1D9E75' : '#ccc'}`,
        color: form.overall_rating >= n ? '#fff' : '#999',
        fontSize: '18px', cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {n}
    </button>
  )

  const pill = (label: string, selected: boolean, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      style={{
        padding: '7px 14px', borderRadius: '20px',
        background: selected ? '#e6f7f0' : '#fff',
        border: `1px solid ${selected ? '#1D9E75' : '#ccc'}`,
        color: selected ? '#1D9E75' : '#666',
        fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )

  const yesNo = (key: string, value: boolean | null) => (
    <div style={{ display: 'flex', gap: '8px' }}>
      {pill('Yes', value === true, () => set(key, value === true ? null : true))}
      {pill('No', value === false, () => set(key, value === false ? null : false))}
    </div>
  )

  const sectionLabel = (text: string, hint?: string) => (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{text}</div>
      {hint && <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{hint}</div>}
    </div>
  )

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E6E6E6', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', background: '#fff', border: '1px solid #ddd', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: '900', fontSize: '32px', letterSpacing: '0.12em', color: '#FF6B35', marginBottom: '12px' }}>SHINE</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px' }}>Thanks, {form.name}</div>
          <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Your feedback on <strong style={{ color: '#1a1a1a' }}>{release?.artist_name} — {release?.title}</strong> has been submitted.
            Sharon will review it shortly.
          </div>
          {form.would_chart && (
            <div style={{ padding: '10px 16px', background: '#e6f7f0', border: '1px solid #1D9E75', borderRadius: '8px', fontSize: '12px', color: '#1D9E75' }}>
              Chart support noted — thank you!
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#E6E6E6', fontFamily: 'system-ui, sans-serif', padding: '0' }}>
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
          <a href="/portal" style={{ fontSize: '12px', color: '#666', textDecoration: 'none' }}>Login</a>
        </div>
      </div>
      <div style={{ padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: '900', fontSize: '32px', letterSpacing: '0.12em', color: '#FF6B35', marginBottom: '12px' }}>SHINE</div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '500', color: '#1a1a1a' }}>DJ Feedback</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Help us understand how this release works on the floor</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '16px', padding: '1.75rem' }}>

          {/* Release selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            {sectionLabel('Which release?', 'Select the release you\'re reviewing')}
            {loading ? (
              <div style={{ color: '#999', fontSize: '12px' }}>Loading releases...</div>
            ) : (
              <select
                value={selectedRelease}
                onChange={e => setSelectedRelease(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', color: '#1a1a1a', fontSize: '13px', outline: 'none' }}
              >
                <option value="">Select a release...</option>
                {releases.map(r => (
                  <option key={r.id} value={r.id}>{r.catalogue_number} — {r.artist_name} "{r.title}"</option>
                ))}
              </select>
            )}
          </div>

          {/* Release preview */}
          {release && (
            <div style={{ display: 'flex', gap: '12px', padding: '12px', background: '#E6E6E6', borderRadius: '10px', marginBottom: '1.5rem', alignItems: 'center' }}>
              {release.artwork_url ? (
                <img src={release.artwork_url} alt="" style={{ width: '56px', height: '56px', borderRadius: '8px' }} />
              ) : (
                <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999' }}>{release.catalogue_number}</div>
              )}
              <div>
                <div style={{ fontWeight: '500', color: '#1a1a1a', fontSize: '14px' }}>{release.artist_name}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{release.title}</div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{[release.genre, release.bpm_range].filter(Boolean).join(' · ')}</div>
              </div>
            </div>
          )}

          {/* Your details */}
          <div style={{ marginBottom: '1.5rem' }}>
            {sectionLabel('Your details')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name / DJ name" style={{ padding: '10px 14px', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', color: '#1a1a1a', fontSize: '13px', outline: 'none' }} />
              <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email" type="email" style={{ padding: '10px 14px', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', color: '#1a1a1a', fontSize: '13px', outline: 'none' }} />
            </div>
          </div>

          {/* Overall rating */}
          <div style={{ marginBottom: '1.5rem' }}>
            {sectionLabel('Overall rating', 'How would you rate this release? 1 = poor, 5 = essential')}
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map(n => starButton(n))}
            </div>
          </div>

          {/* Energy level */}
          <div style={{ marginBottom: '1.5rem' }}>
            {sectionLabel('Energy level', 'What kind of energy does this release bring?')}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {ENERGY_OPTIONS.map(o => pill(o, form.energy === o, () => set('energy', form.energy === o ? '' : o)))}
            </div>
          </div>

          {/* Mixability */}
          <div style={{ marginBottom: '1.5rem' }}>
            {sectionLabel('Mixability', 'How easy is it to work into a set?')}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {MIXABILITY_OPTIONS.map(o => pill(o, form.mixability === o, () => set('mixability', form.mixability === o ? '' : o)))}
            </div>
          </div>

          {/* Sound quality */}
          <div style={{ marginBottom: '1.5rem' }}>
            {sectionLabel('Sound quality / mastering', 'How does it sound on a big system?')}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {SOUND_QUALITY_OPTIONS.map(o => pill(o, form.sound_quality === o, () => set('sound_quality', form.sound_quality === o ? '' : o)))}
            </div>
          </div>

          {/* Crowd reaction */}
          <div style={{ marginBottom: '1.5rem' }}>
            {sectionLabel('Crowd reaction', 'If you\'ve played it out, how did the crowd respond?')}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {CROWD_REACTION.map(o => pill(o, form.crowd_reaction === o, () => set('crowd_reaction', form.crowd_reaction === o ? '' : o)))}
            </div>
          </div>

          {/* Play context */}
          <div style={{ marginBottom: '1.5rem' }}>
            {sectionLabel('Where would you play this?', 'Select all that apply')}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {PLAY_CONTEXT.map(o => pill(o, form.play_context.includes(o), () => togglePlayContext(o)))}
            </div>
          </div>

          {/* Genre fit */}
          <div style={{ marginBottom: '1.5rem' }}>
            {sectionLabel('Genre fit', 'How well does it fit your sound?')}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {GENRE_FIT.map(o => pill(o, form.genre_fit === o, () => set('genre_fit', form.genre_fit === o ? '' : o)))}
            </div>
          </div>

          {/* Would chart / play out */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              {sectionLabel('Would you chart this?', 'Include in your chart or playlist')}
              {yesNo('would_chart', form.would_chart)}
            </div>
            <div>
              {sectionLabel('Would you play this out?', 'In a live DJ set')}
              {yesNo('would_play_out', form.would_play_out)}
            </div>
          </div>

          {/* Chart name */}
          {form.would_chart && (
            <div style={{ marginBottom: '1.5rem' }}>
              {sectionLabel('Chart name', 'Which chart or playlist will you include it in?')}
              <input value={form.chart_name} onChange={e => set('chart_name', e.target.value)} placeholder="e.g. March Top 10, Berghain Chart" style={{ width: '100%', padding: '10px 14px', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', color: '#1a1a1a', fontSize: '13px', outline: 'none' }} />
            </div>
          )}

          {/* Favourite track */}
          <div style={{ marginBottom: '1.5rem' }}>
            {sectionLabel('Favourite track', 'Which track stands out most?')}
            <input value={form.favourite_track} onChange={e => set('favourite_track', e.target.value)} placeholder="e.g. A1, B2, or track name" style={{ width: '100%', padding: '10px 14px', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', color: '#1a1a1a', fontSize: '13px', outline: 'none' }} />
          </div>

          {/* Written feedback */}
          <div style={{ marginBottom: '1.5rem' }}>
            {sectionLabel('Additional comments', 'Anything else you want to share — production notes, how it went down, suggestions')}
            <textarea
              value={form.body}
              onChange={e => set('body', e.target.value)}
              placeholder="Tell us what you think..."
              style={{ width: '100%', height: '100px', padding: '10px 14px', background: '#fff', border: '1px solid #ccc', borderRadius: '8px', color: '#1a1a1a', fontSize: '13px', outline: 'none', resize: 'none' }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 14px', background: '#fff0f0', border: '1px solid #e8a0a0', borderRadius: '8px', fontSize: '12px', color: '#c44', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%', padding: '12px',
              background: submitting ? '#a0d4c0' : '#1D9E75',
              border: 'none', borderRadius: '8px',
              color: '#fff', fontSize: '14px', fontWeight: '500',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit feedback'}
          </button>

          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '11px', color: '#999' }}>
            Your feedback helps us improve releases and is shared with the artist. Thank you.
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
