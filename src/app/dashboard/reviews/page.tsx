'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Review, ReviewStatus } from '@/types/database'

const STATUS_COLORS: Record<ReviewStatus, { bg: string; color: string }> = {
  pending:  { bg: '#2a1e0a', color: '#f5c842' },
  approved: { bg: '#0a2a1e', color: '#4ecca3' },
  rejected: { bg: '#2a0a0a', color: '#f08080' },
}

type ReviewRow = Review & {
  release_title?: string
  release_catalogue?: string
  contact_name?: string
  contact_type?: string
}

export default function ReviewsPage() {
  const supabase = createClient()
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selected, setSelected] = useState<ReviewRow | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('reviews')
      .select('*, releases(title, catalogue_number), contacts(full_name, type)')
      .order('created_at', { ascending: false })
    const rows: ReviewRow[] = (data ?? []).map((r: any) => ({
      ...r,
      release_title: r.releases?.title,
      release_catalogue: r.releases?.catalogue_number,
      contact_name: r.contacts?.full_name,
      contact_type: r.contacts?.type,
    }))
    setReviews(rows)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function approve(id: string) {
    await (supabase as any).from('reviews').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  async function reject(id: string) {
    await (supabase as any).from('reviews').update({ status: 'rejected', rejected_reason: rejectReason || null }).eq('id', id)
    setShowRejectModal(null)
    setRejectReason('')
    load()
  }

  async function toggleFeatured(id: string, current: boolean) {
    await (supabase as any).from('reviews').update({ is_featured: !current }).eq('id', id)
    load()
  }

  async function deleteReview(id: string) {
    if (!confirm('Delete this review?')) return
    await (supabase as any).from('reviews').delete().eq('id', id)
    if (selected?.id === id) setSelected(null)
    load()
  }

  const filtered = reviews.filter(r => {
    const matchSearch = (r.contact_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.release_title ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.body ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || r.status === filterStatus
    return matchSearch && matchStatus
  })

  const pendingCount = reviews.filter(r => r.status === 'pending').length

  const stars = (rating: number | null) => {
    if (!rating) return '—'
    return Array.from({ length: 5 }, (_, i) => i < rating ? '\u2605' : '\u2606').join('')
  }

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
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Reviews</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
            {reviews.length} total · {pendingCount} pending approval
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input placeholder="Search reviews..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp({ width: '220px' }) }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp({ width: '130px' }) }}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
        {[
          { label: 'Pending', count: reviews.filter(r => r.status === 'pending').length, color: '#f5c842' },
          { label: 'Approved', count: reviews.filter(r => r.status === 'approved').length, color: '#4ecca3' },
          { label: 'Rejected', count: reviews.filter(r => r.status === 'rejected').length, color: '#f08080' },
          { label: 'Featured', count: reviews.filter(r => r.is_featured).length, color: '#b8b4f0' },
          { label: 'Charted', count: reviews.filter(r => r.charted).length, color: '#1D9E75' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '18px', fontWeight: '500', color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: '1rem' }}>
        {/* Table */}
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>Loading reviews...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>No reviews yet</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Reviews from your promo contacts will appear here.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                  {['Contact', 'Release', 'Rating', 'Charted', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const sc = STATUS_COLORS[r.status]
                  const isSelected = selected?.id === r.id
                  return (
                    <tr key={r.id}
                      style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid var(--row-border)' : 'none', cursor: 'pointer', background: isSelected ? 'var(--row-selected)' : 'transparent', transition: 'background 0.1s' }}
                      onClick={() => setSelected(isSelected ? null : r)}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--row-hover)' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: '500', color: 'var(--text)', fontSize: '12px' }}>{r.contact_name ?? '—'}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{r.contact_type ?? ''}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{r.release_title ?? '—'}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-4)', fontFamily: 'monospace' }}>{r.release_catalogue ?? ''}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '13px', color: '#f5c842', letterSpacing: '1px' }}>
                        {stars(r.rating)}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {r.charted ? (
                          <span style={{ padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: 'var(--green-bg)', color: '#4ecca3' }}>
                            {r.chart_name || 'Yes'}
                          </span>
                        ) : <span style={{ color: 'var(--text-5)', fontSize: '12px' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: sc.bg, color: sc.color }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-3)' }}>
                        {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>
                      <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          {r.status === 'pending' && (
                            <>
                              <button onClick={() => approve(r.id)} style={{ padding: '3px 8px', background: 'var(--green-bg)', border: '0.5px solid var(--green-bg)', borderRadius: '6px', color: '#4ecca3', fontSize: '11px', cursor: 'pointer' }}>Approve</button>
                              <button onClick={() => { setShowRejectModal(r.id); setRejectReason('') }} style={{ padding: '3px 8px', background: 'var(--red-bg)', border: '0.5px solid var(--red-border)', borderRadius: '6px', color: '#f08080', fontSize: '11px', cursor: 'pointer' }}>Reject</button>
                            </>
                          )}
                          <button onClick={() => toggleFeatured(r.id, r.is_featured)} style={{ padding: '3px 8px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '6px', color: r.is_featured ? '#b8b4f0' : 'var(--text-3)', fontSize: '11px', cursor: 'pointer' }}>
                            {r.is_featured ? 'Unfeature' : 'Feature'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', padding: '1.25rem', alignSelf: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontWeight: '500', fontSize: '14px' }}>{selected.contact_name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                  {selected.contact_type} · {new Date(selected.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: '16px', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
              <div style={{ background: 'var(--bg-4)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '3px' }}>Rating</div>
                <div style={{ fontSize: '16px', color: '#f5c842', letterSpacing: '1px' }}>{stars(selected.rating)}</div>
              </div>
              <div style={{ background: 'var(--bg-4)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '3px' }}>Status</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: STATUS_COLORS[selected.status].color }}>{selected.status}</div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Release</div>
            <div style={{ padding: '8px', background: 'var(--bg-4)', borderRadius: '6px', marginBottom: '1rem', fontSize: '12px' }}>
              <div style={{ color: 'var(--text)' }}>{selected.release_title}</div>
              <div style={{ color: 'var(--text-4)', fontFamily: 'monospace', fontSize: '11px', marginTop: '2px' }}>{selected.release_catalogue}</div>
            </div>

            {selected.body && (
              <>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Review</div>
                <div style={{ padding: '8px', background: 'var(--bg-4)', borderRadius: '6px', marginBottom: '1rem', fontSize: '12px', color: 'var(--text-faint)', lineHeight: '1.5' }}>
                  {selected.body}
                </div>
              </>
            )}

            {selected.charted && selected.chart_name && (
              <>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Chart</div>
                <div style={{ padding: '8px', background: 'var(--green-bg)', borderRadius: '6px', marginBottom: '1rem', fontSize: '12px', color: '#4ecca3' }}>
                  {selected.chart_name}
                </div>
              </>
            )}

            {selected.rejected_reason && (
              <>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Rejection reason</div>
                <div style={{ padding: '8px', background: 'var(--red-bg)', borderRadius: '6px', marginBottom: '1rem', fontSize: '12px', color: '#f08080' }}>
                  {selected.rejected_reason}
                </div>
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {selected.status === 'pending' && (
                <>
                  <button onClick={() => approve(selected.id)} style={{ padding: '8px', background: '#1D9E75', border: 'none', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Approve review</button>
                  <button onClick={() => { setShowRejectModal(selected.id); setRejectReason('') }} style={{ padding: '8px', background: 'var(--red-bg)', border: '0.5px solid var(--red-border)', borderRadius: '8px', color: '#f08080', fontSize: '12px', cursor: 'pointer' }}>Reject review</button>
                </>
              )}
              <button onClick={() => deleteReview(selected.id)} style={{ padding: '8px', background: 'transparent', border: '0.5px solid var(--red-muted-border)', borderRadius: '8px', color: 'var(--red-muted)', fontSize: '12px', cursor: 'pointer' }}>Delete review</button>
            </div>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
          onClick={() => setShowRejectModal(null)}>
          <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border-3)', borderRadius: '12px', padding: '1.5rem', width: '400px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '1rem' }}>Reject review</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Reason (optional)</div>
            <textarea
              style={{ ...inp({ height: '80px', resize: 'none' }) }}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Why is this review being rejected?"
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => reject(showRejectModal)} style={{ padding: '8px 20px', background: 'var(--red-border)', border: 'none', borderRadius: '8px', color: '#f08080', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Reject</button>
              <button onClick={() => setShowRejectModal(null)} style={{ padding: '8px 16px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
