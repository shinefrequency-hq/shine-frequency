'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
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
  const { toast } = useToast()
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
  const [filterArtist, setFilterArtist] = useState<string>('all')
  const [selected, setSelected] = useState<BookingRow | null>(null)
  const [sortKey, setSortKey] = useState<string>('event_date')
  const [sortAsc, setSortAsc] = useState(true)

  function toggleSort(key: string) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (showForm) {
          setShowForm(false)
          setForm(EMPTY)
          setEditId(null)
        }
        if (selected) setSelected(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showForm, selected])

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
    toast(editId ? 'Booking updated' : 'Booking created')
  }

  async function deleteBooking(id: string) {
    if (!confirm('Delete this booking?')) return
    await (supabase as any).from('bookings').delete().eq('id', id)
    if (selected?.id === id) setSelected(null)
    load()
    toast('Booking deleted')
  }

  function editBooking(b: Booking) {
    setForm(b)
    setEditId(b.id)
    setShowForm(true)
    setSelected(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtered = bookings.filter(b => {
    const matchSearch = b.venue_name.toLowerCase().includes(search.toLowerCase()) ||
      (b.artist_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      b.venue_city.toLowerCase().includes(search.toLowerCase()) ||
      (b.contact_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || b.status === filterStatus
    const matchArtist = filterArtist === 'all' || b.artist_name === filterArtist
    return matchSearch && matchStatus && matchArtist
  }).sort((a, b) => {
    const av = (a as any)[sortKey] ?? ''
    const bv = (b as any)[sortKey] ?? ''
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return sortAsc ? cmp : -cmp
  })

  const totalFees = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').reduce((s, b) => s + (b.fee ?? 0), 0)

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
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Bookings</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{bookings.length} total · {bookings.filter(b => b.status === 'confirmed').length} confirmed · Manage DJ bookings, contracts, travel and fees</div>
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
          <select value={filterArtist} onChange={e => setFilterArtist(e.target.value)} style={{ ...inp({ width: '140px' }) }}>
            <option value="all">All artists</option>
            {[...new Set(bookings.map(b => b.artist_name).filter(Boolean))].sort().map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(!showForm) }} style={{
            padding: '8px 16px', background: showForm ? 'var(--border-3)' : '#1D9E75',
            border: 'none', borderRadius: '8px', color: 'var(--text)',
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
          <div key={s.label} style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '18px', fontWeight: '500', color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: '1rem' }}>

        {/* Form */}
        {showForm && (
          <div style={{ gridColumn: '1 / -1', background: 'var(--bg-2)', border: '0.5px solid var(--border-2)', borderRadius: '12px', padding: '1.25rem', marginBottom: '0' }}>
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
                <input style={inp()} value={form.set_time ?? ''} onChange={e => setForm(f => ({ ...f, set_time: e.target.value }))} placeholder="02:00-04:00" />
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: form.travel_booked ? '#4ecca3' : 'var(--text-muted)' }}>
                <input type="checkbox" checked={form.travel_booked ?? false} onChange={() => setForm(f => ({ ...f, travel_booked: !f.travel_booked }))} style={{ accentColor: '#1D9E75' }} />
                Travel booked
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: form.hotel_booked ? '#4ecca3' : 'var(--text-muted)' }}>
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
              <button onClick={save} disabled={saving} style={{ padding: '8px 20px', background: saving ? 'var(--green-dim)' : '#1D9E75', border: 'none', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                {saving ? 'Saving...' : editId ? 'Update booking' : 'Create booking'}
              </button>
              <button onClick={() => { setShowForm(false); setForm(EMPTY); setEditId(null) }} style={{ padding: '8px 16px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>Loading bookings...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>No bookings yet</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Click "New booking" to add a gig.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                  {[
                    { label: 'Date', key: 'event_date' },
                    { label: 'Artist', key: 'artist_name' },
                    { label: 'Venue', key: 'venue_name' },
                    { label: 'Fee', key: 'fee' },
                    { label: 'Status', key: 'status' },
                    { label: 'Contract', key: 'contract_status' },
                    { label: 'Rider', key: '' },
                    { label: 'Travel', key: '' },
                    { label: 'Actions', key: '' },
                  ].map(h => (
                    <th key={h.label} onClick={() => h.key && toggleSort(h.key)} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', cursor: h.key ? 'pointer' : 'default', userSelect: 'none' }}>
                      {h.label}{sortKey === h.key ? (sortAsc ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => {
                  const sc = STATUS_COLORS[b.status]
                  const cc = CONTRACT_COLORS[b.contract_status]
                  const eventDate = new Date(b.event_date)
                  const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / 86400000)
                  const isSelected = selected?.id === b.id
                  return (
                    <tr key={b.id}
                      style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid var(--row-border)' : 'none', cursor: 'pointer', background: isSelected ? 'var(--row-selected)' : 'transparent', transition: 'background 0.1s' }}
                      onClick={() => setSelected(isSelected ? null : b)}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--row-hover)' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '500' }}>{eventDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                        <div style={{ fontSize: '10px', color: daysUntil <= 7 && daysUntil > 0 ? '#f5c842' : 'var(--text-3)' }}>
                          {daysUntil > 0 ? `${daysUntil}d away` : daysUntil === 0 ? 'Today' : 'Past'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '500', color: 'var(--text)', fontSize: '12px' }}>{b.artist_name ?? '---'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text)' }}>{b.venue_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{b.venue_city}, {b.venue_country}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-faint)', fontFamily: 'monospace' }}>
                        {b.fee ? `${b.currency === 'GBP' ? '\u00A3' : b.currency === 'EUR' ? '\u20AC' : '$'}${b.fee.toLocaleString()}` : '---'}
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
                          <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: 'var(--bg-4)', color: 'var(--text-3)' }}>None</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {b.travel_booked && <span style={{ padding: '1px 6px', borderRadius: '10px', fontSize: '9px', fontWeight: '500', background: '#0a2a1e', color: '#4ecca3' }}>Travel</span>}
                          {b.hotel_booked && <span style={{ padding: '1px 6px', borderRadius: '10px', fontSize: '9px', fontWeight: '500', background: '#0a2a1e', color: '#4ecca3' }}>Hotel</span>}
                          {!b.travel_booked && !b.hotel_booked && <span style={{ color: 'var(--text-5)', fontSize: '12px' }}>---</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '5px' }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => editBooking(b)} style={{ padding: '3px 8px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '6px', color: 'var(--text-faint)', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => deleteBooking(b.id)} style={{ padding: '3px 8px', background: 'transparent', border: '0.5px solid var(--red-muted-border)', borderRadius: '6px', color: 'var(--red-muted)', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
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
        {selected && (() => {
          const sc = STATUS_COLORS[selected.status]
          const cc = CONTRACT_COLORS[selected.contract_status]
          const eventDate = new Date(selected.event_date)
          const currSymbol = selected.currency === 'GBP' ? '\u00A3' : selected.currency === 'EUR' ? '\u20AC' : '$'
          return (
            <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', padding: '1.25rem', alignSelf: 'start' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '16px' }}>{selected.artist_name ?? 'Unknown artist'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{selected.venue_name} · {selected.venue_city}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: '16px', cursor: 'pointer', lineHeight: 1 }}>x</button>
              </div>

              {/* Status badges */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: sc.bg, color: sc.color }}>{selected.status}</span>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: cc.bg, color: cc.color }}>{selected.contract_status.replace('_', ' ')}</span>
              </div>

              {/* Event details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
                {[
                  { label: 'Event date', value: eventDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
                  { label: 'Set time', value: selected.set_time || '---' },
                  { label: 'Set length', value: selected.set_length_minutes ? `${selected.set_length_minutes} min` : '---' },
                  { label: 'Fee', value: selected.fee ? `${currSymbol}${selected.fee.toLocaleString()}` : '---' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-4)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '3px' }}>{s.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Travel / Hotel indicators */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <span style={{ color: selected.travel_booked ? '#4ecca3' : '#f08080', fontSize: '14px' }}>{selected.travel_booked ? '\u2713' : '\u2717'}</span>
                  <span style={{ color: selected.travel_booked ? '#4ecca3' : 'var(--text-muted)' }}>Travel booked</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <span style={{ color: selected.hotel_booked ? '#4ecca3' : '#f08080', fontSize: '14px' }}>{selected.hotel_booked ? '\u2713' : '\u2717'}</span>
                  <span style={{ color: selected.hotel_booked ? '#4ecca3' : 'var(--text-muted)' }}>Hotel booked</span>
                </div>
              </div>

              {/* Contact info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginBottom: '1rem' }}>
                {selected.contact_name && <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: 'var(--text-3)', width: '80px' }}>Contact</span><span>{selected.contact_name}</span></div>}
                {selected.contact_email && <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: 'var(--text-3)', width: '80px' }}>Email</span><span style={{ color: '#7ab8f5' }}>{selected.contact_email}</span></div>}
                {selected.venue_country && <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: 'var(--text-3)', width: '80px' }}>Country</span><span>{selected.venue_country}</span></div>}
                {(selected.deposit_amount ?? 0) > 0 && <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: 'var(--text-3)', width: '80px' }}>Deposit</span><span style={{ fontFamily: 'monospace' }}>{currSymbol}{selected.deposit_amount?.toLocaleString()}</span></div>}
              </div>

              {/* Internal notes */}
              {selected.internal_notes && (
                <div style={{ marginBottom: '1rem', padding: '8px', background: 'var(--bg-4)', borderRadius: '6px', color: 'var(--text-faint)', fontSize: '11px', lineHeight: '1.5' }}>
                  {selected.internal_notes}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button onClick={() => editBooking(selected)} style={{ padding: '8px', background: '#1D9E75', border: 'none', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Edit booking</button>
                {selected.contact_email && (
                  <a href={`mailto:${selected.contact_email}?subject=${encodeURIComponent(`Booking: ${selected.venue_name} — ${eventDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`)}`} style={{ padding: '8px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-faint)', fontSize: '12px', cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>Email venue</a>
                )}
                {(selected as any).invoice_id && (
                  <a href={`/dashboard/invoices/${(selected as any).invoice_id}`} style={{ padding: '8px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-faint)', fontSize: '12px', cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>View invoice</a>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
