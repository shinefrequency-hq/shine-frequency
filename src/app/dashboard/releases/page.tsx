'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Release, ReleaseStatus, HeatStatus } from '@/types/database'

const STATUS_COLORS: Record<ReleaseStatus, { bg: string; color: string }> = {
  draft:     { bg: '#1a1a1a', color: '#666' },
  in_review: { bg: '#1a1a2a', color: '#b8b4f0' },
  scheduled: { bg: '#2a1e0a', color: '#f5c842' },
  live:      { bg: '#0a2a1e', color: '#4ecca3' },
  archived:  { bg: '#1a1a1a', color: '#444' },
}

const HEAT_COLORS: Record<HeatStatus, { bg: string; color: string }> = {
  pending:  { bg: '#1a1a1a', color: '#555' },
  building: { bg: '#0a1a2a', color: '#7ab8f5' },
  warm:     { bg: '#2a1e0a', color: '#f5c842' },
  hot:      { bg: '#2a1000', color: '#ff7043' },
  critical: { bg: '#2a0a0a', color: '#f08080' },
  closed:   { bg: '#1a1a1a', color: '#444' },
}

const EMPTY: Partial<Release> = {
  catalogue_number: '',
  title: '',
  artist_name: '',
  label: 'Shine Frequency',
  status: 'draft',
  format: 'EP',
  total_tracks: 0,
  total_size_mb: 0,
  genre: '',
  dropbox_folder_url: '',
  soundcloud_playlist_url: '',
  description: '',
  internal_notes: '',
}

export default function ReleasesPage() {
  const supabase = createClient()
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<Release>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('releases')
      .select('*')
      .order('created_at', { ascending: false })
    setReleases(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    setError('')
    if (!form.catalogue_number || !form.title || !form.artist_name) {
      setError('Catalogue number, title and artist are required')
      setSaving(false)
      return
    }
    if (editId) {
      const { error } = await supabase.from('releases').update(form).eq('id', editId)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('releases').insert([form])
      if (error) { setError(error.message); setSaving(false); return }
    }
    setForm(EMPTY)
    setShowForm(false)
    setEditId(null)
    setSaving(false)
    load()
  }

  async function deleteRelease(id: string) {
    if (!confirm('Delete this release? This cannot be undone.')) return
    await supabase.from('releases').delete().eq('id', id)
    load()
  }

  function editRelease(r: Release) {
    setForm(r)
    setEditId(r.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtered = releases.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.artist_name.toLowerCase().includes(search.toLowerCase()) ||
    r.catalogue_number.toLowerCase().includes(search.toLowerCase())
  )

  const inp = (style = {}) => ({
    width: '100%', padding: '8px 12px',
    background: '#1a1a1a', border: '0.5px solid #333',
    borderRadius: '8px', color: '#fff', fontSize: '12px',
    outline: 'none', ...style
  } as React.CSSProperties)

  const lbl = { fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' } as React.CSSProperties

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Release manager</div>
          <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{releases.length} total releases</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            placeholder="Search releases..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inp({ width: '200px' }) }}
          />
          <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(!showForm) }} style={{
            padding: '8px 16px', background: showForm ? '#333' : '#1D9E75',
            border: 'none', borderRadius: '8px', color: '#fff',
            fontSize: '12px', fontWeight: '500', cursor: 'pointer'
          }}>
            {showForm ? 'Cancel' : '+ New release'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: '#111', border: '0.5px solid #2a2a2a',
          borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '1rem', color: '#1D9E75' }}>
            {editId ? 'Edit release' : 'New release'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Catalogue number *</label>
              <input style={inp()} value={form.catalogue_number ?? ''} onChange={e => setForm(f => ({ ...f, catalogue_number: e.target.value }))} placeholder="SF-001" />
            </div>
            <div>
              <label style={lbl}>Artist name *</label>
              <input style={inp()} value={form.artist_name ?? ''} onChange={e => setForm(f => ({ ...f, artist_name: e.target.value }))} placeholder="Artist" />
            </div>
            <div>
              <label style={lbl}>Release title *</label>
              <input style={inp()} value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Format</label>
              <select style={inp()} value={form.format ?? 'EP'} onChange={e => setForm(f => ({ ...f, format: e.target.value }))}>
                <option>EP</option><option>LP</option><option>Single</option><option>Album</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select style={inp()} value={form.status ?? 'draft'} onChange={e => setForm(f => ({ ...f, status: e.target.value as ReleaseStatus }))}>
                <option value="draft">Draft</option>
                <option value="in_review">In review</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Total tracks</label>
              <input style={inp()} type="number" value={form.total_tracks ?? 0} onChange={e => setForm(f => ({ ...f, total_tracks: parseInt(e.target.value) }))} />
            </div>
            <div>
              <label style={lbl}>Total size (MB)</label>
              <input style={inp()} type="number" value={form.total_size_mb ?? 0} onChange={e => setForm(f => ({ ...f, total_size_mb: parseFloat(e.target.value) }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Release date</label>
              <input style={inp()} type="date" value={form.release_date ?? ''} onChange={e => setForm(f => ({ ...f, release_date: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Promo window start</label>
              <input style={inp()} type="date" value={form.promo_window_start ?? ''} onChange={e => setForm(f => ({ ...f, promo_window_start: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Promo window end</label>
              <input style={inp()} type="date" value={form.promo_window_end ?? ''} onChange={e => setForm(f => ({ ...f, promo_window_end: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Dropbox folder URL</label>
              <input style={inp()} value={form.dropbox_folder_url ?? ''} onChange={e => setForm(f => ({ ...f, dropbox_folder_url: e.target.value }))} placeholder="https://dropbox.com/sh/..." />
            </div>
            <div>
              <label style={lbl}>SoundCloud playlist URL</label>
              <input style={inp()} value={form.soundcloud_playlist_url ?? ''} onChange={e => setForm(f => ({ ...f, soundcloud_playlist_url: e.target.value }))} placeholder="https://soundcloud.com/..." />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Genre</label>
              <input style={inp()} value={form.genre ?? ''} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} placeholder="Techno, Industrial..." />
            </div>
            <div>
              <label style={lbl}>BPM range</label>
              <input style={inp()} value={form.bpm_range ?? ''} onChange={e => setForm(f => ({ ...f, bpm_range: e.target.value }))} placeholder="130–145" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Description</label>
              <textarea style={{ ...inp({ height: '72px', resize: 'none' }) }} value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Public description..." />
            </div>
            <div>
              <label style={lbl}>Internal notes</label>
              <textarea style={{ ...inp({ height: '72px', resize: 'none' }) }} value={form.internal_notes ?? ''} onChange={e => setForm(f => ({ ...f, internal_notes: e.target.value }))} placeholder="Private notes for Sharon only..." />
            </div>
          </div>

          {error && (
            <div style={{ padding: '8px 12px', background: '#2a0a0a', border: '0.5px solid #5a1a1a', borderRadius: '8px', fontSize: '12px', color: '#f08080', marginBottom: '12px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={save} disabled={saving} style={{
              padding: '8px 20px', background: saving ? '#0a4a30' : '#1D9E75',
              border: 'none', borderRadius: '8px', color: '#fff',
              fontSize: '12px', fontWeight: '500', cursor: 'pointer'
            }}>
              {saving ? 'Saving...' : editId ? 'Update release' : 'Create release'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY); setEditId(null) }} style={{
              padding: '8px 16px', background: 'transparent',
              border: '0.5px solid #333', borderRadius: '8px',
              color: '#666', fontSize: '12px', cursor: 'pointer'
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#111', border: '0.5px solid #222', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#555', fontSize: '12px' }}>Loading releases...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>No releases yet</div>
            <div style={{ fontSize: '12px', color: '#555' }}>Click "New release" to add your first release to the catalogue.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #222' }}>
                {['Cat #', 'Release', 'Format', 'Tracks', 'Size', 'Promo window', 'Status', 'Heat', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#555' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const sc = STATUS_COLORS[r.status]
                const hc = HEAT_COLORS[r.heat_status]
                const windowEnd = r.promo_window_end ? new Date(r.promo_window_end) : null
                const daysLeft = windowEnd ? Math.ceil((windowEnd.getTime() - Date.now()) / 86400000) : null
                return (
                  <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid #1a1a1a' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#161616')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#555' }}>{r.catalogue_number}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '500', color: '#fff' }}>{r.artist_name}</div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '1px' }}>{r.title}</div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#888' }}>{r.format}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#888' }}>{r.total_tracks}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#888' }}>{r.total_size_mb > 0 ? `${r.total_size_mb} MB` : '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '11px' }}>
                      {r.promo_window_start && r.promo_window_end ? (
                        <div>
                          <div style={{ color: '#888' }}>{new Date(r.promo_window_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} — {new Date(r.promo_window_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                          {daysLeft !== null && (
                            <div style={{ marginTop: '2px', color: daysLeft <= 3 ? '#f08080' : daysLeft <= 7 ? '#f5c842' : '#555' }}>
                              {daysLeft > 0 ? `${daysLeft}d left` : 'Closed'}
                            </div>
                          )}
                        </div>
                      ) : <span style={{ color: '#333' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: sc.bg, color: sc.color }}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: hc.bg, color: hc.color }}>
                        {r.heat_status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => editRelease(r)} style={{ padding: '4px 10px', background: 'transparent', border: '0.5px solid #333', borderRadius: '6px', color: '#888', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                        {r.dropbox_folder_url && (
                          <a href={r.dropbox_folder_url} target="_blank" rel="noreferrer" style={{ padding: '4px 10px', background: '#0a1e30', border: '0.5px solid #0a3a5a', borderRadius: '6px', color: '#7ab8f5', fontSize: '11px' }}>Dropbox</a>
                        )}
                        {r.soundcloud_playlist_url && (
                          <a href={r.soundcloud_playlist_url} target="_blank" rel="noreferrer" style={{ padding: '4px 10px', background: '#1a0a00', border: '0.5px solid #3a1a00', borderRadius: '6px', color: '#ff7043', fontSize: '11px' }}>SC</a>
                        )}
                        <button onClick={() => deleteRelease(r.id)} style={{ padding: '4px 10px', background: 'transparent', border: '0.5px solid #2a1a1a', borderRadius: '6px', color: '#5a2a2a', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
