'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Release, HeatStatus } from '@/types/database'

const HEAT_COLORS: Record<HeatStatus, { bg: string; color: string }> = {
  pending:  { bg: '#1a1a1a', color: '#555' },
  building: { bg: '#0a1a2a', color: '#7ab8f5' },
  warm:     { bg: '#2a1e0a', color: '#f5c842' },
  hot:      { bg: '#2a1000', color: '#ff7043' },
  critical: { bg: '#2a0a0a', color: '#f08080' },
  closed:   { bg: '#1a1a1a', color: '#444' },
}

type HeatRow = Release & {
  download_count?: number
  review_count?: number
  promo_count?: number
}

function countdown(endDate: string | null): { label: string; days: number; color: string } {
  if (!endDate) return { label: 'No window', days: -1, color: '#333' }
  const end = new Date(endDate)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  const days = Math.ceil(diff / 86400000)
  if (days <= 0) return { label: 'Closed', days: 0, color: '#444' }
  if (days <= 3) return { label: `${days}d left`, days, color: '#f08080' }
  if (days <= 7) return { label: `${days}d left`, days, color: '#f5c842' }
  return { label: `${days}d left`, days, color: '#4ecca3' }
}

function progressBar(current: number, max: number, color: string) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0
  return (
    <div style={{ width: '100%', height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.3s' }} />
    </div>
  )
}

export default function HeatPage() {
  const supabase = createClient()
  const [releases, setReleases] = useState<HeatRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterHeat, setFilterHeat] = useState<string>('all')
  const [selected, setSelected] = useState<HeatRow | null>(null)

  async function load() {
    setLoading(true)
    const { data: relData } = await supabase
      .from('releases')
      .select('*')
      .order('created_at', { ascending: false })

    const rows: HeatRow[] = []
    for (const r of (relData ?? []) as Release[]) {
      const { count: dlCount } = await (supabase as any)
        .from('download_events')
        .select('*', { count: 'exact', head: true })
        .eq('release_id', r.id)
      const { count: rvCount } = await (supabase as any)
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('release_id', r.id)
      const { count: plCount } = await (supabase as any)
        .from('promo_lists')
        .select('*', { count: 'exact', head: true })
        .eq('release_id', r.id)
      rows.push({
        ...r,
        download_count: dlCount ?? 0,
        review_count: rvCount ?? 0,
        promo_count: plCount ?? 0,
      })
    }
    setReleases(rows)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateHeat(id: string, heat: HeatStatus) {
    await (supabase as any).from('releases').update({ heat_status: heat }).eq('id', id)
    load()
  }

  const filtered = releases.filter(r =>
    filterHeat === 'all' || r.heat_status === filterHeat
  )

  const activeReleases = releases.filter(r => r.status === 'live' || r.status === 'scheduled')

  const inp = (style = {}) => ({
    width: '100%', padding: '8px 12px',
    background: '#1a1a1a', border: '0.5px solid #333',
    borderRadius: '8px', color: '#fff', fontSize: '12px',
    outline: 'none', ...style
  } as React.CSSProperties)

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Heat tracker</div>
          <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
            {activeReleases.length} active releases · {releases.filter(r => r.heat_status === 'hot' || r.heat_status === 'critical').length} hot
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select value={filterHeat} onChange={e => setFilterHeat(e.target.value)} style={{ ...inp({ width: '140px' }) }}>
            <option value="all">All heat</option>
            <option value="pending">Pending</option>
            <option value="building">Building</option>
            <option value="warm">Warm</option>
            <option value="hot">Hot</option>
            <option value="critical">Critical</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
        {(Object.keys(HEAT_COLORS) as HeatStatus[]).map(h => (
          <div key={h} style={{ background: '#111', border: '0.5px solid #222', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px', textTransform: 'capitalize' }}>{h}</div>
            <div style={{ fontSize: '18px', fontWeight: '500', color: HEAT_COLORS[h].color }}>
              {releases.filter(r => r.heat_status === h).length}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: '1rem' }}>
        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#555', fontSize: '12px', background: '#111', borderRadius: '12px', border: '0.5px solid #222' }}>Loading heat data...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#111', borderRadius: '12px', border: '0.5px solid #222' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>No releases</div>
              <div style={{ fontSize: '12px', color: '#555' }}>Add releases to start tracking heat.</div>
            </div>
          ) : filtered.map(r => {
            const cd = countdown(r.promo_window_end)
            const hc = HEAT_COLORS[r.heat_status]
            const isSelected = selected?.id === r.id
            const promoTotal = r.promo_count ?? 0
            const dlRate = promoTotal > 0 ? Math.round(((r.download_count ?? 0) / promoTotal) * 100) : 0
            const rvRate = promoTotal > 0 ? Math.round(((r.review_count ?? 0) / promoTotal) * 100) : 0
            return (
              <div key={r.id}
                style={{ background: isSelected ? '#161a16' : '#111', border: '0.5px solid #222', borderRadius: '12px', padding: '1rem', cursor: 'pointer', transition: 'background 0.1s' }}
                onClick={() => setSelected(isSelected ? null : r)}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#161616' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#111' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '500', color: '#fff', fontSize: '13px' }}>{r.artist_name}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#444' }}>{r.catalogue_number}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{r.title}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: hc.bg, color: hc.color }}>
                      {r.heat_status}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: cd.color }}>
                      {cd.label}
                    </span>
                  </div>
                </div>

                {/* Promo window bar */}
                {r.promo_window_start && r.promo_window_end && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#555', marginBottom: '4px' }}>
                      <span>{new Date(r.promo_window_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      <span>{new Date(r.promo_window_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    {(() => {
                      const start = new Date(r.promo_window_start!).getTime()
                      const end = new Date(r.promo_window_end!).getTime()
                      const now = Date.now()
                      const pct = Math.min(Math.max(((now - start) / (end - start)) * 100, 0), 100)
                      return progressBar(pct, 100, cd.color)
                    })()}
                  </div>
                )}

                {/* Engagement funnel */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#555', marginBottom: '4px' }}>
                      <span>Promos sent</span>
                      <span>{promoTotal}</span>
                    </div>
                    {progressBar(promoTotal, Math.max(promoTotal, 1), '#7ab8f5')}
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#555', marginBottom: '4px' }}>
                      <span>Downloads</span>
                      <span>{r.download_count ?? 0} ({dlRate}%)</span>
                    </div>
                    {progressBar(r.download_count ?? 0, Math.max(promoTotal, 1), '#f5c842')}
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#555', marginBottom: '4px' }}>
                      <span>Reviews</span>
                      <span>{r.review_count ?? 0} ({rvRate}%)</span>
                    </div>
                    {progressBar(r.review_count ?? 0, Math.max(promoTotal, 1), '#4ecca3')}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background: '#111', border: '0.5px solid #222', borderRadius: '12px', padding: '1.25rem', alignSelf: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontWeight: '500', fontSize: '14px' }}>{selected.artist_name}</div>
                <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{selected.title} · {selected.catalogue_number}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '16px', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
              {[
                { label: 'Promos', value: selected.promo_count ?? 0 },
                { label: 'Downloads', value: selected.download_count ?? 0 },
                { label: 'Reviews', value: selected.review_count ?? 0 },
                { label: 'Tracks', value: selected.total_tracks },
              ].map(s => (
                <div key={s.label} style={{ background: '#1a1a1a', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                  <div style={{ fontSize: '10px', color: '#555', marginBottom: '3px' }}>{s.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Update heat status</div>
            <select
              style={{ ...inp({ marginBottom: '12px' }) }}
              value={selected.heat_status}
              onChange={e => updateHeat(selected.id, e.target.value as HeatStatus)}
            >
              {(Object.keys(HEAT_COLORS) as HeatStatus[]).map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginBottom: '1rem' }}>
              {selected.promo_window_start && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#555', width: '100px' }}>Window start</span>
                  <span>{new Date(selected.promo_window_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
              {selected.promo_window_end && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#555', width: '100px' }}>Window end</span>
                  <span style={{ color: countdown(selected.promo_window_end).color }}>{new Date(selected.promo_window_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
              {selected.genre && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#555', width: '100px' }}>Genre</span>
                  <span>{selected.genre}</span>
                </div>
              )}
              {selected.bpm_range && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#555', width: '100px' }}>BPM</span>
                  <span>{selected.bpm_range}</span>
                </div>
              )}
            </div>

            {selected.dropbox_folder_url && (
              <a href={selected.dropbox_folder_url} target="_blank" rel="noreferrer" style={{ display: 'block', padding: '8px', background: '#0a1e30', border: '0.5px solid #0a3a5a', borderRadius: '8px', color: '#7ab8f5', fontSize: '12px', textAlign: 'center', marginBottom: '6px' }}>
                Open Dropbox folder
              </a>
            )}
            {selected.soundcloud_playlist_url && (
              <a href={selected.soundcloud_playlist_url} target="_blank" rel="noreferrer" style={{ display: 'block', padding: '8px', background: '#1a0a00', border: '0.5px solid #3a1a00', borderRadius: '8px', color: '#ff7043', fontSize: '12px', textAlign: 'center' }}>
                Open SoundCloud
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
