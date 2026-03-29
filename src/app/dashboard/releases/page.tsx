'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import { AudioPlayer } from '@/lib/audio-player'
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
  const { toast } = useToast()
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<Release>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterHeat, setFilterHeat] = useState<string>('all')
  const [filterFormat, setFilterFormat] = useState<string>('all')
  const [sortKey, setSortKey] = useState<string>('created_at')
  const [sortAsc, setSortAsc] = useState(false)
  const [selected, setSelected] = useState<Release | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 25

  function toggleSort(key: string) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

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

  useEffect(() => setPage(1), [search, filterStatus, filterHeat, filterFormat])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (showForm) { setShowForm(false); setForm(EMPTY); setEditId(null) }
        else if (selected) { setSelected(null) }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [showForm, selected])

  async function save() {
    setSaving(true)
    setError('')
    if (!form.catalogue_number || !form.title || !form.artist_name) {
      setError('Catalogue number, title and artist are required')
      setSaving(false)
      return
    }
    if (editId) {
      const { error } = await (supabase as any).from('releases').update(form as any).eq('id', editId)
      if (error) { setError(error.message); toast(error.message, 'error'); setSaving(false); return }
    } else {
      const { error } = await (supabase as any).from('releases').insert([form as any])
      if (error) { setError(error.message); toast(error.message, 'error'); setSaving(false); return }
    }
    const wasEdit = !!editId
    setForm(EMPTY)
    setShowForm(false)
    setEditId(null)
    setSaving(false)
    load()
    toast(wasEdit ? 'Release updated' : 'Release created')
  }

  async function deleteRelease(id: string) {
    if (!confirm('Delete this release? This cannot be undone.')) return
    await (supabase as any).from('releases').delete().eq('id', id)
    load()
    toast('Release deleted')
  }

  async function createDropboxFolder(r: Release) {
    toast('Creating Dropbox folder...', 'info')
    const res = await fetch('/api/dropbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_release_folder',
        catalogue_number: r.catalogue_number,
        artist_name: r.artist_name,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast(data.error || 'Failed to create folder', 'error')
      return
    }
    // Update release with the Dropbox URL
    await (supabase as any).from('releases').update({
      dropbox_folder_url: data.share_url,
      dropbox_folder_id: data.folder_id,
    }).eq('id', r.id)
    toast('Dropbox folder created with subfolders')
    load()
  }

  function editRelease(r: Release) {
    setForm(r)
    setEditId(r.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtered = releases.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.artist_name.toLowerCase().includes(search.toLowerCase()) ||
      r.catalogue_number.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || r.status === filterStatus
    const matchHeat = filterHeat === 'all' || r.heat_status === filterHeat
    const matchFormat = filterFormat === 'all' || r.format === filterFormat
    return matchSearch && matchStatus && matchHeat && matchFormat
  }).sort((a, b) => {
    const av = (a as any)[sortKey] ?? ''
    const bv = (b as any)[sortKey] ?? ''
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return sortAsc ? cmp : -cmp
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const inp = (style = {}) => ({
    width: '100%', padding: '8px 12px',
    background: 'var(--bg-4)', border: '0.5px solid var(--border-3)',
    borderRadius: '8px', color: 'var(--text)', fontSize: '12px',
    outline: 'none', ...style
  } as React.CSSProperties)

  const lbl = { fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' } as React.CSSProperties

  return (
    <div style={{ padding: '1.5rem', maxWidth: selected ? '1500px' : '1100px', transition: 'max-width 0.2s' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Release manager</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{releases.length} releases · Add, edit and track all your catalogue releases</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            placeholder="Search releases..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inp({ width: '200px' }) }}
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp({ width: '120px' }) }}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="archived">Archived</option>
          </select>
          <select value={filterHeat} onChange={e => setFilterHeat(e.target.value)} style={{ ...inp({ width: '110px' }) }}>
            <option value="all">All heat</option>
            <option value="pending">Pending</option>
            <option value="building">Building</option>
            <option value="warm">Warm</option>
            <option value="hot">Hot</option>
            <option value="critical">Critical</option>
            <option value="closed">Closed</option>
          </select>
          <select value={filterFormat} onChange={e => setFilterFormat(e.target.value)} style={{ ...inp({ width: '100px' }) }}>
            <option value="all">All formats</option>
            <option value="EP">EP</option>
            <option value="LP">LP</option>
            <option value="Single">Single</option>
            <option value="Album">Album</option>
          </select>
          <a href="/dashboard/releases/new" style={{
            padding: '8px 16px', background: '#0a1a2a',
            border: '0.5px solid #1a3a5a', borderRadius: '8px', color: '#7ab8f5',
            fontSize: '12px', fontWeight: '500', cursor: 'pointer', textDecoration: 'none'
          }}>
            Wizard
          </a>
          <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(!showForm) }} style={{
            padding: '8px 16px', background: showForm ? 'var(--border-3)' : '#1D9E75',
            border: 'none', borderRadius: '8px', color: 'var(--text)',
            fontSize: '12px', fontWeight: '500', cursor: 'pointer'
          }}>
            {showForm ? 'Cancel' : '+ Quick add'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div onKeyDown={e => e.key === 'Enter' && e.metaKey && save()} style={{
          background: 'var(--bg-2)', border: '0.5px solid var(--border-2)',
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

          <div style={{ marginBottom: '12px' }}>
            <label style={lbl}>Artwork URL</label>
            <input style={inp()} value={form.artwork_url ?? ''} onChange={e => setForm(f => ({ ...f, artwork_url: e.target.value }))} placeholder="/artwork/sf-041.svg or https://..." />
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
            <div style={{ padding: '8px 12px', background: 'var(--red-bg)', border: '0.5px solid var(--red-border)', borderRadius: '8px', fontSize: '12px', color: '#f08080', marginBottom: '12px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={save} disabled={saving} style={{
              padding: '8px 20px', background: saving ? 'var(--green-dim)' : '#1D9E75',
              border: 'none', borderRadius: '8px', color: 'var(--text)',
              fontSize: '12px', fontWeight: '500', cursor: 'pointer'
            }}>
              {saving ? 'Saving...' : editId ? 'Update release' : 'Create release'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY); setEditId(null) }} style={{
              padding: '8px 16px', background: 'transparent',
              border: '0.5px solid var(--border-3)', borderRadius: '8px',
              color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer'
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table + Detail panel grid */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '1rem' }}>
      <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>Loading releases...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>No releases yet</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Click "New release" to add your first release to the catalogue.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {[
                  { label: 'Cat #', key: 'catalogue_number' },
                  { label: 'Release', key: 'artist_name' },
                  { label: 'Format', key: 'format' },
                  { label: 'Tracks', key: 'total_tracks' },
                  { label: 'Size', key: 'total_size_mb' },
                  { label: 'Promo window', key: 'promo_window_end' },
                  { label: 'Status', key: 'status' },
                  { label: 'Heat', key: 'heat_status' },
                  { label: 'Actions', key: '' },
                ].map(h => (
                  <th key={h.label} onClick={() => h.key && toggleSort(h.key)} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', cursor: h.key ? 'pointer' : 'default', userSelect: 'none' }}>
                    {h.label}{sortKey === h.key ? (sortAsc ? ' ▲' : ' ▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((r, i) => {
                const sc = STATUS_COLORS[r.status]
                const hc = HEAT_COLORS[r.heat_status]
                const windowEnd = r.promo_window_end ? new Date(r.promo_window_end) : null
                const daysLeft = windowEnd ? Math.ceil((windowEnd.getTime() - Date.now()) / 86400000) : null
                return (
                  <tr key={r.id} onClick={() => setSelected(selected?.id === r.id ? null : r)} style={{ borderBottom: i < paginated.length - 1 ? '0.5px solid var(--row-border)' : 'none', transition: 'background 0.1s', cursor: 'pointer', background: selected?.id === r.id ? 'var(--row-selected)' : 'transparent' }}
                    onMouseEnter={e => { if (selected?.id !== r.id) e.currentTarget.style.background = 'var(--row-hover)' }}
                    onMouseLeave={e => { if (selected?.id !== r.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-3)' }}>{r.catalogue_number}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {r.artwork_url ? (
                          <img src={r.artwork_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'var(--bg-4)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text-3)' }}>
                            {r.catalogue_number.slice(-3)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: '500', color: 'var(--text)' }}>{r.artist_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{r.title}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-faint)' }}>{r.format}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-faint)' }}>{r.total_tracks}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-faint)' }}>{r.total_size_mb > 0 ? `${r.total_size_mb} MB` : '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '11px' }}>
                      {r.promo_window_start && r.promo_window_end ? (
                        <div>
                          <div style={{ color: 'var(--text-faint)' }}>{new Date(r.promo_window_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} — {new Date(r.promo_window_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                          {daysLeft !== null && (
                            <div style={{ marginTop: '2px', color: daysLeft <= 3 ? '#f08080' : daysLeft <= 7 ? '#f5c842' : 'var(--text-3)' }}>
                              {daysLeft > 0 ? `${daysLeft}d left` : 'Closed'}
                            </div>
                          )}
                        </div>
                      ) : <span style={{ color: 'var(--text-5)' }}>—</span>}
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
                      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => editRelease(r)} style={{ padding: '4px 10px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '6px', color: 'var(--text-faint)', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                        {!r.dropbox_folder_url && (
                          <button onClick={() => createDropboxFolder(r)} style={{ padding: '4px 10px', background: '#0a1a2a', border: '0.5px solid #1a3a5a', borderRadius: '6px', color: '#7ab8f5', fontSize: '11px', cursor: 'pointer' }}>+ Dropbox</button>
                        )}
                        {r.dropbox_folder_url && (
                          <a href={r.dropbox_folder_url} target="_blank" rel="noreferrer" style={{ padding: '4px 10px', background: 'var(--blue-bg)', border: '0.5px solid var(--blue-border)', borderRadius: '6px', color: '#7ab8f5', fontSize: '11px' }}>Dropbox</a>
                        )}
                        {r.soundcloud_playlist_url && (
                          <a href={r.soundcloud_playlist_url} target="_blank" rel="noreferrer" style={{ padding: '4px 10px', background: 'var(--orange-bg)', border: '0.5px solid var(--orange-border)', borderRadius: '6px', color: '#ff7043', fontSize: '11px' }}>SC</a>
                        )}
                        <button onClick={() => deleteRelease(r.id)} style={{ padding: '4px 10px', background: 'transparent', border: '0.5px solid var(--red-muted-border)', borderRadius: '6px', color: 'var(--red-muted)', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '1rem' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 14px', background: page === 1 ? 'var(--bg-3)' : 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '6px', color: page === 1 ? 'var(--text-5)' : 'var(--text-3)', fontSize: '12px', cursor: page === 1 ? 'default' : 'pointer' }}>Previous</button>
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Page {page} of {totalPages} · {filtered.length} results</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 14px', background: page === totalPages ? 'var(--bg-3)' : 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '6px', color: page === totalPages ? 'var(--text-5)' : 'var(--text-3)', fontSize: '12px', cursor: page === totalPages ? 'default' : 'pointer' }}>Next</button>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', padding: '1.25rem', alignSelf: 'start', position: 'sticky', top: '1.5rem' }}>
          {/* Close button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              {selected.artwork_url && <img src={selected.artwork_url} alt="" style={{ width: '80px', height: '80px', borderRadius: '8px', marginBottom: '10px' }} />}
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#1D9E75' }}>{selected.catalogue_number}</div>
              <div style={{ fontWeight: '500', fontSize: '16px', marginTop: '2px' }}>{selected.artist_name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '2px' }}>{selected.title}</div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: '16px', cursor: 'pointer' }}>×</button>
          </div>

          {/* Status + Heat badges */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem' }}>
            <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: STATUS_COLORS[selected.status].bg, color: STATUS_COLORS[selected.status].color }}>{selected.status.replace('_', ' ')}</span>
            <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: HEAT_COLORS[selected.heat_status].bg, color: HEAT_COLORS[selected.heat_status].color }}>{selected.heat_status}</span>
          </div>

          {/* Details grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginBottom: '1rem' }}>
            {selected.format && <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: 'var(--text-3)', width: '100px' }}>Format</span><span>{selected.format} · {selected.total_tracks} tracks</span></div>}
            {selected.genre && <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: 'var(--text-3)', width: '100px' }}>Genre</span><span>{selected.genre}</span></div>}
            {selected.bpm_range && <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: 'var(--text-3)', width: '100px' }}>BPM</span><span>{selected.bpm_range}</span></div>}
            {selected.release_date && <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: 'var(--text-3)', width: '100px' }}>Release date</span><span>{new Date(selected.release_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>}
            {selected.total_size_mb > 0 && <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: 'var(--text-3)', width: '100px' }}>Size</span><span>{selected.total_size_mb} MB</span></div>}
          </div>

          {/* Promo window */}
          {selected.promo_window_start && selected.promo_window_end && (
            <div style={{ background: 'var(--bg-4)', borderRadius: '8px', padding: '10px', marginBottom: '1rem', fontSize: '12px' }}>
              <div style={{ color: 'var(--text-3)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Promo window</div>
              <div>{new Date(selected.promo_window_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} — {new Date(selected.promo_window_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
            </div>
          )}

          {/* Description */}
          {selected.description && (
            <div style={{ fontSize: '12px', color: 'var(--text-faint)', lineHeight: 1.6, marginBottom: '1rem', padding: '10px', background: 'var(--bg-4)', borderRadius: '8px' }}>
              {selected.description}
            </div>
          )}

          {/* Internal notes */}
          {selected.internal_notes && (
            <div style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.6, marginBottom: '1rem', padding: '10px', background: 'var(--bg-4)', borderRadius: '8px', borderLeft: '2px solid #f5c842' }}>
              <div style={{ fontSize: '10px', color: '#f5c842', marginBottom: '4px', textTransform: 'uppercase' }}>Internal notes</div>
              {selected.internal_notes}
            </div>
          )}

          {/* Audio preview */}
          {selected.dropbox_folder_url && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Preview tracks</div>
              <AudioPlayer releaseId={selected.id} dropboxFolderPath={`/Shine Frequency/${selected.catalogue_number} - ${selected.artist_name}`} />
            </div>
          )}

          {/* Social share */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Quick share</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={() => {
                const text = `${selected.catalogue_number} — ${selected.artist_name} "${selected.title}" out now on Shine Frequency. ${selected.genre || 'Techno'}.`
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
              }} style={{ padding: '5px 12px', background: '#0a1a2a', border: '0.5px solid #1a3a5a', borderRadius: '6px', color: '#7ab8f5', fontSize: '11px', cursor: 'pointer' }}>
                Post to X
              </button>
              <button onClick={() => {
                const text = `${selected.catalogue_number} — ${selected.artist_name} "${selected.title}"\n\n${selected.description || ''}\n\n#techno #${selected.artist_name.replace(/\s+/g, '').toLowerCase()} #shinefrequency${selected.genre ? ' #' + selected.genre.split(',')[0].trim().replace(/\s+/g, '').toLowerCase() : ''}`
                navigator.clipboard.writeText(text)
                toast('Caption copied — paste into Instagram')
              }} style={{ padding: '5px 12px', background: '#2a0a1a', border: '0.5px solid #5a1a3a', borderRadius: '6px', color: '#f48fb1', fontSize: '11px', cursor: 'pointer' }}>
                Copy for IG
              </button>
              <button onClick={() => {
                const text = `${selected.catalogue_number} — ${selected.artist_name} "${selected.title}" | ${selected.genre || 'Techno'} | ${selected.format} | Shine Frequency`
                navigator.clipboard.writeText(text)
                toast('Post text copied to clipboard')
              }} style={{ padding: '5px 12px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '6px', color: 'var(--text-3)', fontSize: '11px', cursor: 'pointer' }}>
                Copy text
              </button>
              <a href={`/review?release=${selected.catalogue_number}`} target="_blank" style={{ padding: '5px 12px', background: '#0a2a1e', border: '0.5px solid #1D9E75', borderRadius: '6px', color: '#4ecca3', fontSize: '11px', cursor: 'pointer', textDecoration: 'none' }}>
                DJ feedback link
              </a>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button onClick={() => editRelease(selected)} style={{ padding: '8px', background: '#1D9E75', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Edit release</button>
            <a href={`/dashboard/releases/promo?release=${selected.id}`} style={{ padding: '8px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-faint)', fontSize: '12px', cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>Manage promo list</a>
            {selected.dropbox_folder_url && (
              <a href={selected.dropbox_folder_url} target="_blank" rel="noreferrer" style={{ padding: '8px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: '#7ab8f5', fontSize: '12px', textAlign: 'center', textDecoration: 'none' }}>Open Dropbox folder</a>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
