'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import type { SocialPost, SocialPostStatus, CampaignPlatform } from '@/types/database'

const STATUS_COLORS: Record<SocialPostStatus, { bg: string; color: string }> = {
  draft:     { bg: '#1a1a1a', color: '#666' },
  scheduled: { bg: '#2a1e0a', color: '#f5c842' },
  published: { bg: '#0a2a1e', color: '#4ecca3' },
  failed:    { bg: '#2a0a0a', color: '#f08080' },
}

const PLATFORM_COLORS: Record<CampaignPlatform, { bg: string; color: string }> = {
  instagram:   { bg: '#2a0a1a', color: '#f48fb1' },
  twitter:     { bg: '#0a1a2a', color: '#7ab8f5' },
  tiktok:      { bg: '#1a1a1a', color: '#fff' },
  facebook:    { bg: '#0a1a2a', color: '#7ab8f5' },
  youtube:     { bg: '#2a0a0a', color: '#f08080' },
  soundcloud:  { bg: '#1a0a00', color: '#ff7043' },
  apple_music: { bg: '#2a0a1a', color: '#f48fb1' },
  dropbox:     { bg: '#0a1a2a', color: '#7ab8f5' },
  wetransfer:  { bg: '#0a2a1e', color: '#4ecca3' },
  beatport:    { bg: '#0a2a1e', color: '#4ecca3' },
}

type PostRow = SocialPost & { release_title?: string }

const SOCIAL_PLATFORMS: CampaignPlatform[] = ['instagram', 'twitter', 'tiktok', 'facebook', 'youtube', 'soundcloud']

const EMPTY: Partial<SocialPost> = {
  platform: 'instagram',
  status: 'draft',
  caption: '',
  media_url: '',
  hashtags: [],
}

export default function SocialPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [posts, setPosts] = useState<PostRow[]>([])
  const [releases, setReleases] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<SocialPost>>(EMPTY)
  const [hashtagInput, setHashtagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  async function load() {
    setLoading(true)
    const { data: pData } = await (supabase as any)
      .from('social_posts')
      .select('*, releases(title)')
      .order('created_at', { ascending: false })
    const rows: PostRow[] = (pData ?? []).map((p: any) => ({
      ...p,
      release_title: p.releases?.title,
    }))
    setPosts(rows)

    const { data: rData } = await supabase
      .from('releases')
      .select('id, title')
      .order('created_at', { ascending: false })
    setReleases(rData ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    setError('')
    if (!form.caption) {
      setError('Caption is required')
      setSaving(false)
      return
    }
    const payload = { ...form }
    if (hashtagInput.trim()) {
      payload.hashtags = hashtagInput.split(/[,\s]+/).filter(Boolean).map(h => h.startsWith('#') ? h : `#${h}`)
    }
    if (editId) {
      const { error } = await (supabase as any).from('social_posts').update(payload).eq('id', editId)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await (supabase as any).from('social_posts').insert([payload])
      if (error) { setError(error.message); setSaving(false); return }
    }
    toast(editId ? 'Post updated' : 'Post created')
    setForm(EMPTY)
    setHashtagInput('')
    setShowForm(false)
    setEditId(null)
    setSaving(false)
    load()
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return
    await (supabase as any).from('social_posts').delete().eq('id', id)
    toast('Post deleted')
    load()
  }

  function editPost(p: SocialPost) {
    setForm(p)
    setHashtagInput((p.hashtags ?? []).join(', '))
    setEditId(p.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtered = posts.filter(p => {
    const matchSearch = p.caption.toLowerCase().includes(search.toLowerCase()) ||
      (p.release_title ?? '').toLowerCase().includes(search.toLowerCase())
    const matchPlatform = filterPlatform === 'all' || p.platform === filterPlatform
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    return matchSearch && matchPlatform && matchStatus
  })

  const totalReach = posts.reduce((s, p) => s + (p.reach ?? 0), 0)
  const totalLikes = posts.reduce((s, p) => s + (p.like_count ?? 0), 0)

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
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Social scheduler</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
            {posts.length} posts · {posts.filter(p => p.status === 'scheduled').length} scheduled · Schedule and track social media posts for your releases
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp({ width: '180px' }) }} />
          <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} style={{ ...inp({ width: '120px' }) }}>
            <option value="all">All platforms</option>
            {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp({ width: '120px' }) }}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="failed">Failed</option>
          </select>
          <button onClick={() => { setForm(EMPTY); setHashtagInput(''); setEditId(null); setShowForm(!showForm) }} style={{
            padding: '8px 16px', background: showForm ? 'var(--border-3)' : '#1D9E75',
            border: 'none', borderRadius: '8px', color: 'var(--text)',
            fontSize: '12px', fontWeight: '500', cursor: 'pointer'
          }}>
            {showForm ? 'Cancel' : '+ New post'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
        {[
          { label: 'Scheduled', count: posts.filter(p => p.status === 'scheduled').length, color: '#f5c842' },
          { label: 'Published', count: posts.filter(p => p.status === 'published').length, color: '#4ecca3' },
          { label: 'Total reach', count: totalReach.toLocaleString(), color: '#7ab8f5' },
          { label: 'Total likes', count: totalLikes.toLocaleString(), color: '#f48fb1' },
          { label: 'Failed', count: posts.filter(p => p.status === 'failed').length, color: '#f08080' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '18px', fontWeight: '500', color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border-2)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '1rem', color: '#1D9E75' }}>
            {editId ? 'Edit post' : 'New post'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Platform</label>
              <select style={inp()} value={form.platform ?? 'instagram'} onChange={e => setForm(f => ({ ...f, platform: e.target.value as CampaignPlatform }))}>
                {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Release (optional)</label>
              <select style={inp()} value={form.release_id ?? ''} onChange={e => setForm(f => ({ ...f, release_id: e.target.value || null }))}>
                <option value="">No release</option>
                {releases.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select style={inp()} value={form.status ?? 'draft'} onChange={e => setForm(f => ({ ...f, status: e.target.value as SocialPostStatus }))}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={lbl}>Caption *</label>
            <textarea style={{ ...inp({ height: '80px', resize: 'none' }) }} value={form.caption ?? ''} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} placeholder="Write your caption..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Hashtags (comma-separated)</label>
              <input style={inp()} value={hashtagInput} onChange={e => setHashtagInput(e.target.value)} placeholder="#techno, #dj, #newrelease" />
            </div>
            <div>
              <label style={lbl}>Media URL</label>
              <input style={inp()} value={form.media_url ?? ''} onChange={e => setForm(f => ({ ...f, media_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label style={lbl}>Schedule at</label>
              <input style={inp()} type="datetime-local" value={form.scheduled_at ? form.scheduled_at.slice(0, 16) : ''} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
            </div>
          </div>

          {error && <div style={{ padding: '8px 12px', background: 'var(--red-bg)', border: '0.5px solid var(--red-border)', borderRadius: '8px', fontSize: '12px', color: '#f08080', marginBottom: '12px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={save} disabled={saving} style={{ padding: '8px 20px', background: saving ? 'var(--green-dim)' : '#1D9E75', border: 'none', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              {saving ? 'Saving...' : editId ? 'Update post' : 'Create post'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY); setHashtagInput(''); setEditId(null) }} style={{ padding: '8px 16px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Post cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px', background: 'var(--bg-2)', borderRadius: '12px', border: '0.5px solid var(--border)', gridColumn: '1 / -1' }}>Loading posts...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-2)', borderRadius: '12px', border: '0.5px solid var(--border)', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>No posts yet</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Create a social post to get started.</div>
          </div>
        ) : filtered.map(p => {
          const sc = STATUS_COLORS[p.status]
          const pc = PLATFORM_COLORS[p.platform]
          return (
            <div key={p.id} style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', padding: '1rem', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-2)')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: pc.bg, color: pc.color }}>
                    {p.platform}
                  </span>
                  <span style={{ padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: sc.bg, color: sc.color }}>
                    {p.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => editPost(p)} style={{ padding: '2px 6px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '4px', color: 'var(--text-faint)', fontSize: '10px', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => deletePost(p.id)} style={{ padding: '2px 6px', background: 'transparent', border: '0.5px solid var(--red-muted-border)', borderRadius: '4px', color: 'var(--red-muted)', fontSize: '10px', cursor: 'pointer' }}>Del</button>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: '1.5', marginBottom: '8px', maxHeight: '60px', overflow: 'hidden' }}>
                {p.caption}
              </div>

              {p.hashtags && p.hashtags.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {p.hashtags.map((h, i) => (
                    <span key={i} style={{ fontSize: '10px', color: '#7ab8f5' }}>{h}</span>
                  ))}
                </div>
              )}

              {p.release_title && (
                <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '6px' }}>
                  Release: {p.release_title}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-3)', borderTop: '0.5px solid var(--row-border)', paddingTop: '8px' }}>
                <span>{p.scheduled_at ? new Date(p.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Not scheduled'}</span>
                {p.status === 'published' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {p.like_count != null && <span>{p.like_count} likes</span>}
                    {p.reach != null && <span>{p.reach} reach</span>}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
