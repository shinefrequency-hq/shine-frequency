'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Campaign, CampaignStatus, CampaignPlatform } from '@/types/database'

const STATUS_COLORS: Record<CampaignStatus, { bg: string; color: string }> = {
  draft:     { bg: '#1a1a1a', color: '#666' },
  scheduled: { bg: '#2a1e0a', color: '#f5c842' },
  sent:      { bg: '#0a2a1e', color: '#4ecca3' },
  failed:    { bg: '#2a0a0a', color: '#f08080' },
}

const PLATFORM_COLORS: Record<CampaignPlatform, { bg: string; color: string }> = {
  soundcloud:  { bg: '#1a0a00', color: '#ff7043' },
  apple_music: { bg: '#2a0a1a', color: '#f48fb1' },
  dropbox:     { bg: '#0a1a2a', color: '#7ab8f5' },
  wetransfer:  { bg: '#0a2a1e', color: '#4ecca3' },
  beatport:    { bg: '#0a2a1e', color: '#4ecca3' },
  instagram:   { bg: '#2a0a1a', color: '#f48fb1' },
  twitter:     { bg: '#0a1a2a', color: '#7ab8f5' },
  tiktok:      { bg: '#1a1a1a', color: '#fff' },
  facebook:    { bg: '#0a1a2a', color: '#7ab8f5' },
  youtube:     { bg: '#2a0a0a', color: '#f08080' },
}

type CampaignRow = Campaign & {
  release_title?: string
  release_catalogue?: string
}

const EMPTY: Partial<Campaign> = {
  release_id: '',
  name: '',
  platform: 'dropbox',
  status: 'draft',
  recipient_count: 0,
}

export default function CampaignsPage() {
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [releases, setReleases] = useState<{ id: string; title: string; catalogue_number: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<Campaign>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  async function load() {
    setLoading(true)
    const { data: cData } = await (supabase as any)
      .from('campaigns')
      .select('*, releases(title, catalogue_number)')
      .order('created_at', { ascending: false })
    const rows: CampaignRow[] = (cData ?? []).map((c: any) => ({
      ...c,
      release_title: c.releases?.title,
      release_catalogue: c.releases?.catalogue_number,
    }))
    setCampaigns(rows)

    const { data: rData } = await supabase
      .from('releases')
      .select('id, title, catalogue_number')
      .order('created_at', { ascending: false })
    setReleases(rData ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    setError('')
    if (!form.release_id || !form.name) {
      setError('Release and campaign name are required')
      setSaving(false)
      return
    }
    if (editId) {
      const { error } = await (supabase as any).from('campaigns').update(form).eq('id', editId)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await (supabase as any).from('campaigns').insert([form])
      if (error) { setError(error.message); setSaving(false); return }
    }
    setForm(EMPTY)
    setShowForm(false)
    setEditId(null)
    setSaving(false)
    load()
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Delete this campaign?')) return
    await (supabase as any).from('campaigns').delete().eq('id', id)
    load()
  }

  function editCampaign(c: Campaign) {
    setForm(c)
    setEditId(c.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtered = campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.release_title ?? '').toLowerCase().includes(search.toLowerCase()) ||
      c.platform.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalRecipients = campaigns.filter(c => c.status === 'sent').reduce((s, c) => s + (c.recipient_count ?? 0), 0)
  const totalOpens = campaigns.filter(c => c.status === 'sent').reduce((s, c) => s + (c.open_count ?? 0), 0)
  const totalClicks = campaigns.filter(c => c.status === 'sent').reduce((s, c) => s + (c.click_count ?? 0), 0)

  const inp = (style = {}) => ({
    width: '100%', padding: '8px 12px',
    background: 'var(--bg-4)', border: '0.5px solid var(--border-3)',
    borderRadius: '8px', color: 'var(--text)', fontSize: '12px',
    outline: 'none', ...style
  } as React.CSSProperties)

  const lbl = { fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' } as React.CSSProperties

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Campaigns</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{campaigns.length} total · {campaigns.filter(c => c.status === 'sent').length} sent</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp({ width: '200px' }) }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp({ width: '130px' }) }}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
          <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(!showForm) }} style={{
            padding: '8px 16px', background: showForm ? 'var(--border-3)' : '#1D9E75',
            border: 'none', borderRadius: '8px', color: 'var(--text)',
            fontSize: '12px', fontWeight: '500', cursor: 'pointer'
          }}>
            {showForm ? 'Cancel' : '+ New campaign'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
        {[
          { label: 'Draft', count: campaigns.filter(c => c.status === 'draft').length, color: '#666' },
          { label: 'Scheduled', count: campaigns.filter(c => c.status === 'scheduled').length, color: '#f5c842' },
          { label: 'Sent', count: campaigns.filter(c => c.status === 'sent').length, color: '#4ecca3' },
          { label: 'Total recipients', count: totalRecipients, color: '#7ab8f5' },
          { label: 'Open rate', count: totalRecipients > 0 ? `${Math.round((totalOpens / totalRecipients) * 100)}%` : '—', color: '#b8b4f0' },
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
            {editId ? 'Edit campaign' : 'New campaign'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Campaign name *</label>
              <input style={inp()} value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Promo blast — SF-042" />
            </div>
            <div>
              <label style={lbl}>Release *</label>
              <select style={inp()} value={form.release_id ?? ''} onChange={e => setForm(f => ({ ...f, release_id: e.target.value }))}>
                <option value="">Select release</option>
                {releases.map(r => <option key={r.id} value={r.id}>{r.catalogue_number} — {r.title}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Platform</label>
              <select style={inp()} value={form.platform ?? 'dropbox'} onChange={e => setForm(f => ({ ...f, platform: e.target.value as CampaignPlatform }))}>
                {(['dropbox', 'soundcloud', 'wetransfer', 'apple_music', 'beatport', 'instagram', 'twitter', 'facebook', 'youtube', 'tiktok'] as CampaignPlatform[]).map(p => (
                  <option key={p} value={p}>{p.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Status</label>
              <select style={inp()} value={form.status ?? 'draft'} onChange={e => setForm(f => ({ ...f, status: e.target.value as CampaignStatus }))}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Scheduled at</label>
              <input style={inp()} type="datetime-local" value={form.scheduled_at ? form.scheduled_at.slice(0, 16) : ''} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
            </div>
            <div>
              <label style={lbl}>Recipient count</label>
              <input style={inp()} type="number" value={form.recipient_count ?? 0} onChange={e => setForm(f => ({ ...f, recipient_count: parseInt(e.target.value) }))} />
            </div>
          </div>

          {error && <div style={{ padding: '8px 12px', background: 'var(--red-bg)', border: '0.5px solid var(--red-border)', borderRadius: '8px', fontSize: '12px', color: '#f08080', marginBottom: '12px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={save} disabled={saving} style={{ padding: '8px 20px', background: saving ? 'var(--green-dim)' : '#1D9E75', border: 'none', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              {saving ? 'Saving...' : editId ? 'Update campaign' : 'Create campaign'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY); setEditId(null) }} style={{ padding: '8px 16px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>Loading campaigns...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>No campaigns yet</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Create a campaign to start promoting your releases.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {['Campaign', 'Release', 'Platform', 'Recipients', 'Opens', 'Clicks', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const sc = STATUS_COLORS[c.status]
                const pc = PLATFORM_COLORS[c.platform]
                const openRate = (c.recipient_count ?? 0) > 0 ? Math.round(((c.open_count ?? 0) / c.recipient_count!) * 100) : 0
                return (
                  <tr key={c.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid var(--row-border)' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: '500', color: 'var(--text)', fontSize: '12px' }}>{c.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                        {c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{c.release_title ?? '—'}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'monospace' }}>{c.release_catalogue ?? ''}</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: pc.bg, color: pc.color }}>
                        {c.platform.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-faint)' }}>{c.recipient_count ?? 0}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-faint)' }}>{c.open_count ?? 0}</span>
                      {c.status === 'sent' && <span style={{ color: 'var(--text-3)', fontSize: '10px' }}> ({openRate}%)</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-faint)' }}>{c.click_count ?? 0}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: sc.bg, color: sc.color }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => editCampaign(c)} style={{ padding: '3px 8px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '6px', color: 'var(--text-faint)', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => deleteCampaign(c.id)} style={{ padding: '3px 8px', background: 'transparent', border: '0.5px solid var(--red-muted-border)', borderRadius: '6px', color: 'var(--red-muted)', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
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
