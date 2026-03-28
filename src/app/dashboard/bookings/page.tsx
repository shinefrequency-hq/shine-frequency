'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Booking, BookingStatus, ContractStatus } from '@/types/database'

const STATUS_COLORS: Record<BookingStatus, { bg: string; color: string }> = {
  enquiry:   { bg: '#1a1a2a', color: '#b8b4f0' },
  pending:   { bg: '#2a1e0a', color: '#f5c842' },
  confirmed: { bg: '#0a2a1e', color: '#4ecca3' },
  cancelled: { bg: '#2a0a0a', color: '#f08080' },
  completed: { bg: '#1a1a1a', color: '#777' },
}

const CONTRACT_COLORS: Record<ContractStatus, { bg: string; color: string }> = {
  not_sent:  { bg: '#1a1a1a', color: '#555' },
  sent:      { bg: '#2a1e0a', color: '#f5c842' },
  signed:    { bg: '#0a2a1e', color: '#4ecca3' },
  cancelled: { bg: '#2a0a0a', color: '#f08080' },
}

type BookingRow = Booking & { artist_name?: string }

const EMPTY: Partial<Booking> = {
  artist_id: '',
  venue_name: '',
  venue_city: '',
  venue_country: 'UK',
  event_date: '',
  set_time: '',
  set_length_minutes: 60,
  fee: 0,
  currency: 'GBP',
  deposit_amount: 0,
  status: 'enquiry',
  contract_status: 'not_sent',
  travel_booked: false,
  hotel_booked: false,
  internal_notes: '',
  contact_name: '',
  contact_email: '',
}

export default function BookingsPage() {
  const supabase = createClient()
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [artists, setArtists] = useState<{ id: string; stage_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<Booking>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  async function load() {
    setLoading(true)
    const { data: bData } = await (supabase as any)
      .from('bookings')
      .select('*, artists(stage_name)')
      .order('event_date', { ascending: true })
    const rows: BookingRow[] = (bData ?? []).map((b: any) => ({
      ...b,
      artist_name: b.artists?.stage_name,
    }))
    setBookings(rows)

    const { data: aData } = await (supabase as any)
      .from('artists')
      .select('id, stage_name')
      .eq('is_active', true)
      .order('stage_name')
    setArtists(aData ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    setError('')
    if (!form.artist_id || !form.venue_name || !form.event_date) {
      setError('Artist, venue and event date are required')
      setSaving(false)
      return
    }
    if (editId) {
      const { error } = await (supabase as any).from('bookings').update(form).eq('id', editId)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await (supabase as any).from('bookings').insert([form])
      if (error) { setError(error.message); setSaving(false); return }
    }
    setForm(EMPTY)
    setShowForm(false)
    setEditId(null)
    setSaving(false)
    load()
  }

  async function deleteBooking(id: string) {
    if (!confirm('Delete this booking?')) return
    await (supabase as any).from('bookings').delete().eq('id', id)
    load()
  }

  function editBooking(b: Booking) {
    setForm(b)
    setEditId(b.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtered = bookings.filter(b => {
    const matchSearch = b.venue_name.toLowerCase().includes(search.toLowerCase()) ||
      (b.artist_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      b.venue_city.toLowerCase().includes(search.toLowerCase()) ||
      (b.contact_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || b.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalFees = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').reduce((s, b) => s + (b.fee ?? 0), 0)

  const inp = (style = {}) => ({
    width: '100%', padding: '8px 12px',
    background: '#1a1a1a', border: '0.5px solid #333',
    borderRadius: '8px', color: '#fff', fontSize: '12px',
    outline: 'none', ...style
  } as React.CSSProperties)

  const lbl = { fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' } as React.CSSProperties

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Bookings</div>
          <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{bookings.length} total · {bookings.filter(b => b.status === 'confirmed').length} confirmed</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input placeholder="Search bookings..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp({ width: '200px' }) }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp({ width: '130px' }) }}>
            <option value="all">All statuses</option>
            <option value="enquiry">Enquiry</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(!showForm) }} style={{
            padding: '8px 16px', background: showForm ? '#333' : '#1D9E75',
            border: 'none', borderRadius: '8px', color: '#fff',
            fontSize: '12px', fontWeight: '500', cursor: 'pointer'
          }}>
            {showForm ? 'Cancel' : '+ New booking'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
        {[
          { label: 'Enquiries', count: bookings.filter(b => b.status === 'enquiry').length, color: '#b8b4f0' },
          { label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length, color: '#4ecca3' },
          { label: 'Unsigned contracts', count: bookings.filter(b => b.contract_status !== 'signed' && b.status === 'confirmed').length, color: '#f5c842' },
          { label: 'Travel unbooked', count: bookings.filter(b => !b.travel_booked && b.status === 'confirmed').length, color: '#ff7043' },
          { label: 'Total fees', count: `\u00A3${totalFees.toLocaleString()}`, color: '#1D9E75' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111', border: '0.5px solid #222', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '18px', fontWeight: '500', color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#111', border: '0.5px solid #2a2a2a', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '1rem', color: '#1D9E75' }}>
            {editId ? 'Edit booking' : 'New booking'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Artist *</label>
              <select style={inp()} value={form.artist_id ?? ''} onChange={e => setForm(f => ({ ...f, artist_id: e.target.value }))}>
                <option value="">Select artist</option>
                {artists.map(a => <option key={a.id} value={a.id}>{a.stage_name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Venue name *</label>
              <input style={inp()} value={form.venue_name ?? ''} onChange={e => setForm(f => ({ ...f, venue_name: e.target.value }))} placeholder="Berghain" />
            </div>
            <div>
              <label style={lbl}>Event date *</label>
              <input style={inp()} type="date" value={form.event_date ?? ''} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>City</label>
              <input style={inp()} value={form.venue_city ?? ''} onChange={e => setForm(f => ({ ...f, venue_city: e.target.value }))} placeholder="Berlin" />
            </div>
            <div>
              <label style={lbl}>Country</label>
              <input style={inp()} value={form.venue_country ?? ''} onChange={e => setForm(f => ({ ...f, venue_country: e.target.value }))} placeholder="DE" />
            </div>
            <div>
              <label style={lbl}>Set time</label>
              <input style={inp()} value={form.set_time ?? ''} onChange={e => setForm(f => ({ ...f, set_time: e.target.value }))} placeholder="02:00–04:00" />
            </div>
            <div>
              <label style={lbl}>Set length (min)</label>
              <input style={inp()} type="number" value={form.set_length_minutes ?? 60} onChange={e => setForm(f => ({ ...f, set_length_minutes: parseInt(e.target.value) }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Fee</label>
              <input style={inp()} type="number" value={form.fee ?? 0} onChange={e => setForm(f => ({ ...f, fee: parseFloat(e.target.value) }))} />
            </div>
            <div>
              <label style={lbl}>Currency</label>
              <select style={inp()} value={form.currency ?? 'GBP'} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                <option value="GBP">GBP</option><option value="EUR">EUR</option><option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select style={inp()} value={form.status ?? 'enquiry'} onChange={e => setForm(f => ({ ...f, status: e.target.value as BookingStatus }))}>
                <option value="enquiry">Enquiry</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Contract status</label>
              <select style={inp()} value={form.contract_status ?? 'not_sent'} onChange={e => setForm(f => ({ ...f, contract_status: e.target.value as ContractStatus }))}>
                <option value="not_sent">Not sent</option>
                <option value="sent">Sent</option>
                <option value="signed">Signed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Contact name</label>
              <input style={inp()} value={form.contact_name ?? ''} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Promoter name" />
            </div>
            <div>
              <label style={lbl}>Contact email</label>
              <input style={inp()} value={form.contact_email ?? ''} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="email@venue.com" />
            </div>
            <div>
              <label style={lbl}>Deposit amount</label>
              <input style={inp()} type="number" value={form.deposit_amount ?? 0} onChange={e => setForm(f => ({ ...f, deposit_amount: parseFloat(e.target.value) }))} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: form.travel_booked ? '#4ecca3' : '#666' }}>
              <input type="checkbox" checked={form.travel_booked ?? false} onChange={() => setForm(f => ({ ...f, travel_booked: !f.travel_booked }))} style={{ accentColor: '#1D9E75' }} />
              Travel booked
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: form.hotel_booked ? '#4ecca3' : '#666' }}>
              <input type="checkbox" checked={form.hotel_booked ?? false} onChange={() => setForm(f => ({ ...f, hotel_booked: !f.hotel_booked }))} style={{ accentColor: '#1D9E75' }} />
              Hotel booked
            </label>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={lbl}>Internal notes</label>
            <textarea style={{ ...inp({ height: '64px', resize: 'none' }) }} value={form.internal_notes ?? ''} onChange={e => setForm(f => ({ ...f, internal_notes: e.target.value }))} placeholder="Private notes..." />
          </div>

          {error && <div style={{ padding: '8px 12px', background: '#2a0a0a', border: '0.5px solid #5a1a1a', borderRadius: '8px', fontSize: '12px', color: '#f08080', marginBottom: '12px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={save} disabled={saving} style={{ padding: '8px 20px', background: saving ? '#0a4a30' : '#1D9E75', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              {saving ? 'Saving...' : editId ? 'Update booking' : 'Create booking'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY); setEditId(null) }} style={{ padding: '8px 16px', background: 'transparent', border: '0.5px solid #333', borderRadius: '8px', color: '#666', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#111', border: '0.5px solid #222', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#555', fontSize: '12px' }}>Loading bookings...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>No bookings yet</div>
            <div style={{ fontSize: '12px', color: '#555' }}>Click "New booking" to add a gig.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #222' }}>
                {['Date', 'Artist', 'Venue', 'Fee', 'Status', 'Contract', 'Rider', 'Travel', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#555' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const sc = STATUS_COLORS[b.status]
                const cc = CONTRACT_COLORS[b.contract_status]
                const eventDate = new Date(b.event_date)
                const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / 86400000)
                return (
                  <tr key={b.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid #1a1a1a' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#161616')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '500' }}>{eventDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                      <div style={{ fontSize: '10px', color: daysUntil <= 7 && daysUntil > 0 ? '#f5c842' : '#555' }}>
                        {daysUntil > 0 ? `${daysUntil}d away` : daysUntil === 0 ? 'Today' : 'Past'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '500', color: '#fff', fontSize: '12px' }}>{b.artist_name ?? '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '12px', color: '#fff' }}>{b.venue_name}</div>
                      <div style={{ fontSize: '11px', color: '#555' }}>{b.venue_city}, {b.venue_country}</div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>
                      {b.fee ? `${b.currency === 'GBP' ? '\u00A3' : b.currency === 'EUR' ? '\u20AC' : '$'}${b.fee.toLocaleString()}` : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: sc.bg, color: sc.color }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: cc.bg, color: cc.color }}>
                        {b.contract_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {b.rider_url ? (
                        <a href={b.rider_url} target="_blank" rel="noreferrer" style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: '#0a2a1e', color: '#4ecca3' }}>Received</a>
                      ) : (
                        <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: '#1a1a1a', color: '#555' }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {b.travel_booked && <span style={{ padding: '1px 6px', borderRadius: '10px', fontSize: '9px', fontWeight: '500', background: '#0a2a1e', color: '#4ecca3' }}>Travel</span>}
                        {b.hotel_booked && <span style={{ padding: '1px 6px', borderRadius: '10px', fontSize: '9px', fontWeight: '500', background: '#0a2a1e', color: '#4ecca3' }}>Hotel</span>}
                        {!b.travel_booked && !b.hotel_booked && <span style={{ color: '#333', fontSize: '12px' }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => editBooking(b)} style={{ padding: '3px 8px', background: 'transparent', border: '0.5px solid #333', borderRadius: '6px', color: '#888', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => deleteBooking(b.id)} style={{ padding: '3px 8px', background: 'transparent', border: '0.5px solid #2a1a1a', borderRadius: '6px', color: '#5a2a2a', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
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
