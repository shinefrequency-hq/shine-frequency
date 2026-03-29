'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import { useRouter } from 'next/navigation'
import type { Contact } from '@/types/database'

const FORMATS = ['EP', 'LP', 'Single', 'Album', 'Compilation']
const GENRES = ['Techno', 'Industrial Techno', 'Hard Techno', 'Minimal Techno', 'Dark Techno',
  'Acid Techno', 'Broken Techno', 'EBM', 'Electro', 'Ambient', 'Noise', 'Experimental', 'Other']

interface Track {
  position: string
  title: string
  bpm: number | null
  key: string
  duration_seconds: number | null
}

export default function NewReleaseWizard() {
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedPromo, setSelectedPromo] = useState<Set<string>>(new Set())
  const [createdReleaseId, setCreatedReleaseId] = useState<string | null>(null)

  // Step 1: Release details
  const [details, setDetails] = useState({
    catalogue_number: '',
    title: '',
    artist_name: '',
    format: 'EP',
    genre: '',
    bpm_range: '',
    release_date: '',
    description: '',
    internal_notes: '',
    artwork_url: '',
  })

  // Step 2: Tracks
  const [tracks, setTracks] = useState<Track[]>([
    { position: 'A1', title: '', bpm: null, key: '', duration_seconds: null },
    { position: 'A2', title: '', bpm: null, key: '', duration_seconds: null },
  ])

  // Step 3: Promo dates
  const [promo, setPromo] = useState({
    promo_window_start: '',
    promo_window_end: '',
  })

  useEffect(() => {
    (supabase as any).from('contacts').select('*')
      .eq('is_on_promo_list', true)
      .order('full_name')
      .then(({ data }: any) => setContacts(data ?? []))
  }, [])

  function addTrack() {
    const positions = ['A1','A2','B1','B2','C1','C2','D1','D2','E1','E2']
    const nextPos = positions[tracks.length] || `${tracks.length + 1}`
    setTracks([...tracks, { position: nextPos, title: '', bpm: null, key: '', duration_seconds: null }])
  }

  function removeTrack(idx: number) {
    setTracks(tracks.filter((_, i) => i !== idx))
  }

  function updateTrack(idx: number, field: keyof Track, value: any) {
    setTracks(tracks.map((t, i) => i === idx ? { ...t, [field]: value } : t))
  }

  function canProceed() {
    if (step === 1) return details.catalogue_number && details.title && details.artist_name
    if (step === 2) return tracks.some(t => t.title)
    if (step === 3) return true
    if (step === 4) return true
    return true
  }

  async function createRelease() {
    setSaving(true)
    const validTracks = tracks.filter(t => t.title)

    // Create release
    const { data: release, error: relErr } = await (supabase as any)
      .from('releases')
      .insert([{
        ...details,
        ...promo,
        status: 'draft',
        heat_status: 'pending',
        label: 'Shine Frequency',
        total_tracks: validTracks.length,
        release_date: details.release_date || null,
        promo_window_start: promo.promo_window_start || null,
        promo_window_end: promo.promo_window_end || null,
      }])
      .select()
      .single()

    if (relErr) {
      toast(relErr.message, 'error')
      setSaving(false)
      return
    }

    setCreatedReleaseId(release.id)

    // Create tracks
    if (validTracks.length > 0) {
      await (supabase as any).from('tracks').insert(
        validTracks.map(t => ({
          release_id: release.id,
          position: t.position,
          title: t.title,
          bpm: t.bpm,
          key: t.key,
          duration_seconds: t.duration_seconds,
          download_count: 0,
          play_count: 0,
          review_count: 0,
          charted_count: 0,
        }))
      )
    }

    // Add to promo lists
    if (selectedPromo.size > 0) {
      const promoRows = [...selectedPromo].map(contactId => ({
        release_id: release.id,
        contact_id: contactId,
      }))
      await (supabase as any).from('promo_lists').insert(promoRows)
    }

    // Create Dropbox folder if connected
    try {
      const dbRes = await fetch('/api/dropbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_release_folder',
          catalogue_number: details.catalogue_number,
          artist_name: details.artist_name,
        }),
      })
      if (dbRes.ok) {
        const dbData = await dbRes.json()
        if (dbData.share_url) {
          await (supabase as any).from('releases').update({
            dropbox_folder_url: dbData.share_url,
            dropbox_folder_id: dbData.folder_id,
          }).eq('id', release.id)
        }
      }
    } catch {}

    // Create task
    await (supabase as any).from('tasks').insert([{
      title: `New release created: ${details.catalogue_number} ${details.artist_name} — ${details.title}`,
      urgency: 'today',
      related_release_id: release.id,
      auto_generated: true,
    }])

    setSaving(false)
    setStep(5) // done
    toast('Release created with tracks, promo list and Dropbox folder')
  }

  const inp = (style: any = {}) => ({
    width: '100%', padding: '10px 14px',
    background: 'var(--bg-4)', border: '0.5px solid var(--border-3)',
    borderRadius: '8px', color: 'var(--text)', fontSize: '13px', outline: 'none',
    ...style,
  } as React.CSSProperties)

  const lbl = { fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' } as React.CSSProperties
  const sectionHead = (text: string, sub: string) => (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text)' }}>{text}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '3px' }}>{sub}</div>
    </div>
  )

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>New release wizard</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
            {step < 5 ? `Step ${step} of 4 — ${['Release details', 'Tracklisting', 'Promo window', 'Assign promo contacts'][step - 1]}` : 'Complete'}
          </div>
        </div>
        {step < 5 && (
          <button onClick={() => router.push('/dashboard/releases')} style={{
            padding: '8px 16px', background: 'transparent',
            border: '0.5px solid var(--border-3)', borderRadius: '8px',
            color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer'
          }}>Cancel</button>
        )}
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem' }}>
        {[1, 2, 3, 4].map(s => (
          <div key={s} style={{
            flex: 1, height: '3px', borderRadius: '2px',
            background: s <= step ? '#1D9E75' : 'var(--border-3)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', padding: '1.5rem' }}>

        {/* Step 1: Details */}
        {step === 1 && (
          <>
            {sectionHead('Release details', 'Basic information about the release — catalogue number, artist, format')}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={lbl}>Cat # *</label>
                <input style={inp()} value={details.catalogue_number} onChange={e => setDetails(d => ({ ...d, catalogue_number: e.target.value }))} placeholder="SF-046" />
              </div>
              <div>
                <label style={lbl}>Artist *</label>
                <input style={inp()} value={details.artist_name} onChange={e => setDetails(d => ({ ...d, artist_name: e.target.value }))} placeholder="Artist name" />
              </div>
              <div>
                <label style={lbl}>Title *</label>
                <input style={inp()} value={details.title} onChange={e => setDetails(d => ({ ...d, title: e.target.value }))} placeholder="Release title" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={lbl}>Format</label>
                <select style={inp()} value={details.format} onChange={e => setDetails(d => ({ ...d, format: e.target.value }))}>
                  {FORMATS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Genre</label>
                <select style={inp()} value={details.genre} onChange={e => setDetails(d => ({ ...d, genre: e.target.value }))}>
                  <option value="">Select...</option>
                  {GENRES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>BPM range</label>
                <input style={inp()} value={details.bpm_range} onChange={e => setDetails(d => ({ ...d, bpm_range: e.target.value }))} placeholder="130–140" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={lbl}>Release date</label>
                <input style={inp()} type="date" value={details.release_date} onChange={e => setDetails(d => ({ ...d, release_date: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Artwork URL</label>
                <input style={inp()} value={details.artwork_url} onChange={e => setDetails(d => ({ ...d, artwork_url: e.target.value }))} placeholder="/artwork/sf-046.svg" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl}>Description (public)</label>
                <textarea style={{ ...inp({ height: '80px', resize: 'none' }) }} value={details.description} onChange={e => setDetails(d => ({ ...d, description: e.target.value }))} placeholder="What makes this release special?" />
              </div>
              <div>
                <label style={lbl}>Internal notes (private)</label>
                <textarea style={{ ...inp({ height: '80px', resize: 'none' }) }} value={details.internal_notes} onChange={e => setDetails(d => ({ ...d, internal_notes: e.target.value }))} placeholder="Notes for Sharon only..." />
              </div>
            </div>
          </>
        )}

        {/* Step 2: Tracks */}
        {step === 2 && (
          <>
            {sectionHead('Tracklisting', 'Add each track with position, BPM and key. This helps DJs find what they need.')}
            {tracks.map((t, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 80px 70px 40px', gap: '8px', marginBottom: '8px', alignItems: 'end' }}>
                <div>
                  {idx === 0 && <label style={lbl}>Pos</label>}
                  <input style={inp()} value={t.position} onChange={e => updateTrack(idx, 'position', e.target.value)} placeholder="A1" />
                </div>
                <div>
                  {idx === 0 && <label style={lbl}>Track title</label>}
                  <input style={inp()} value={t.title} onChange={e => updateTrack(idx, 'title', e.target.value)} placeholder="Track name" />
                </div>
                <div>
                  {idx === 0 && <label style={lbl}>BPM</label>}
                  <input style={inp()} type="number" value={t.bpm ?? ''} onChange={e => updateTrack(idx, 'bpm', e.target.value ? parseInt(e.target.value) : null)} placeholder="138" />
                </div>
                <div>
                  {idx === 0 && <label style={lbl}>Key</label>}
                  <input style={inp()} value={t.key} onChange={e => updateTrack(idx, 'key', e.target.value)} placeholder="Am" />
                </div>
                <button onClick={() => removeTrack(idx)} style={{ padding: '10px', background: 'transparent', border: 'none', color: 'var(--red-muted)', fontSize: '16px', cursor: 'pointer', marginBottom: '1px' }}>×</button>
              </div>
            ))}
            <button onClick={addTrack} style={{ padding: '8px 16px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', marginTop: '4px' }}>
              + Add track
            </button>
          </>
        )}

        {/* Step 3: Promo window */}
        {step === 3 && (
          <>
            {sectionHead('Promo window', 'Set when promo access opens and closes. DJs can download and review during this window.')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={lbl}>Promo opens</label>
                <input style={inp()} type="date" value={promo.promo_window_start} onChange={e => setPromo(p => ({ ...p, promo_window_start: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Promo closes</label>
                <input style={inp()} type="date" value={promo.promo_window_end} onChange={e => setPromo(p => ({ ...p, promo_window_end: e.target.value }))} />
              </div>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--bg-4)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.6 }}>
              Tip: A typical promo window is 2–4 weeks before the release date. This gives DJs time to download, listen, and submit feedback before it goes live.
            </div>
          </>
        )}

        {/* Step 4: Promo list */}
        {step === 4 && (
          <>
            {sectionHead('Assign promo contacts', 'Choose which DJs, press and industry contacts get access. You can filter by tier.')}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {[1, 2, 3].map(tier => {
                const tierContacts = contacts.filter(c => (c.promo_tier ?? 1) === tier)
                return (
                  <button key={tier} onClick={() => {
                    const next = new Set(selectedPromo)
                    tierContacts.forEach(c => next.add(c.id))
                    setSelectedPromo(next)
                  }} style={{ padding: '6px 14px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}>
                    + Tier {tier} ({tierContacts.length})
                  </button>
                )
              })}
              <button onClick={() => { const next = new Set(selectedPromo); contacts.forEach(c => next.add(c.id)); setSelectedPromo(next) }} style={{ padding: '6px 14px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}>
                + All ({contacts.length})
              </button>
              {selectedPromo.size > 0 && (
                <button onClick={() => setSelectedPromo(new Set())} style={{ padding: '6px 14px', background: 'transparent', border: '0.5px solid var(--red-muted-border)', borderRadius: '6px', color: 'var(--red-muted)', fontSize: '11px', cursor: 'pointer' }}>
                  Clear ({selectedPromo.size})
                </button>
              )}
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {contacts.map(c => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '0.5px solid var(--row-border)', cursor: 'pointer', fontSize: '12px' }}>
                  <input type="checkbox" checked={selectedPromo.has(c.id)} onChange={() => {
                    const next = new Set(selectedPromo)
                    if (next.has(c.id)) next.delete(c.id); else next.add(c.id)
                    setSelectedPromo(next)
                  }} style={{ accentColor: '#1D9E75' }} />
                  <span style={{ fontWeight: '500', color: 'var(--text)' }}>{c.full_name}</span>
                  <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>{c.type} · Tier {c.promo_tier ?? 1}</span>
                  <span style={{ color: 'var(--text-3)', fontSize: '11px', marginLeft: 'auto' }}>{c.email ?? ''}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {/* Step 5: Done */}
        {step === 5 && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>Done</div>
            <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text)', marginBottom: '6px' }}>
              {details.catalogue_number} — {details.artist_name} "{details.title}"
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Release created as draft · {tracks.filter(t => t.title).length} tracks added · {selectedPromo.size} promo contacts assigned
              <br />Dropbox folder created (if connected)
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={() => router.push('/dashboard/releases')} style={{ padding: '10px 24px', background: '#1D9E75', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                View releases
              </button>
              {createdReleaseId && (
                <button onClick={() => router.push(`/dashboard/releases/promo?release=${createdReleaseId}`)} style={{ padding: '10px 24px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}>
                  Manage promo list
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      {step < 5 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', justifyContent: 'space-between' }}>
          <div>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} style={{ padding: '10px 20px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}>
                Back
              </button>
            )}
          </div>
          <button
            onClick={() => step < 4 ? setStep(step + 1) : createRelease()}
            disabled={!canProceed() || saving}
            style={{
              padding: '10px 24px',
              background: !canProceed() || saving ? 'var(--green-dim)' : '#1D9E75',
              border: 'none', borderRadius: '8px',
              color: '#fff', fontSize: '13px', fontWeight: '500',
              cursor: !canProceed() || saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Creating...' : step < 4 ? 'Next' : 'Create release'}
          </button>
        </div>
      )}
    </div>
  )
}
