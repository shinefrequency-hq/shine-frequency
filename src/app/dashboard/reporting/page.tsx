import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function ReportingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cs = (c: string) => c === 'GBP' ? '£' : c === 'EUR' ? '€' : '$'

  const [
    invoicesRes,
    releasesRes,
    contactsRes,
    bookingsRes,
    reviewsRes,
    downloadsRes,
    topReleasesRes,
    auditRes,
  ] = await Promise.all([
    (supabase as any).from('invoices').select('*'),
    (supabase as any).from('releases').select('*'),
    (supabase as any).from('contacts').select('*'),
    (supabase as any).from('bookings').select('*'),
    (supabase as any).from('reviews').select('*'),
    (supabase as any).from('download_events').select('*'),
    (supabase as any).from('download_events').select('release_id, releases(catalogue_number, artist_name, title)'),
    (supabase as any).from('audit_log').select('*').order('created_at', { ascending: false }).limit(10),
  ])

  const invoices = invoicesRes.data ?? []
  const releases = releasesRes.data ?? []
  const contacts = contactsRes.data ?? []
  const bookings = bookingsRes.data ?? []
  const reviews = reviewsRes.data ?? []
  const downloads = downloadsRes.data ?? []
  const topReleaseDls = topReleasesRes.data ?? []
  const auditEntries = auditRes.data ?? []

  // Revenue stats
  const paidInvoices = invoices.filter((i: any) => i.status === 'paid')
  const sentInvoices = invoices.filter((i: any) => ['sent', 'viewed', 'overdue'].includes(i.status))
  const overdueInvoices = invoices.filter((i: any) => i.status === 'overdue')
  const draftInvoices = invoices.filter((i: any) => i.status === 'draft')

  const sumTotal = (arr: any[]) => arr.reduce((s: number, i: any) => s + (Number(i.total) || 0), 0)
  const paidTotal = sumTotal(paidInvoices)
  const outstandingTotal = sumTotal(sentInvoices)
  const overdueTotal = sumTotal(overdueInvoices)

  // Release stats
  const liveReleases = releases.filter((r: any) => r.status === 'live')
  const scheduledReleases = releases.filter((r: any) => r.status === 'scheduled')

  // Contact stats
  const onPromo = contacts.filter((c: any) => c.on_promo_list === true)
  const highValue = contacts.filter((c: any) => c.high_value === true)

  // Booking stats
  const confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed')
  const completedBookings = bookings.filter((b: any) => b.status === 'completed')
  const bookingRevenue = bookings.reduce((s: number, b: any) => s + (Number(b.fee) || 0), 0)

  // Review stats
  const pendingReviews = reviews.filter((r: any) => r.status === 'pending')
  const ratedReviews = reviews.filter((r: any) => r.rating != null && r.rating > 0)
  const avgRating = ratedReviews.length > 0
    ? (ratedReviews.reduce((s: number, r: any) => s + Number(r.rating), 0) / ratedReviews.length).toFixed(1)
    : '—'
  const chartEntries = reviews.filter((r: any) => r.charted === true)

  // Top 5 releases by download count
  const dlByRelease: Record<string, { count: number; release: any }> = {}
  for (const dl of topReleaseDls) {
    const rid = dl.release_id
    if (!rid) continue
    if (!dlByRelease[rid]) {
      dlByRelease[rid] = { count: 0, release: dl.releases }
    }
    dlByRelease[rid].count++
  }
  const topReleases = Object.entries(dlByRelease)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)

  // Enrich top releases with review stats
  const topReleasesEnriched = topReleases.map(([releaseId, data]) => {
    const releaseReviews = reviews.filter((r: any) => r.release_id === releaseId)
    const rated = releaseReviews.filter((r: any) => r.rating != null && r.rating > 0)
    const avg = rated.length > 0
      ? (rated.reduce((s: number, r: any) => s + Number(r.rating), 0) / rated.length).toFixed(1)
      : '—'
    return {
      ...data,
      reviewCount: releaseReviews.length,
      avgRating: avg,
    }
  })

  const card = {
    background: 'var(--bg-2)',
    border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1rem',
  }

  const statBox = {
    ...card,
    padding: '0.75rem 1rem',
  }

  return (
    <div style={{ padding: '1.5rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text)' }}>Reporting</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
          Revenue, performance and activity overview
        </div>
      </div>

      {/* Stats row 1 — 5 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '8px' }}>
        {[
          { label: 'Revenue (paid)', value: `£${paidTotal.toLocaleString()}`, color: '#1D9E75' },
          { label: 'Outstanding', value: `£${outstandingTotal.toLocaleString()}`, color: '#f5c842' },
          { label: 'Overdue', value: `£${overdueTotal.toLocaleString()}`, color: overdueTotal > 0 ? '#f08080' : 'var(--text-3)' },
          { label: 'Active releases', value: liveReleases.length, color: '#1D9E75' },
          { label: 'Downloads', value: downloads.length, color: '#7ab8f5' },
        ].map(s => (
          <div key={s.label} style={statBox}>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: '500', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Stats row 2 — 4 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
        {[
          { label: 'Contacts', value: contacts.length, color: 'var(--text)' },
          { label: 'On promo', value: onPromo.length, color: '#1D9E75' },
          { label: 'Avg rating', value: avgRating, color: '#f5c842' },
          { label: 'Chart entries', value: chartEntries.length, color: '#7ab8f5' },
        ].map(s => (
          <div key={s.label} style={statBox}>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: '500', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue breakdown */}
      <div style={{ ...card, marginBottom: '1rem' }}>
        <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)', marginBottom: '0.75rem' }}>
          Revenue breakdown
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { label: 'Paid', count: paidInvoices.length, total: paidTotal, color: '#1D9E75' },
            { label: 'Sent / Viewed', count: sentInvoices.filter((i: any) => i.status !== 'overdue').length, total: sumTotal(sentInvoices.filter((i: any) => i.status !== 'overdue')), color: '#7ab8f5' },
            { label: 'Draft', count: draftInvoices.length, total: sumTotal(draftInvoices), color: 'var(--text-3)' },
            { label: 'Overdue', count: overdueInvoices.length, total: overdueTotal, color: '#f08080' },
          ].map(row => (
            <div key={row.label} style={{ padding: '10px', background: 'var(--bg-3)', borderRadius: 'var(--radius)', border: '0.5px solid var(--border)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '4px' }}>{row.label}</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: row.color }}>
                £{row.total.toLocaleString()}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>
                {row.count} invoice{row.count !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top releases + Recent activity side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Top releases */}
        <div style={card}>
          <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)', marginBottom: '0.75rem' }}>
            Top releases by downloads
          </div>
          {topReleasesEnriched.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>No download data yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 4px', color: 'var(--text-3)', fontWeight: '500', fontSize: '10px' }}>Cat#</th>
                  <th style={{ textAlign: 'left', padding: '6px 4px', color: 'var(--text-3)', fontWeight: '500', fontSize: '10px' }}>Artist</th>
                  <th style={{ textAlign: 'left', padding: '6px 4px', color: 'var(--text-3)', fontWeight: '500', fontSize: '10px' }}>Title</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px', color: 'var(--text-3)', fontWeight: '500', fontSize: '10px' }}>DLs</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px', color: 'var(--text-3)', fontWeight: '500', fontSize: '10px' }}>Reviews</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px', color: 'var(--text-3)', fontWeight: '500', fontSize: '10px' }}>Avg</th>
                </tr>
              </thead>
              <tbody>
                {topReleasesEnriched.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '0.5px solid var(--border)' }}>
                    <td style={{ padding: '6px 4px', fontFamily: 'monospace', color: 'var(--text-3)' }}>{r.release?.catalogue_number ?? '—'}</td>
                    <td style={{ padding: '6px 4px', color: 'var(--text)' }}>{r.release?.artist_name ?? '—'}</td>
                    <td style={{ padding: '6px 4px', color: 'var(--text)' }}>{r.release?.title ?? '—'}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '500', color: '#1D9E75' }}>{r.count}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', color: 'var(--text-3)' }}>{r.reviewCount}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', color: '#f5c842' }}>{r.avgRating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent activity */}
        <div style={card}>
          <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)', marginBottom: '0.75rem' }}>
            Recent activity
          </div>
          {auditEntries.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>No activity recorded yet</div>
          ) : (
            <div>
              {auditEntries.map((entry: any) => (
                <div key={entry.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '6px 0', borderBottom: '0.5px solid var(--border)'
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', flexShrink: 0, width: '65px', fontFamily: 'monospace' }}>
                    {new Date(entry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                  <div style={{ flex: 1, fontSize: '11px', color: 'var(--text)' }}>
                    {entry.action}
                  </div>
                  <div style={{
                    fontSize: '9px', color: 'var(--text-3)', background: 'var(--bg-3)',
                    padding: '2px 6px', borderRadius: 'var(--radius)', fontWeight: '500',
                    textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0
                  }}>
                    {entry.module ?? '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
