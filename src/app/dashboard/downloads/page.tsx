'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { DownloadEvent } from '@/types/database'

type DownloadRow = DownloadEvent & {
  release_title?: string
  release_catalogue?: string
  track_title?: string
  contact_name?: string
  contact_type?: string
}

export default function DownloadsPage() {
  const supabase = createClient()
  const [downloads, setDownloads] = useState<DownloadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterMethod, setFilterMethod] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('all')

  async function load() {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('download_events')
      .select('*, releases(title, catalogue_number), tracks(title), contacts(full_name, type)')
      .order('downloaded_at', { ascending: false })
      .limit(500)
    const rows: DownloadRow[] = (data ?? []).map((d: any) => ({
      ...d,
      release_title: d.releases?.title,
      release_catalogue: d.releases?.catalogue_number,
      track_title: d.tracks?.title,
      contact_name: d.contacts?.full_name,
      contact_type: d.contacts?.type,
    }))
    setDownloads(rows)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const now = Date.now()
  const timeFiltered = downloads.filter(d => {
    if (timeRange === 'all') return true
    const hrs = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : timeRange === '30d' ? 720 : 0
    return (now - new Date(d.downloaded_at).getTime()) < hrs * 3600000
  })

  const filtered = timeFiltered.filter(d => {
    const matchSearch = (d.contact_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (d.release_title ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (d.track_title ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (d.release_catalogue ?? '').toLowerCase().includes(search.toLowerCase())
    const matchMethod = filterMethod === 'all' || d.delivery_method === filterMethod
    return matchSearch && matchMethod
  })

  const uniqueContacts = new Set(timeFiltered.map(d => d.contact_id)).size
  const uniqueReleases = new Set(timeFiltered.map(d => d.release_id)).size
  const totalSize = timeFiltered.reduce((s, d) => s + (d.file_size_mb ?? 0), 0)
  const methods = [...new Set(downloads.map(d => d.delivery_method))]

  // Downloads per day for the sparkline
  const dailyCounts = new Map<string, number>()
  timeFiltered.forEach(d => {
    const day = new Date(d.downloaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    dailyCounts.set(day, (dailyCounts.get(day) ?? 0) + 1)
  })
  const dailyEntries = [...dailyCounts.entries()].reverse().slice(-14)
  const maxDaily = Math.max(...dailyEntries.map(e => e[1]), 1)

  const inp = (style = {}) => ({
    width: '100%', padding: '8px 12px',
    background: 'var(--bg-4)', border: '0.5px solid var(--border-3)',
    borderRadius: '8px', color: 'var(--text)', fontSize: '12px',
    outline: 'none', ...style
  } as React.CSSProperties)

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Downloads</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
            {timeFiltered.length} downloads{timeRange !== 'all' ? ` (${timeRange})` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp({ width: '200px' }) }} />
          <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} style={{ ...inp({ width: '120px' }) }}>
            <option value="all">All methods</option>
            {methods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)} style={{ ...inp({ width: '110px' }) }}>
            <option value="all">All time</option>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total downloads', count: timeFiltered.length, color: '#7ab8f5' },
          { label: 'Unique contacts', count: uniqueContacts, color: '#b8b4f0' },
          { label: 'Releases accessed', count: uniqueReleases, color: '#4ecca3' },
          { label: 'Data transferred', count: `${totalSize.toFixed(1)} MB`, color: '#f5c842' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '18px', fontWeight: '500', color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* Activity chart */}
      {dailyEntries.length > 1 && (
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '10px' }}>Download activity (last 14 days)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '60px' }}>
            {dailyEntries.map(([day, count]) => (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '100%', maxWidth: '30px',
                  height: `${(count / maxDaily) * 50}px`,
                  background: '#1D9E75', borderRadius: '3px 3px 0 0',
                  minHeight: '2px',
                }} />
                <div style={{ fontSize: '8px', color: 'var(--text-4)', whiteSpace: 'nowrap' }}>{day}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>Loading downloads...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>No downloads yet</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Download events will appear here when contacts access your releases.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {['Contact', 'Release', 'Track', 'Method', 'Size', 'Time'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid var(--row-border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: '500', color: 'var(--text)', fontSize: '12px' }}>{d.contact_name ?? '—'}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{d.contact_type ?? ''}</div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{d.release_title ?? '—'}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'monospace' }}>{d.release_catalogue ?? ''}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-faint)' }}>
                    {d.track_title ?? 'Full release'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '500',
                      background: d.delivery_method === 'dropbox' ? 'var(--blue-bg)' : 'var(--purple-bg)',
                      color: d.delivery_method === 'dropbox' ? '#7ab8f5' : '#b8b4f0',
                    }}>
                      {d.delivery_method}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {d.file_size_mb ? `${d.file_size_mb} MB` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-3)' }}>
                    {new Date(d.downloaded_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
