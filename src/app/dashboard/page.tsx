import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [releases, reviews, tasks, bookings, invoices] = await Promise.all([
    (supabase as any).from('releases').select('*').in('status', ['live', 'scheduled']),
    (supabase as any).from('reviews').select('*, releases(title, catalogue_number), contacts(full_name)').eq('status', 'pending'),
    (supabase as any).from('tasks').select('*').is('completed_at', null).order('urgency'),
    (supabase as any).from('bookings').select('*, artists(stage_name)').in('status', ['confirmed', 'pending']).order('event_date', { ascending: true }).limit(10),
    (supabase as any).from('invoices').select('*').in('status', ['sent', 'viewed', 'overdue']).order('due_at', { ascending: true }),
  ])

  const activeReleases = releases.data ?? []
  const pendingReviews = reviews.data ?? []
  const allTasks = tasks.data ?? []
  const upcomingBookings = bookings.data ?? []
  const outstandingInvoices = invoices.data ?? []

  const urgentTasks = allTasks.filter((t: any) => t.urgency === 'now')
  const todayTasks = allTasks.filter((t: any) => t.urgency === 'today')
  const weekTasks = allTasks.filter((t: any) => t.urgency === 'this_week')

  const now = Date.now()
  const overdueInvoices = outstandingInvoices.filter((inv: any) => inv.due_at && new Date(inv.due_at).getTime() < now)
  const expiringReleases = activeReleases.filter((r: any) => {
    if (!r.promo_window_end) return false
    const daysLeft = Math.ceil((new Date(r.promo_window_end).getTime() - now) / 86400000)
    return daysLeft > 0 && daysLeft <= 7
  })

  const next7days = upcomingBookings.filter((b: any) => {
    const daysUntil = Math.ceil((new Date(b.event_date).getTime() - now) / 86400000)
    return daysUntil >= 0 && daysUntil <= 14
  })

  const currSymbol = (c: string) => c === 'GBP' ? '£' : c === 'EUR' ? '€' : '$'
  const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - now) / 86400000)

  return (
    <div style={{ padding: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text)' }}>Today's queue</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
        {[
          { label: 'Active releases', value: activeReleases.length, color: '#4ecca3' },
          { label: 'Pending reviews', value: pendingReviews.length, color: '#f5c842' },
          { label: 'Urgent tasks', value: urgentTasks.length, color: '#f08080' },
          { label: 'Upcoming gigs', value: next7days.length, color: '#7ab8f5' },
          { label: 'Overdue invoices', value: overdueInvoices.length, color: overdueInvoices.length > 0 ? '#f08080' : 'var(--text-3)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-2)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '0.75rem 1rem'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: '500', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Overdue invoices alert */}
      {overdueInvoices.length > 0 && (
        <div style={{
          background: 'var(--red-bg)', border: '0.5px solid var(--red-border)',
          borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#f08080' }}>
              Overdue invoices
            </div>
            <Link href="/dashboard/invoicing" style={{ fontSize: '11px', color: 'var(--text-3)' }}>View all →</Link>
          </div>
          {overdueInvoices.map((inv: any) => {
            const daysOver = Math.floor((now - new Date(inv.due_at).getTime()) / 86400000)
            return (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
                <div>
                  <span style={{ fontWeight: '500', color: 'var(--text)', fontSize: '12px' }}>{inv.invoice_number}</span>
                  <span style={{ color: 'var(--text-3)', fontSize: '12px' }}> — {inv.recipient_name}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text)' }}>{currSymbol(inv.currency)}{inv.total}</span>
                  <span style={{ fontSize: '10px', fontWeight: '500', color: '#f08080' }}>{daysOver}d overdue</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Urgent tasks */}
      {urgentTasks.length > 0 && (
        <div style={{
          background: 'var(--bg-2)', border: '0.5px solid var(--red-border)',
          borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1rem'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '500', color: '#f08080', marginBottom: '0.75rem' }}>
            Critical — act now
          </div>
          {urgentTasks.map((task: any) => (
            <div key={task.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 0', borderBottom: '0.5px solid var(--border)'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f08080', flexShrink: 0 }} />
              <div style={{ flex: 1, fontWeight: '500', color: 'var(--text)', fontSize: '12px' }}>{task.title}</div>
              <div style={{ fontSize: '10px', fontWeight: '500', color: '#f08080' }}>Now</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

        {/* Today's tasks */}
        <div style={{
          background: 'var(--bg-2)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '1rem'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '500', color: '#f5c842', marginBottom: '0.75rem' }}>
            Today ({todayTasks.length})
          </div>
          {todayTasks.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Nothing due today</div>
          ) : todayTasks.map((task: any) => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f5c842', flexShrink: 0 }} />
              <div style={{ fontSize: '12px', color: 'var(--text)' }}>{task.title}</div>
            </div>
          ))}
        </div>

        {/* This week */}
        <div style={{
          background: 'var(--bg-2)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '1rem'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-2)', marginBottom: '0.75rem' }}>
            This week ({weekTasks.length})
          </div>
          {weekTasks.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Nothing this week</div>
          ) : weekTasks.map((task: any) => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--border-2)', flexShrink: 0 }} />
              <div style={{ fontSize: '12px', color: 'var(--text)' }}>{task.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending reviews */}
      {pendingReviews.length > 0 && (
        <div style={{
          background: 'var(--bg-2)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#f5c842' }}>
              Pending reviews ({pendingReviews.length})
            </div>
            <Link href="/dashboard/reviews" style={{ fontSize: '11px', color: 'var(--text-3)' }}>Review all →</Link>
          </div>
          {pendingReviews.map((r: any) => {
            const stars = r.rating ? '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) : '—'
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '500', color: 'var(--text)', fontSize: '12px' }}>{r.contacts?.full_name ?? '—'}</span>
                    <span style={{ fontSize: '11px', color: '#f5c842', letterSpacing: '1px' }}>{stars}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                    {r.releases?.catalogue_number} — {r.releases?.title}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                  {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upcoming bookings */}
      {next7days.length > 0 && (
        <div style={{
          background: 'var(--bg-2)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#7ab8f5' }}>
              Upcoming bookings
            </div>
            <Link href="/dashboard/bookings" style={{ fontSize: '11px', color: 'var(--text-3)' }}>View all →</Link>
          </div>
          {next7days.map((b: any) => {
            const days = daysUntil(b.event_date)
            return (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '500', color: 'var(--text)', fontSize: '12px' }}>{b.artists?.stage_name ?? '—'}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>@ {b.venue_name}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                    {b.venue_city} · {b.set_time ?? '—'} · {currSymbol(b.currency)}{b.fee?.toLocaleString() ?? '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: days <= 3 ? '#f5c842' : 'var(--text)' }}>
                    {new Date(b.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                  <div style={{ fontSize: '10px', color: days <= 3 ? '#f5c842' : 'var(--text-3)' }}>
                    {days === 0 ? 'Today' : `${days}d away`}
                  </div>
                  {!b.travel_booked && b.status === 'confirmed' && (
                    <div style={{ fontSize: '9px', color: '#ff7043', marginTop: '2px' }}>Travel unbooked</div>
                  )}
                  {b.contract_status !== 'signed' && b.status === 'confirmed' && (
                    <div style={{ fontSize: '9px', color: '#f08080', marginTop: '1px' }}>Contract unsigned</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Expiring promo windows */}
      {expiringReleases.length > 0 && (
        <div style={{
          background: 'var(--bg-2)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#ff7043' }}>
              Promo windows closing soon
            </div>
            <Link href="/dashboard/heat" style={{ fontSize: '11px', color: 'var(--text-3)' }}>Heat tracker →</Link>
          </div>
          {expiringReleases.map((r: any) => {
            const days = daysUntil(r.promo_window_end)
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-3)' }}>{r.catalogue_number}</span>
                    <span style={{ fontWeight: '500', color: 'var(--text)', fontSize: '12px' }}>{r.artist_name} — {r.title}</span>
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '500', color: days <= 3 ? '#f08080' : '#ff7043' }}>
                  {days}d left
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* All clear */}
      {urgentTasks.length === 0 && todayTasks.length === 0 && pendingReviews.length === 0 && overdueInvoices.length === 0 && (
        <div style={{
          background: 'var(--bg-2)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>All clear</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>No urgent items. Start by adding your first release.</div>
        </div>
      )}
    </div>
  )
}
