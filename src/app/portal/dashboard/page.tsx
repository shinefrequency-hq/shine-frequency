'use client'

import { useEffect, useState } from 'react'

interface PortalData {
  contact: any
  artist: any
  releases: any[]
  releaseStats: any[]
  bookings: any[]
  invoices: any[]
  promoAccess: any[]
  reviews: any[]
}

type TabKey = 'overview' | 'intelligence' | 'bookings' | 'invoices' | 'promos' | 'reviews' | 'messages'

export default function PortalDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PortalData | null>(null)
  const [tab, setTab] = useState<TabKey>('overview')
  const [selectedRelease, setSelectedRelease] = useState<string>('')
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const contactId = sessionStorage.getItem('portal_contact_id')
    if (!contactId) {
      window.location.href = '/portal'
      return
    }
    loadData(contactId)
  }, [])

  async function loadData(contactId: string) {
    const res = await fetch('/api/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'portal_data',
        contact_id: contactId,
        email: sessionStorage.getItem('portal_email'),
        name: sessionStorage.getItem('portal_name'),
      }),
    })
    const result = await res.json()
    setData(result.data)
    if (result.data?.releaseStats?.length > 0) {
      setSelectedRelease(result.data.releaseStats[0].catalogue_number)
    }

    // Load messages
    const msgRes = await fetch('/api/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'portal_messages', contact_id: contactId }),
    })
    const msgResult = await msgRes.json()
    setMessages(msgResult.messages ?? [])
    setUnreadCount((msgResult.messages ?? []).filter((m: any) => m.direction === 'outbound' && !m.is_read).length)

    setLoading(false)
  }

  async function sendMessage() {
    if (!newMessage.trim()) return
    setSendingMsg(true)
    await fetch('/api/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'portal_send_message',
        contact_id: sessionStorage.getItem('portal_contact_id'),
        body: newMessage.trim(),
      }),
    })
    setNewMessage('')
    setSendingMsg(false)
    // Reload messages
    const msgRes = await fetch('/api/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'portal_messages', contact_id: sessionStorage.getItem('portal_contact_id') }),
    })
    const msgResult = await msgRes.json()
    setMessages(msgResult.messages ?? [])
    setUnreadCount((msgResult.messages ?? []).filter((m: any) => m.direction === 'outbound' && !m.is_read).length)
  }

  // Auto-poll for new messages every 5 seconds
  useEffect(() => {
    const contactId = sessionStorage.getItem('portal_contact_id')
    if (!contactId) return
    const interval = setInterval(async () => {
      const res = await fetch('/api/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'portal_messages', contact_id: contactId }),
      })
      const result = await res.json()
      setMessages(result.messages ?? [])
      setUnreadCount((result.messages ?? []).filter((m: any) => m.direction === 'outbound' && !m.is_read).length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  function logout() {
    sessionStorage.clear()
    window.location.href = '/portal'
  }

  const cs = (c: string) => c === 'GBP' ? '£' : c === 'EUR' ? '€' : '$'

  function generateICS(booking: any) {
    const date = booking.event_date.replace(/-/g, '')
    const title = `${data?.artist?.stage_name || name} @ ${booking.venue_name}`
    const location = `${booking.venue_name}, ${booking.venue_city}`
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Shine Frequency//EN',
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${date}`,
      `DTEND;VALUE=DATE:${date}`,
      `SUMMARY:${title}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${booking.set_time || ''} | Fee: ${booking.fee} ${booking.currency} | Status: ${booking.status}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, '-')}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  function generateAllICS(bookings: any[]) {
    const events = bookings.map(b => {
      const date = b.event_date.replace(/-/g, '')
      const title = `${data?.artist?.stage_name || name} @ ${b.venue_name}`
      const location = `${b.venue_name}, ${b.venue_city}`
      return [
        'BEGIN:VEVENT',
        `DTSTART;VALUE=DATE:${date}`,
        `DTEND;VALUE=DATE:${date}`,
        `SUMMARY:${title}`,
        `LOCATION:${location}`,
        `DESCRIPTION:${b.set_time || ''} | Fee: ${b.fee} ${b.currency} | Status: ${b.status}`,
        'END:VEVENT',
      ].join('\r\n')
    })
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Shine Frequency//EN',
      ...events,
      'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'shine-frequency-bookings.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#555', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid #222', borderTopColor: '#1D9E75', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <div style={{ fontSize: '13px' }}>Loading your portal...</div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const name = data.contact?.full_name || sessionStorage.getItem('portal_name') || 'Artist'
  const stats = data.releaseStats || []
  const selected = stats.find((r: any) => r.catalogue_number === selectedRelease)

  // Aggregate stats across all releases
  const totalDJs = stats.reduce((s: number, r: any) => s + (r.dj_count || 0), 0)
  const totalDownloads = stats.reduce((s: number, r: any) => s + (r.promo_downloaded || 0), 0)
  const totalCharts = stats.reduce((s: number, r: any) => s + (r.chart_count || 0), 0)
  const totalSocialReach = stats.reduce((s: number, r: any) => s + (r.social_reach || 0), 0)
  const avgRatings = stats.filter((r: any) => r.avg_rating).map((r: any) => parseFloat(r.avg_rating))
  const overallAvgRating = avgRatings.length > 0 ? (avgRatings.reduce((a: number, b: number) => a + b, 0) / avgRatings.length).toFixed(1) : '—'

  const nextBooking = data.bookings
    .filter((b: any) => new Date(b.event_date) >= new Date())
    .sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())[0]

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'intelligence', label: 'Release Intelligence', count: stats.length },
    { key: 'bookings', label: 'Bookings', count: data.bookings.length },
    { key: 'invoices', label: 'Invoices', count: data.invoices.length },
    { key: 'promos', label: 'Promo Access', count: data.promoAccess.length },
    { key: 'reviews', label: 'My Reviews', count: data.reviews.length },
    { key: 'messages', label: 'Messages' },
  ]

  const tabStyle = (t: TabKey) => ({
    padding: '8px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: '500' as const,
    background: tab === t ? '#1D9E75' : 'transparent',
    border: tab === t ? 'none' : '1px solid #222',
    color: tab === t ? '#fff' : '#777',
    cursor: 'pointer' as const,
    transition: 'all 0.2s ease',
  })

  const cardStyle: React.CSSProperties = {
    background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '1.25rem',
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '6px',
  }

  const sectionSubtitle: React.CSSProperties = {
    fontSize: '12px', color: '#555', marginBottom: '16px',
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      live: { bg: '#0a2a1e', color: '#4ecca3' },
      promo: { bg: '#1e1a0a', color: '#f5c842' },
      upcoming: { bg: '#0a1a2e', color: '#7ab8f5' },
      draft: { bg: '#1a1a1a', color: '#666' },
    }
    const c = colors[status] || colors.draft
    return {
      padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '600' as const,
      background: c.bg, color: c.color, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
    }
  }

  const stars = (rating: number) => {
    const full = Math.floor(rating)
    const half = rating % 1 >= 0.5
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff' }}>
      {/* ═══════════ HEADER ═══════════ */}
      <div style={{ background: '#111', borderBottom: '1px solid #1a1a1a', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <a href="/portal/dashboard" style={{ textDecoration: 'none' }}>
            <img src="/frequency-logo.svg" alt="frequency" style={{ height: '24px', filter: 'invert(1)' }} />
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #1D9E75, #0a6e4f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600' }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '13px', color: '#aaa', fontWeight: '500' }}>{name}</span>
          </div>
          <button onClick={logout} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #333', borderRadius: '8px', color: '#666', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>Sign out</button>
        </div>
      </div>

      <div style={{ padding: '2rem 2.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        {/* ═══════════ TAB NAV ═══════════ */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem', flexWrap: 'wrap', borderBottom: '1px solid #1a1a1a', paddingBottom: '1.5rem' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ ...tabStyle(t.key), display: 'flex', alignItems: 'center', gap: '6px' }}>
              {t.label}{t.count !== undefined ? ` (${t.count})` : ''}
              {t.key === 'messages' && unreadCount > 0 && (
                <>
                  <span style={{ background: '#1D9E75', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center' }}>{unreadCount}</span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1D9E75', display: 'inline-block', animation: 'msgPulse 1.5s ease-in-out infinite' }} />
                </>
              )}
            </button>
          ))}
          <style>{`@keyframes msgPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.3); } }`}</style>
        </div>

        {/* ═══════════════════════════════════════════
            OVERVIEW TAB
        ═══════════════════════════════════════════ */}
        {tab === 'overview' && (
          <>
            {/* 5-column stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '2rem' }}>
              {[
                { label: 'DJs Reached', value: totalDJs.toLocaleString(), icon: '🎧', color: '#1D9E75' },
                { label: 'Total Downloads', value: totalDownloads.toLocaleString(), icon: '⬇', color: '#4ecca3' },
                { label: 'Avg Rating', value: overallAvgRating, icon: '★', color: '#f5c842' },
                { label: 'Chart Entries', value: totalCharts.toLocaleString(), icon: '📊', color: '#7ab8f5' },
                { label: 'Social Reach', value: totalSocialReach >= 1000 ? `${(totalSocialReach / 1000).toFixed(1)}k` : totalSocialReach.toLocaleString(), icon: '📡', color: '#c084fc' },
              ].map(s => (
                <div key={s.label} style={{ ...cardStyle, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '10px', right: '14px', fontSize: '22px', opacity: 0.15 }}>{s.icon}</div>
                  <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: '600' }}>{s.label}</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Your releases */}
            {stats.length > 0 && (
              <div style={{ ...cardStyle, marginBottom: '1rem' }}>
                <div style={sectionTitle}>Your Releases</div>
                <div style={sectionSubtitle}>All releases on frequency</div>
                {stats.map((r: any) => (
                  <div key={r.catalogue_number} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', borderBottom: '1px solid #1a1a1a', cursor: 'pointer' }}
                    onClick={() => { setSelectedRelease(r.catalogue_number); setTab('intelligence') }}>
                    {r.artwork_url
                      ? <img src={r.artwork_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                      : <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'linear-gradient(135deg, #1a1a1a, #222)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#333' }}>♫</div>
                    }
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{r.title}</div>
                      <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{r.catalogue_number} · {r.genre || r.format} · {r.release_date ? new Date(r.release_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {r.dj_count > 0 && <span style={{ fontSize: '11px', color: '#555' }}>{r.dj_count} DJs</span>}
                      {r.chart_count > 0 && <span style={{ fontSize: '11px', color: '#7ab8f5' }}>{r.chart_count} charts</span>}
                      <span style={statusBadge(r.status)}>{r.status}</span>
                    </div>
                    <span style={{ color: '#333', fontSize: '16px' }}>›</span>
                  </div>
                ))}
              </div>
            )}

            {/* Next upcoming booking */}
            {nextBooking && (
              <div style={{ ...cardStyle }}>
                <div style={sectionTitle}>Next Booking</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{nextBooking.venue_name}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{nextBooking.venue_city} · {nextBooking.set_time || 'TBC'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1D9E75' }}>
                      {new Date(nextBooking.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '13px', color: '#888', fontFamily: 'monospace', marginTop: '2px' }}>{cs(nextBooking.currency)}{nextBooking.fee?.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════
            RELEASE INTELLIGENCE TAB
        ═══════════════════════════════════════════ */}
        {tab === 'intelligence' && (
          <>
            {/* Release selector */}
            <div style={{ marginBottom: '2rem' }}>
              <select
                value={selectedRelease}
                onChange={(e) => setSelectedRelease(e.target.value)}
                style={{
                  background: '#111', border: '1px solid #222', borderRadius: '10px', padding: '12px 20px',
                  color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', width: '100%', maxWidth: '500px',
                  appearance: 'none', WebkitAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center',
                }}
              >
                {stats.map((r: any) => (
                  <option key={r.catalogue_number} value={r.catalogue_number}>
                    {r.catalogue_number} — {r.title}
                  </option>
                ))}
              </select>
            </div>

            {selected && (
              <>
                {/* Release header */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '2rem', ...cardStyle }}>
                  {selected.artwork_url
                    ? <img src={selected.artwork_url} alt="" style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover' }} />
                    : <div style={{ width: '80px', height: '80px', borderRadius: '10px', background: 'linear-gradient(135deg, #1a1a1a, #222)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#333' }}>♫</div>
                  }
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.02em' }}>{selected.title}</div>
                    <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{selected.catalogue_number} · {selected.genre} · {selected.format}</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <span style={statusBadge(selected.status)}>{selected.status}</span>
                      {selected.heat_status && <span style={{ ...statusBadge(''), background: '#2a1e0a', color: '#f5c842' }}>{selected.heat_status}</span>}
                    </div>
                  </div>
                </div>

                {/* Performance summary - 4 stat cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '2rem' }}>
                  {[
                    { label: 'DJs Playing', value: selected.dj_count || 0, color: '#1D9E75', sub: 'active DJs' },
                    { label: 'Download Rate', value: `${selected.download_rate || 0}%`, color: '#4ecca3', sub: `${selected.promo_downloaded || 0} of ${selected.promo_sent || 0}` },
                    { label: 'Review Rate', value: `${selected.review_rate || 0}%`, color: '#f5c842', sub: `${selected.promo_reviewed || 0} reviews` },
                    { label: 'Chart Entries', value: selected.chart_count || 0, color: '#7ab8f5', sub: 'charts worldwide' },
                  ].map(s => (
                    <div key={s.label} style={cardStyle}>
                      <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: '600' }}>{s.label}</div>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                      <div style={{ fontSize: '11px', color: '#444', marginTop: '4px' }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* ─── Who's playing your music ─── */}
                {selected.djs_playing?.length > 0 && (
                  <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                    <div style={sectionTitle}>Who&apos;s Playing Your Music</div>
                    <div style={sectionSubtitle}>These DJs downloaded and are actively playing your release</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                      {selected.djs_playing.map((dj: any, i: number) => (
                        <div key={i} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: '13px', fontWeight: '600' }}>{dj.name}</div>
                            {dj.type && (
                              <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '9px', fontWeight: '600', background: dj.type === 'A-list' ? '#1D9E75' : dj.type === 'B-list' ? '#0a2a1e' : '#1a1a1a', color: dj.type === 'A-list' ? '#fff' : dj.type === 'B-list' ? '#4ecca3' : '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {dj.type}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: '#666' }}>
                            {[dj.city, dj.country].filter(Boolean).join(', ')}
                          </div>
                          {dj.org && <div style={{ fontSize: '10px', color: '#444' }}>{dj.org}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── Where it's landing ─── */}
                {selected.locations?.length > 0 && (
                  <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                    <div style={sectionTitle}>Where It&apos;s Landing</div>
                    <div style={sectionSubtitle}>Your music is reaching these cities</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selected.locations
                        .sort((a: any, b: any) => b.count - a.count)
                        .map((loc: any, i: number) => {
                          const maxCount = selected.locations[0]?.count || 1
                          const pct = Math.max((loc.count / maxCount) * 100, 8)
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '140px', fontSize: '12px', color: '#aaa', fontWeight: '500', flexShrink: 0 }}>{loc.location}</div>
                              <div style={{ flex: 1, background: '#0d0d0d', borderRadius: '6px', height: '28px', overflow: 'hidden', position: 'relative' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, #1D9E75, #0a6e4f)`, borderRadius: '6px', transition: 'width 0.6s ease' }} />
                              </div>
                              <div style={{ width: '36px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#1D9E75', fontFamily: 'monospace' }}>{loc.count}</div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* ─── Chart positions ─── */}
                {selected.chart_entries?.length > 0 && (
                  <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                    <div style={sectionTitle}>Chart Positions</div>
                    <div style={sectionSubtitle}>Your release featured in these DJ charts</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {selected.chart_entries.map((ce: any, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#0a1a0f', border: '1px solid #143d28', borderRadius: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                            #{i + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#4ecca3' }}>{ce.chart}</div>
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{ce.dj}{ce.city ? ` · ${ce.city}` : ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── What DJs are saying ─── */}
                {selected.featured_quotes?.length > 0 && (
                  <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                    <div style={sectionTitle}>What DJs Are Saying</div>
                    <div style={sectionSubtitle}>Featured feedback from industry professionals</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
                      {selected.featured_quotes.map((q: any, i: number) => (
                        <div key={i} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '20px', position: 'relative' }}>
                          <div style={{ position: 'absolute', top: '12px', left: '16px', fontSize: '48px', color: '#1D9E75', opacity: 0.15, fontFamily: 'Georgia, serif', lineHeight: 1 }}>&ldquo;</div>
                          <div style={{ fontSize: '13px', color: '#ccc', fontStyle: 'italic', lineHeight: 1.7, marginBottom: '16px', paddingTop: '12px', position: 'relative', zIndex: 1 }}>
                            &ldquo;{q.quote}&rdquo;
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{q.dj}</div>
                              <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                                {[q.org, q.city].filter(Boolean).join(' · ')}
                              </div>
                            </div>
                            {q.rating && (
                              <div style={{ fontSize: '14px', color: '#f5c842', letterSpacing: '1px' }}>
                                {stars(q.rating)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── Track performance ─── */}
                {selected.tracks?.length > 0 && (
                  <div style={{ ...cardStyle, marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.25rem 0' }}>
                      <div style={sectionTitle}>Track Performance</div>
                      <div style={sectionSubtitle}>Per-track breakdown across all promo recipients</div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #222' }}>
                          {['#', 'Title', 'BPM', 'Key', 'Downloads', 'Plays', 'Charted'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selected.tracks.map((t: any) => (
                          <tr key={t.position} style={{ borderBottom: '1px solid #1a1a1a' }}>
                            <td style={{ padding: '12px 16px', fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>{t.position}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600' }}>{t.title}</td>
                            <td style={{ padding: '12px 16px', fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>{t.bpm || '—'}</td>
                            <td style={{ padding: '12px 16px', fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>{t.key || '—'}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#4ecca3', fontFamily: 'monospace' }}>{t.download_count || 0}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#7ab8f5', fontFamily: 'monospace' }}>{t.play_count || 0}</td>
                            <td style={{ padding: '12px 16px' }}>
                              {(t.charted_count || 0) > 0
                                ? <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '600', background: '#0a2a1e', color: '#4ecca3' }}>{t.charted_count}x charted</span>
                                : <span style={{ fontSize: '11px', color: '#333' }}>—</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ─── Social impact ─── */}
                {(selected.social_reach || selected.social_likes || selected.social_shares) && (
                  <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                    <div style={sectionTitle}>Social Impact</div>
                    <div style={sectionSubtitle}>Engagement across social platforms</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      {[
                        { label: 'Reach', value: selected.social_reach || 0, color: '#c084fc' },
                        { label: 'Likes', value: selected.social_likes || 0, color: '#f472b6' },
                        { label: 'Shares', value: selected.social_shares || 0, color: '#7ab8f5' },
                      ].map(s => (
                        <div key={s.label} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                          <div style={{ fontSize: '28px', fontWeight: '700', color: s.color, letterSpacing: '-0.02em' }}>
                            {s.value >= 1000 ? `${(s.value / 1000).toFixed(1)}k` : s.value.toLocaleString()}
                          </div>
                          <div style={{ fontSize: '11px', color: '#555', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── Discovered Plays ─── */}
                {selected.discoveries && selected.discoveries.length > 0 && (
                  <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                    <div style={sectionTitle}>Discovered Plays</div>
                    <div style={sectionSubtitle}>Found across YouTube, Mixcloud, Discogs and DJ set databases</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {selected.discoveries.map((d: any, i: number) => (
                        <a key={i} href={d.url} target="_blank" rel="noreferrer" style={{
                          display: 'flex', gap: '10px', padding: '10px', background: '#0a0a0a',
                          borderRadius: '8px', textDecoration: 'none', color: 'inherit',
                          border: '0.5px solid #1a1a1a', transition: 'border-color 0.15s',
                        }}>
                          {d.thumbnail && (
                            <img src={d.thumbnail} alt="" style={{ width: '60px', height: '45px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '11px', fontWeight: '500', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                            <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>
                              {d.channel && <span>{d.channel} · </span>}
                              <span style={{ color: d.platform === 'youtube' ? '#7ab8f5' : d.platform === 'mixcloud' ? '#b8b4f0' : d.platform === 'discogs' ? '#4ecca3' : '#ff7043' }}>
                                {d.platform}
                              </span>
                            </div>
                            {d.views && <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>{d.views}</div>}
                            {(d.community_want > 0 || d.community_have > 0) && (
                              <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>Want: {d.community_want} · Have: {d.community_have}</div>
                            )}
                            {d.note && <div style={{ fontSize: '10px', color: '#1D9E75', marginTop: '3px', fontStyle: 'italic' }}>{d.note}</div>}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── Promo funnel ─── */}
                {(selected.promo_sent > 0) && (
                  <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                    <div style={sectionTitle}>Promo Funnel</div>
                    <div style={sectionSubtitle}>Conversion pipeline from send to review</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '600px' }}>
                      {[
                        { label: 'Sent', value: selected.promo_sent, pct: 100 },
                        { label: 'Downloaded', value: selected.promo_downloaded || 0, pct: selected.download_rate || 0 },
                        { label: 'Reviewed', value: selected.promo_reviewed || 0, pct: selected.review_rate || 0 },
                      ].map((step, i) => (
                        <div key={step.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', color: '#aaa', fontWeight: '500' }}>{step.label}</span>
                            <span style={{ fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>{step.value} ({step.pct}%)</span>
                          </div>
                          <div style={{ height: '32px', background: '#0d0d0d', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                            <div style={{
                              width: `${step.pct}%`, height: '100%',
                              background: i === 0 ? '#1D9E75' : i === 1 ? 'linear-gradient(90deg, #1D9E75, #4ecca3)' : 'linear-gradient(90deg, #f5c842, #f5a623)',
                              borderRadius: '8px', transition: 'width 0.8s ease',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: i === 2 ? '#000' : '#fff' }}>{step.pct}%</span>
                            </div>
                          </div>
                          {i < 2 && (
                            <div style={{ textAlign: 'center', color: '#333', fontSize: '14px', margin: '2px 0' }}>↓</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {stats.length === 0 && (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.2 }}>📊</div>
                <div style={{ fontSize: '14px', color: '#555' }}>No release intelligence data available yet</div>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════
            BOOKINGS TAB
        ═══════════════════════════════════════════ */}
        {tab === 'bookings' && (
          <>
          {data.bookings.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <button onClick={() => generateAllICS(data.bookings)} style={{ padding: '8px 18px', background: '#1D9E75', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                Export all to calendar
              </button>
            </div>
          )}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222' }}>
                  {['Venue', 'City', 'Date', 'Set time', 'Fee', 'Status', 'Contract', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.bookings.map((b: any) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '13px' }}>{b.venue_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#888' }}>{b.venue_city}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px' }}>{new Date(b.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#888' }}>{b.set_time || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', fontFamily: 'monospace' }}>{cs(b.currency)}{b.fee?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '600', background: b.status === 'confirmed' ? '#0a2a1e' : '#1a1a1a', color: b.status === 'confirmed' ? '#4ecca3' : '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{b.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '600', background: b.contract_status === 'signed' ? '#0a2a1e' : '#2a1e0a', color: b.contract_status === 'signed' ? '#4ecca3' : '#f5c842', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{b.contract_status}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => generateICS(b)} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #333', borderRadius: '6px', color: '#888', fontSize: '10px', cursor: 'pointer', fontWeight: '500', whiteSpace: 'nowrap' }}>Add to cal</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.bookings.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#444', fontSize: '13px' }}>No bookings yet</div>
            )}
          </div>
          </>
        )}

        {/* ═══════════════════════════════════════════
            INVOICES TAB
        ═══════════════════════════════════════════ */}
        {tab === 'invoices' && (
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222' }}>
                  {['Invoice #', 'Amount', 'Status', 'Issued', 'Due', 'Paid'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((inv: any) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px' }}>{inv.invoice_number}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', fontFamily: 'monospace' }}>{cs(inv.currency)}{inv.total.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: inv.status === 'paid' ? '#0a2a1e' : inv.status === 'overdue' ? '#2a0a0a' : '#1a1a1a',
                        color: inv.status === 'paid' ? '#4ecca3' : inv.status === 'overdue' ? '#f08080' : '#888'
                      }}>{inv.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '11px', color: '#888' }}>{inv.issued_at ? new Date(inv.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '11px', color: inv.status === 'overdue' ? '#f08080' : '#888' }}>{inv.due_at ? new Date(inv.due_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '11px', color: '#4ecca3' }}>{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.invoices.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#444', fontSize: '13px' }}>No invoices yet</div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════
            PROMO ACCESS TAB
        ═══════════════════════════════════════════ */}
        {tab === 'promos' && (
          <div style={{ display: 'grid', gap: '12px' }}>
            {data.promoAccess.map((p: any) => (
              <div key={p.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {p.releases?.artwork_url && <img src={p.releases.artwork_url} alt="" style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover' }} />}
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{p.releases?.artist_name} — {p.releases?.title}</div>
                    <div style={{ fontSize: '11px', color: '#555', marginTop: '3px' }}>{p.releases?.catalogue_number} · {p.releases?.genre || ''}</div>
                    <div style={{ fontSize: '10px', color: '#444', marginTop: '4px' }}>
                      Invited: {new Date(p.invited_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {p.downloaded_at && ` · Downloaded: ${new Date(p.downloaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                      {p.download_count > 0 && ` · ${p.download_count} downloads`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {p.downloaded_at ? (
                    <span style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', background: '#0a2a1e', color: '#4ecca3' }}>Downloaded</span>
                  ) : p.releases?.dropbox_folder_url ? (
                    <a href={p.releases.dropbox_folder_url} target="_blank" rel="noreferrer" style={{ padding: '8px 18px', background: '#1D9E75', borderRadius: '8px', color: '#fff', fontSize: '12px', textDecoration: 'none', fontWeight: '600' }}>Download</a>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#555' }}>Coming soon</span>
                  )}
                  <a href={`/review?release=${p.releases?.catalogue_number}&contact=${sessionStorage.getItem('portal_email')}`} style={{ padding: '8px 18px', background: 'transparent', border: '1px solid #333', borderRadius: '8px', color: '#888', fontSize: '12px', textDecoration: 'none', fontWeight: '500' }}>Leave review</a>
                </div>
              </div>
            ))}
            {data.promoAccess.length === 0 && (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: '#444', fontSize: '13px' }}>No promo access yet</div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════
            MY REVIEWS TAB
        ═══════════════════════════════════════════ */}
        {tab === 'reviews' && (
          <div style={{ display: 'grid', gap: '12px' }}>
            {data.reviews.map((r: any) => (
              <div key={r.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{r.releases?.artist_name} — {r.releases?.title}</div>
                    <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{r.releases?.catalogue_number}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', color: '#f5c842', letterSpacing: '2px' }}>{'★'.repeat(r.rating || 0)}{'☆'.repeat(5 - (r.rating || 0))}</div>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em',
                      background: r.status === 'approved' ? '#0a2a1e' : r.status === 'rejected' ? '#2a0a0a' : '#2a1e0a',
                      color: r.status === 'approved' ? '#4ecca3' : r.status === 'rejected' ? '#f08080' : '#f5c842',
                    }}>{r.status}</span>
                  </div>
                </div>
                {r.body && <div style={{ fontSize: '13px', color: '#999', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{r.body}</div>}
                {r.charted && r.chart_name && (
                  <div style={{ marginTop: '10px', padding: '8px 14px', background: '#0a2a1e', borderRadius: '8px', fontSize: '12px', color: '#4ecca3', fontWeight: '500' }}>Charted: {r.chart_name}</div>
                )}
              </div>
            ))}
            {data.reviews.length === 0 && (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: '#444', fontSize: '13px' }}>No reviews yet</div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════
            MESSAGES TAB
        ═══════════════════════════════════════════ */}
        {tab === 'messages' && (
          <div style={{ background: '#111', border: '0.5px solid #222', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '500px' }}>
            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #222', fontSize: '13px', fontWeight: '600', color: '#fff' }}>
              Messages with Shine
              {unreadCount > 0 && <span style={{ marginLeft: '8px', background: '#1D9E75', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '10px' }}>{unreadCount} new</span>}
            </div>

            {/* Message list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#555', fontSize: '13px', padding: '3rem 0' }}>
                  No messages yet. Send a message to get started.
                </div>
              ) : messages.map((m: any, i: number) => {
                const isFromArtist = m.direction === 'inbound'
                return (
                  <div key={m.id || i} style={{
                    alignSelf: isFromArtist ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                  }}>
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: isFromArtist ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      background: isFromArtist ? '#1D9E75' : '#222',
                      color: '#fff',
                      fontSize: '13px',
                      lineHeight: 1.5,
                    }}>
                      {m.body}
                    </div>
                    <div style={{
                      fontSize: '10px', color: '#555', marginTop: '4px',
                      textAlign: isFromArtist ? 'right' : 'left',
                    }}>
                      {isFromArtist ? 'You' : 'Shine'} · {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: '0.5px solid #222', display: 'flex', gap: '8px' }}>
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type a message..."
                style={{ flex: 1, padding: '10px 14px', background: '#1a1a1a', border: '0.5px solid #333', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sendingMsg}
                style={{
                  padding: '10px 20px', background: !newMessage.trim() || sendingMsg ? '#0a4a30' : '#1D9E75',
                  border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px',
                  fontWeight: '600', cursor: !newMessage.trim() || sendingMsg ? 'not-allowed' : 'pointer',
                }}
              >
                {sendingMsg ? '...' : 'Send'}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ FOOTER ═══════════ */}
        <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '11px', color: '#333', padding: '1.5rem 0', borderTop: '1px solid #1a1a1a' }}>
          Shine — London, UK · <a href="/" style={{ color: '#555', textDecoration: 'none' }}>Back to website</a>
        </div>
      </div>
    </div>
  )
}
