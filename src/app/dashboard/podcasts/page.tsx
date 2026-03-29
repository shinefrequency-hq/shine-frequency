'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import type { PodcastShow, PodcastEpisode, PodcastStatus } from '@/types/database'

const STATUS_COLORS: Record<PodcastStatus, { bg: string; color: string }> = {
  draft:     { bg: '#1a1a1a', color: '#666' },
  scheduled: { bg: '#2a1e0a', color: '#f5c842' },
  published: { bg: '#0a2a1e', color: '#4ecca3' },
  archived:  { bg: '#1a1a1a', color: '#444' },
}

const EMPTY_EPISODE: Partial<PodcastEpisode> = {
  show_id: '',
  episode_number: 1,
  title: '',
  description: '',
  guest_name: '',
  duration_seconds: 0,
  file_url: '',
  status: 'draft',
}

export default function PodcastsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [shows, setShows] = useState<PodcastShow[]>([])
  const [episodes, setEpisodes] = useState<(PodcastEpisode & { show_name?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<PodcastEpisode>>(EMPTY_EPISODE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterShow, setFilterShow] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedShow, setSelectedShow] = useState<PodcastShow | null>(null)

  async function load() {
    setLoading(true)
    const { data: sData } = await (supabase as any)
      .from('podcast_shows')
      .select('*')
      .order('name')
    setShows(sData ?? [])

    const { data: eData } = await (supabase as any)
      .from('podcast_episodes')
      .select('*, podcast_shows(name)')
      .order('episode_number', { ascending: false })
    const rows = (eData ?? []).map((e: any) => ({
      ...e,
      show_name: e.podcast_shows?.name,
    }))
    setEpisodes(rows)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    setError('')
    if (!form.show_id || !form.title) {
      setError('Show and title are required')
      setSaving(false)
      return
    }
    if (editId) {
      const { error } = await (supabase as any).from('podcast_episodes').update(form).eq('id', editId)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await (supabase as any).from('podcast_episodes').insert([form])
      if (error) { setError(error.message); setSaving(false); return }
    }
    toast(editId ? 'Episode updated' : 'Episode created')
    setForm(EMPTY_EPISODE)
    setShowForm(false)
    setEditId(null)
    setSaving(false)
    load()
  }

  async function deleteEpisode(id: string) {
    if (!confirm('Delete this episode?')) return
    await (supabase as any).from('podcast_episodes').delete().eq('id', id)
    toast('Episode deleted')
    load()
  }

  function editEpisode(ep: PodcastEpisode) {
    setForm(ep)
    setEditId(ep.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function formatDuration(s: number | null) {
    if (!s) return '—'
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const filtered = episodes.filter(ep => {
    const matchSearch = ep.title.toLowerCase().includes(search.toLowerCase()) ||
      (ep.guest_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (ep.show_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchShow = filterShow === 'all' || ep.show_id === filterShow
    const matchStatus = filterStatus === 'all' || ep.status === filterStatus
    return matchSearch && matchShow && matchStatus
  })

  const totalPlays = episodes.reduce((s, ep) => s + ep.play_count, 0)

  const inp = (style = {}) => ({
    width: '100%', padding: '8px 12px',
    background: 'var(--bg-4)', border: '0.5px solid var(--border-3)',
    borderRadius: '8px', color: 'var(--text)', fontSize: '12px',
    outline: 'none', ...style
  } as React.CSSProperties)

  const lbl = { fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' } as React.CSSProperties

  return (
    <div style={{ padding: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Podcasts</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
            {shows.length} shows · {episodes.length} episodes · {totalPlays.toLocaleString()} total plays · Manage podcast shows and episodes
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input placeholder="Search episodes..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp({ width: '180px' }) }} />
          <select value={filterShow} onChange={e => setFilterShow(e.target.value)} style={{ ...inp({ width: '180px' }) }}>
            <option value="all">All shows</option>
            {shows.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp({ width: '120px' }) }}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <button onClick={() => { setForm({ ...EMPTY_EPISODE, show_id: shows[0]?.id ?? '' }); setEditId(null); setShowForm(!showForm) }} style={{
            padding: '8px 16px', background: showForm ? 'var(--border-3)' : '#1D9E75',
            border: 'none', borderRadius: '8px', color: 'var(--text)',
            fontSize: '12px', fontWeight: '500', cursor: 'pointer'
          }}>
            {showForm ? 'Cancel' : '+ New episode'}
          </button>
        </div>
      </div>

      {/* Shows overview */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(shows.length, 3) || 1}, 1fr)`, gap: '8px', marginBottom: '1.25rem' }}>
        {shows.map(s => {
          const showEps = episodes.filter(ep => ep.show_id === s.id)
          const showPlays = showEps.reduce((sum, ep) => sum + ep.play_count, 0)
          const isSelected = selectedShow?.id === s.id
          return (
            <div key={s.id}
              style={{
                background: isSelected ? 'var(--row-selected)' : 'var(--bg-2)', border: '0.5px solid var(--border)',
                borderRadius: '10px', padding: '1rem', cursor: 'pointer', transition: 'background 0.1s'
              }}
              onClick={() => setSelectedShow(isSelected ? null : s)}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--row-hover)' }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? 'var(--row-selected)' : 'var(--bg-2)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: s.is_active ? '#1D9E75' : 'var(--text-3)'
                }} />
                <div style={{ fontWeight: '500', fontSize: '13px' }}>{s.name}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>Episodes</div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#7ab8f5' }}>{showEps.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>Plays</div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#4ecca3' }}>{showPlays.toLocaleString()}</div>
                </div>
              </div>
              {s.description && (
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '6px', lineHeight: '1.4' }}>{s.description}</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Show detail panel */}
      {selectedShow && (
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: '500', fontSize: '14px' }}>{selectedShow.name}</div>
              {selectedShow.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{selectedShow.description}</div>}
            </div>
            <button onClick={() => setSelectedShow(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: '16px', cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px', fontSize: '12px' }}>
            {selectedShow.soundcloud_url && <a href={selectedShow.soundcloud_url} target="_blank" rel="noreferrer" style={{ color: '#ff7043' }}>SoundCloud</a>}
            {selectedShow.spotify_url && <a href={selectedShow.spotify_url} target="_blank" rel="noreferrer" style={{ color: '#4ecca3' }}>Spotify</a>}
            {selectedShow.apple_music_id && <span style={{ color: '#f48fb1' }}>Apple Music</span>}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border-2)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '1rem', color: '#1D9E75' }}>
            {editId ? 'Edit episode' : 'New episode'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Show *</label>
              <select style={inp()} value={form.show_id ?? ''} onChange={e => setForm(f => ({ ...f, show_id: e.target.value }))}>
                <option value="">Select show</option>
                {shows.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Episode number</label>
              <input style={inp()} type="number" value={form.episode_number ?? 1} onChange={e => setForm(f => ({ ...f, episode_number: parseInt(e.target.value) }))} />
            </div>
            <div>
              <label style={lbl}>Title *</label>
              <input style={inp()} value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Episode title" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Guest name</label>
              <input style={inp()} value={form.guest_name ?? ''} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} placeholder="Guest DJ" />
            </div>
            <div>
              <label style={lbl}>Duration (seconds)</label>
              <input style={inp()} type="number" value={form.duration_seconds ?? 0} onChange={e => setForm(f => ({ ...f, duration_seconds: parseInt(e.target.value) }))} />
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select style={inp()} value={form.status ?? 'draft'} onChange={e => setForm(f => ({ ...f, status: e.target.value as PodcastStatus }))}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Schedule at</label>
              <input style={inp()} type="datetime-local" value={form.scheduled_at ? form.scheduled_at.slice(0, 16) : ''} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Description</label>
              <textarea style={{ ...inp({ height: '64px', resize: 'none' }) }} value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Episode description..." />
            </div>
            <div>
              <label style={lbl}>Audio file URL</label>
              <input style={inp()} value={form.file_url ?? ''} onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))} placeholder="https://..." />
            </div>
          </div>

          {error && <div style={{ padding: '8px 12px', background: 'var(--red-bg)', border: '0.5px solid var(--red-border)', borderRadius: '8px', fontSize: '12px', color: '#f08080', marginBottom: '12px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={save} disabled={saving} style={{ padding: '8px 20px', background: saving ? 'var(--green-dim)' : '#1D9E75', border: 'none', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              {saving ? 'Saving...' : editId ? 'Update episode' : 'Create episode'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_EPISODE); setEditId(null) }} style={{ padding: '8px 16px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Episodes table */}
      <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>Loading episodes...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>No episodes yet</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Click "New episode" to add one.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {['#', 'Episode', 'Show', 'Guest', 'Duration', 'Plays', 'Status', 'Scheduled', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ep, i) => {
                const sc = STATUS_COLORS[ep.status]
                return (
                  <tr key={ep.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid var(--row-border)' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-3)', fontFamily: 'monospace' }}>{ep.episode_number}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: '500', color: 'var(--text)', fontSize: '12px' }}>{ep.title}</div>
                      {ep.description && <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.description}</div>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-faint)' }}>{ep.show_name ?? '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: ep.guest_name ? '#b8b4f0' : 'var(--text-5)' }}>{ep.guest_name || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-faint)', fontFamily: 'monospace' }}>{formatDuration(ep.duration_seconds)}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-faint)' }}>{ep.play_count.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: sc.bg, color: sc.color }}>
                        {ep.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-3)' }}>
                      {ep.scheduled_at ? new Date(ep.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => editEpisode(ep)} style={{ padding: '3px 8px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '6px', color: 'var(--text-faint)', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => deleteEpisode(ep.id)} style={{ padding: '3px 8px', background: 'transparent', border: '0.5px solid var(--red-muted-border)', borderRadius: '6px', color: 'var(--red-muted)', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
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
