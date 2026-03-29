'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface PortalData {
  contact: any
  artist: any
  releases: any[]
  bookings: any[]
  invoices: any[]
  promoAccess: any[]
  reviews: any[]
}

export default function PortalDashboard() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PortalData | null>(null)
  const [tab, setTab] = useState<'overview' | 'releases' | 'bookings' | 'invoices' | 'promos' | 'reviews'>('overview')

  useEffect(() => {
    const contactId = sessionStorage.getItem('portal_contact_id')
    if (!contactId) {
      window.location.href = '/portal'
      return
    }
    loadData(contactId)
  }, [])

  async function loadData(contactId: string) {
    const [contact, artist, releases, bookings, invoices, promoAccess, reviews] = await Promise.all([
      (supabase as any).from('contacts').select('*').eq('id', contactId).single(),
      (supabase as any).from('artists').select('*').eq('contact_id', contactId).single(),
      (supabase as any).from('releases').select('*').eq('artist_name', sessionStorage.getItem('portal_name')).order('created_at', { ascending: false }),
      (supabase as any).from('bookings').select('*, artists(stage_name)').eq('contact_email', sessionStorage.getItem('portal_email')).order('event_date', { ascending: false }),
      (supabase as any).from('invoices').select('*').eq('recipient_email', sessionStorage.getItem('portal_email')).order('created_at', { ascending: false }),
      (supabase as any).from('promo_lists').select('*, releases(catalogue_number, title, artist_name, artwork_url, genre, dropbox_folder_url)').eq('contact_id', contactId).order('invited_at', { ascending: false }),
      (supabase as any).from('reviews').select('*, releases(catalogue_number, title, artist_name)').eq('contact_id', contactId).order('created_at', { ascending: false }),
    ])

    // Also try to find bookings by artist
    let allBookings = bookings.data ?? []
    if (artist.data) {
      const { data: artistBookings } = await (supabase as any)
        .from('bookings')
        .select('*, artists(stage_name)')
        .eq('artist_id', artist.data.id)
        .order('event_date', { ascending: false })
      allBookings = [...allBookings, ...(artistBookings ?? [])].filter((b, i, arr) => arr.findIndex(x => x.id === b.id) === i)
    }

    // Also find invoices linked to their bookings
    let allInvoices = invoices.data ?? []
    if (allBookings.length > 0) {
      const bookingIds = allBookings.map((b: any) => b.id)
      const { data: bookingInvoices } = await (supabase as any)
        .from('invoices')
        .select('*')
        .in('booking_id', bookingIds)
      allInvoices = [...allInvoices, ...(bookingInvoices ?? [])].filter((inv, i, arr) => arr.findIndex(x => x.id === inv.id) === i)
    }

    setData({
      contact: contact.data,
      artist: artist.data,
      releases: releases.data ?? [],
      bookings: allBookings,
      invoices: allInvoices,
      promoAccess: promoAccess.data ?? [],
      reviews: reviews.data ?? [],
    })
    setLoading(false)
  }

  function logout() {
    sessionStorage.clear()
    window.location.href = '/portal'
  }

  const cs = (c: string) => c === 'GBP' ? '£' : c === 'EUR' ? '€' : '$'

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#555', fontFamily: 'system-ui' }}>
        Loading your portal...
      </div>
    )
  }

  if (!data) return null

  const name = data.contact?.full_name || sessionStorage.getItem('portal_name') || 'Artist'
  const isArtist = !!data.artist
  const totalRevenue = data.invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + (i.total || 0), 0)

  const tabStyle = (t: string) => ({
    padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' as const,
    background: tab === t ? '#1D9E75' : 'transparent',
    border: tab === t ? 'none' : '0.5px solid #333',
    color: tab === t ? '#fff' : '#888',
    cursor: 'pointer' as const,
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'system-ui, sans-serif', color: '#fff' }}>
      {/* Header */}
      <div style={{ background: '#111', borderBottom: '0.5px solid #222', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Shine" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>Shine Frequency</div>
            <div style={{ fontSize: '11px', color: '#555' }}>Client Portal</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#888' }}>{name}</span>
          <button onClick={logout} style={{ padding: '5px 12px', background: 'transparent', border: '0.5px solid #333', borderRadius: '6px', color: '#666', fontSize: '11px', cursor: 'pointer' }}>Sign out</button>
        </div>
      </div>

      <div style={{ padding: '1.5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Welcome */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '22px', fontWeight: '500' }}>Welcome, {name.split(' ')[0]}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {isArtist ? 'Your releases, bookings and stats with Shine Frequency' : 'Your promo access and activity with Shine Frequency'}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setTab('overview')} style={tabStyle('overview')}>Overview</button>
          {isArtist && <button onClick={() => setTab('releases')} style={tabStyle('releases')}>Releases ({data.releases.length})</button>}
          {data.bookings.length > 0 && <button onClick={() => setTab('bookings')} style={tabStyle('bookings')}>Bookings ({data.bookings.length})</button>}
          {data.invoices.length > 0 && <button onClick={() => setTab('invoices')} style={tabStyle('invoices')}>Invoices ({data.invoices.length})</button>}
          {data.promoAccess.length > 0 && <button onClick={() => setTab('promos')} style={tabStyle('promos')}>Promo Access ({data.promoAccess.length})</button>}
          {data.reviews.length > 0 && <button onClick={() => setTab('reviews')} style={tabStyle('reviews')}>My Reviews ({data.reviews.length})</button>}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '1.5rem' }}>
              {[
                { label: 'Releases', value: data.releases.length, color: '#4ecca3' },
                { label: 'Bookings', value: data.bookings.length, color: '#7ab8f5' },
                { label: 'Promo access', value: data.promoAccess.length, color: '#f5c842' },
                { label: 'Paid revenue', value: `${cs('GBP')}${totalRevenue.toLocaleString()}`, color: '#1D9E75' },
              ].map(s => (
                <div key={s.label} style={{ background: '#111', border: '0.5px solid #222', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px' }}>{s.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: '500', color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Recent releases */}
            {data.releases.length > 0 && (
              <div style={{ background: '#111', border: '0.5px solid #222', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#4ecca3', marginBottom: '10px' }}>Your releases</div>
                {data.releases.slice(0, 5).map((r: any) => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '0.5px solid #1a1a1a' }}>
                    {r.artwork_url && <img src={r.artwork_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px' }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '500' }}>{r.title}</div>
                      <div style={{ fontSize: '11px', color: '#555' }}>{r.catalogue_number} · {r.format}</div>
                    </div>
                    <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: r.status === 'live' ? '#0a2a1e' : '#1a1a1a', color: r.status === 'live' ? '#4ecca3' : '#666' }}>{r.status}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming bookings */}
            {data.bookings.filter((b: any) => new Date(b.event_date) >= new Date()).length > 0 && (
              <div style={{ background: '#111', border: '0.5px solid #222', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#7ab8f5', marginBottom: '10px' }}>Upcoming bookings</div>
                {data.bookings.filter((b: any) => new Date(b.event_date) >= new Date()).slice(0, 5).map((b: any) => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #1a1a1a' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '500' }}>{b.venue_name}</div>
                      <div style={{ fontSize: '11px', color: '#555' }}>{b.venue_city} · {b.set_time || '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px' }}>{new Date(b.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div style={{ fontSize: '11px', color: '#1D9E75' }}>{cs(b.currency)}{b.fee?.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Promo access */}
            {data.promoAccess.length > 0 && (
              <div style={{ background: '#111', border: '0.5px solid #222', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#f5c842', marginBottom: '10px' }}>Promo access</div>
                {data.promoAccess.slice(0, 5).map((p: any) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #1a1a1a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {p.releases?.artwork_url && <img src={p.releases.artwork_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px' }} />}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '500' }}>{p.releases?.artist_name} — {p.releases?.title}</div>
                        <div style={{ fontSize: '10px', color: '#555' }}>{p.releases?.catalogue_number} · {p.releases?.genre}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {p.downloaded_at ? (
                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '9px', background: '#0a2a1e', color: '#4ecca3' }}>Downloaded</span>
                      ) : p.releases?.dropbox_folder_url ? (
                        <a href={p.releases.dropbox_folder_url} target="_blank" rel="noreferrer" style={{ padding: '5px 12px', background: '#1D9E75', borderRadius: '6px', color: '#fff', fontSize: '11px', textDecoration: 'none', fontWeight: '500' }}>Download</a>
                      ) : (
                        <span style={{ fontSize: '10px', color: '#555' }}>Coming soon</span>
                      )}
                      <a href={`/review?release=${p.releases?.catalogue_number}&contact=${sessionStorage.getItem('portal_email')}`} style={{ padding: '5px 12px', background: 'transparent', border: '0.5px solid #333', borderRadius: '6px', color: '#888', fontSize: '11px', textDecoration: 'none' }}>Leave review</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Releases tab */}
        {tab === 'releases' && (
          <div style={{ background: '#111', border: '0.5px solid #222', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #222' }}>
                  {['', 'Cat #', 'Title', 'Format', 'Status', 'Release date', 'Heat'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.releases.map((r: any) => (
                  <tr key={r.id} style={{ borderBottom: '0.5px solid #1a1a1a' }}>
                    <td style={{ padding: '10px 14px' }}>
                      {r.artwork_url ? <img src={r.artwork_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px' }} /> : <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: '#1a1a1a' }} />}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#888' }}>{r.catalogue_number}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '500', fontSize: '12px' }}>{r.title}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#888' }}>{r.format}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: r.status === 'live' ? '#0a2a1e' : '#1a1a1a', color: r.status === 'live' ? '#4ecca3' : '#666' }}>{r.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '11px', color: '#888' }}>
                      {r.release_date ? new Date(r.release_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: '#1a1a1a', color: '#888' }}>{r.heat_status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bookings tab */}
        {tab === 'bookings' && (
          <div style={{ background: '#111', border: '0.5px solid #222', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #222' }}>
                  {['Venue', 'City', 'Date', 'Set time', 'Fee', 'Status', 'Contract'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.bookings.map((b: any) => (
                  <tr key={b.id} style={{ borderBottom: '0.5px solid #1a1a1a' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '500', fontSize: '12px' }}>{b.venue_name}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#888' }}>{b.venue_city}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px' }}>{new Date(b.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#888' }}>{b.set_time || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', fontFamily: 'monospace' }}>{cs(b.currency)}{b.fee?.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: b.status === 'confirmed' ? '#0a2a1e' : '#1a1a1a', color: b.status === 'confirmed' ? '#4ecca3' : '#888' }}>{b.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: b.contract_status === 'signed' ? '#0a2a1e' : '#2a1e0a', color: b.contract_status === 'signed' ? '#4ecca3' : '#f5c842' }}>{b.contract_status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Invoices tab */}
        {tab === 'invoices' && (
          <div style={{ background: '#111', border: '0.5px solid #222', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #222' }}>
                  {['Invoice #', 'Amount', 'Status', 'Issued', 'Due', 'Paid'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((inv: any) => (
                  <tr key={inv.id} style={{ borderBottom: '0.5px solid #1a1a1a' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '12px' }}>{inv.invoice_number}</td>
                    <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '500', fontFamily: 'monospace' }}>{cs(inv.currency)}{inv.total.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500',
                        background: inv.status === 'paid' ? '#0a2a1e' : inv.status === 'overdue' ? '#2a0a0a' : '#1a1a1a',
                        color: inv.status === 'paid' ? '#4ecca3' : inv.status === 'overdue' ? '#f08080' : '#888'
                      }}>{inv.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '11px', color: '#888' }}>{inv.issued_at ? new Date(inv.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '11px', color: inv.status === 'overdue' ? '#f08080' : '#888' }}>{inv.due_at ? new Date(inv.due_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '11px', color: '#4ecca3' }}>{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Promos tab */}
        {tab === 'promos' && (
          <div style={{ display: 'grid', gap: '10px' }}>
            {data.promoAccess.map((p: any) => (
              <div key={p.id} style={{ background: '#111', border: '0.5px solid #222', borderRadius: '10px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {p.releases?.artwork_url && <img src={p.releases.artwork_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '6px' }} />}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>{p.releases?.artist_name} — {p.releases?.title}</div>
                    <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{p.releases?.catalogue_number} · {p.releases?.genre || ''}</div>
                    <div style={{ fontSize: '10px', color: '#444', marginTop: '4px' }}>
                      Invited: {new Date(p.invited_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {p.downloaded_at && ` · Downloaded: ${new Date(p.downloaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                      {p.download_count > 0 && ` · ${p.download_count} downloads`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {p.releases?.dropbox_folder_url && (
                    <a href={p.releases.dropbox_folder_url} target="_blank" rel="noreferrer" style={{ padding: '7px 16px', background: '#1D9E75', borderRadius: '6px', color: '#fff', fontSize: '12px', textDecoration: 'none', fontWeight: '500' }}>Download</a>
                  )}
                  <a href={`/review?release=${p.releases?.catalogue_number}&contact=${sessionStorage.getItem('portal_email')}`} style={{ padding: '7px 16px', background: 'transparent', border: '0.5px solid #333', borderRadius: '6px', color: '#888', fontSize: '12px', textDecoration: 'none' }}>Leave review</a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reviews tab */}
        {tab === 'reviews' && (
          <div style={{ display: 'grid', gap: '10px' }}>
            {data.reviews.map((r: any) => (
              <div key={r.id} style={{ background: '#111', border: '0.5px solid #222', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>{r.releases?.artist_name} — {r.releases?.title}</div>
                    <div style={{ fontSize: '11px', color: '#555' }}>{r.releases?.catalogue_number}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', color: '#f5c842', letterSpacing: '2px' }}>{'★'.repeat(r.rating || 0)}{'☆'.repeat(5 - (r.rating || 0))}</div>
                    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: '500',
                      background: r.status === 'approved' ? '#0a2a1e' : r.status === 'rejected' ? '#2a0a0a' : '#2a1e0a',
                      color: r.status === 'approved' ? '#4ecca3' : r.status === 'rejected' ? '#f08080' : '#f5c842',
                    }}>{r.status}</span>
                  </div>
                </div>
                {r.body && <div style={{ fontSize: '12px', color: '#999', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{r.body}</div>}
                {r.charted && r.chart_name && (
                  <div style={{ marginTop: '8px', padding: '6px 10px', background: '#0a2a1e', borderRadius: '6px', fontSize: '11px', color: '#4ecca3' }}>Charted: {r.chart_name}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '11px', color: '#333', padding: '1rem 0' }}>
          Shine Frequency — London, UK · <a href="/" style={{ color: '#555', textDecoration: 'none' }}>Back to website</a>
        </div>
      </div>
    </div>
  )
}
