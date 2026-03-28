import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [releases, reviews, tasks] = await Promise.all([
    (supabase as any).from('releases').select('*').eq('status', 'live'),
    (supabase as any).from('reviews').select('*').eq('status', 'pending'),
    (supabase as any).from('tasks').select('*').is('completed_at', null).order('urgency'),
  ])

  const activeReleases = releases.data?.length ?? 0
  const pendingReviews = reviews.data?.length ?? 0
  const urgentTasks = tasks.data?.filter((t: any) => t.urgency === 'now') ?? []
  const todayTasks = tasks.data?.filter((t: any) => t.urgency === 'today') ?? []
  const weekTasks = tasks.data?.filter((t: any) => t.urgency === 'this_week') ?? []

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text)' }}>Today's queue</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ padding: '6px 14px', background: 'var(--green-bg)', border: '0.5px solid var(--green)', borderRadius: 'var(--radius)', fontSize: '12px', color: 'var(--green-text)' }}>
            {activeReleases} active releases
          </div>
          <div style={{ padding: '6px 14px', background: 'var(--amber-bg)', border: '0.5px solid var(--amber)', borderRadius: 'var(--radius)', fontSize: '12px', color: 'var(--amber-text)' }}>
            {pendingReviews} pending reviews
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '1.5rem' }}>
        {[
          { label: 'Active releases', value: activeReleases },
          { label: 'Pending reviews', value: pendingReviews },
          { label: 'Urgent tasks', value: urgentTasks.length },
          { label: 'This week', value: weekTasks.length },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-2)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '1rem'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Urgent */}
      {urgentTasks.length > 0 && (
        <div style={{
          background: 'var(--bg-2)', border: '0.5px solid #5a1a0a',
          borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1rem'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--red)', marginBottom: '0.75rem' }}>
            Critical — act now
          </div>
          {urgentTasks.map(task => (
            <div key={task.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 0', borderBottom: '0.5px solid var(--border)'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', color: 'var(--text)' }}>{task.title}</div>
                {task.description && <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{task.description}</div>}
              </div>
              <div style={{ fontSize: '10px', fontWeight: '500', color: 'var(--red)', whiteSpace: 'nowrap' }}>Now</div>
            </div>
          ))}
        </div>
      )}

      {/* Today */}
      {todayTasks.length > 0 && (
        <div style={{
          background: 'var(--bg-2)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1rem'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--amber)', marginBottom: '0.75rem' }}>
            Today
          </div>
          {todayTasks.map(task => (
            <div key={task.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 0', borderBottom: '0.5px solid var(--border)'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', color: 'var(--text)' }}>{task.title}</div>
                {task.description && <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{task.description}</div>}
              </div>
              <div style={{ fontSize: '10px', fontWeight: '500', color: 'var(--amber)', whiteSpace: 'nowrap' }}>Today</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {urgentTasks.length === 0 && todayTasks.length === 0 && (
        <div style={{
          background: 'var(--bg-2)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--green)', marginBottom: '6px' }}>
            All clear
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
            No urgent tasks. Start by adding your first release.
          </div>
        </div>
      )}

      {/* Week */}
      {weekTasks.length > 0 && (
        <div style={{
          background: 'var(--bg-2)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '1rem'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-2)', marginBottom: '0.75rem' }}>
            This week
          </div>
          {weekTasks.map(task => (
            <div key={task.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 0', borderBottom: '0.5px solid var(--border)'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--border-2)', flexShrink: 0 }}></div>
              <div style={{ flex: 1, fontWeight: '500', color: 'var(--text)' }}>{task.title}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>This week</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
