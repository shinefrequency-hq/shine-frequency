import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { ThemeToggle } from '@/lib/theme'
import { GlobalSearch } from '@/lib/search'
import { NotificationBell } from '@/lib/notifications'
import { NavLink } from '@/lib/nav-link'
import { MobileMenuButton } from '@/lib/mobile-menu'
import type { Staff } from '@/types/database'

const NAV = [
  {
    section: "Sharon's desk",
    items: [
      { label: "Today's queue", href: '/dashboard', badge: 'urgent' },
      { label: 'Automations', href: '/dashboard/automations' },
      { label: 'Social scheduler', href: '/dashboard/social' },
      { label: 'Broadcast', href: '/dashboard/broadcast' },
    ]
  },
  {
    section: 'Distribution',
    items: [
      { label: 'Releases', href: '/dashboard/releases' },
      { label: 'Promo lists', href: '/dashboard/releases/promo' },
      { label: 'Heat tracker', href: '/dashboard/heat' },
      { label: 'Reviews', href: '/dashboard/reviews' },
      { label: 'Downloads', href: '/dashboard/downloads' },
      { label: 'Discovery', href: '/dashboard/scanner' },
      { label: 'Campaigns', href: '/dashboard/campaigns' },
    ]
  },
  {
    section: 'People',
    items: [
      { label: 'Contacts', href: '/dashboard/contacts' },
      { label: 'Audiences', href: '/dashboard/audiences' },
      { label: 'Messages', href: '/dashboard/messages' },
    ]
  },
  {
    section: 'Agency',
    items: [
      { label: 'Bookings', href: '/dashboard/bookings' },
      { label: 'Calendar', href: '/dashboard/calendar' },
      { label: 'Invoicing', href: '/dashboard/invoicing' },
      { label: 'Podcasts', href: '/dashboard/podcasts' },
    ]
  },
  {
    section: 'Admin',
    items: [
      { label: 'Reporting', href: '/dashboard/reporting' },
      { label: 'Staff & roles', href: '/dashboard/staff' },
      { label: 'Audit log', href: '/dashboard/audit' },
      { label: 'ISO 27001', href: '/dashboard/iso' },
      { label: 'Settings', href: '/dashboard/settings' },
      { label: 'Help', href: '/dashboard/help' },
    ]
  },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('auth_user_id', user.id)
    .single() as { data: Staff | null }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg)'
    }}>
      <MobileMenuButton />
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar" style={{
        width: '200px',
        flexShrink: 0,
        background: 'var(--bg-2)',
        borderRight: '0.5px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Logo */}
        <div style={{
          padding: '12px 1rem',
          borderBottom: '0.5px solid var(--border)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <img
            src="/logo.png"
            alt="Shine Music"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0
            }}
          />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', lineHeight: 1.2 }}>
              Shine Frequency
            </div>
            <div style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'var(--text-3)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }}></span>
              Live
            </div>
          </div>
        </div>

        {/* User chip */}
        <div style={{
          margin: '8px',
          padding: '8px 10px',
          background: 'var(--bg-3)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0
        }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: 'var(--green)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: '500', color: '#fff', flexShrink: 0
          }}>
            {staff?.full_name?.[0] ?? user.email?.[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {staff?.full_name ?? 'Owner'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'capitalize' }}>
              {staff?.role ?? 'owner'}
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '0 8px 4px' }}>
          <GlobalSearch />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {NAV.map(group => (
            <div key={group.section}>
              <div style={{
                fontSize: '9px', fontWeight: '500', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--text-3)',
                padding: '8px 1rem 3px'
              }}>
                {group.section}
              </div>
              {group.items.map(item => (
                <NavLink key={item.href} href={item.href} label={item.label} />
              ))}
            </div>
          ))}
        </nav>

        {/* Notifications + Theme + Sign out */}
        <div style={{ padding: '8px', borderTop: '0.5px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <NotificationBell />
          <ThemeToggle />
          <form action="/api/signout" method="post" style={{ width: '100%' }}>
            <button style={{
              width: '100%', padding: '7px', background: 'transparent',
              border: '0.5px solid var(--border)', borderRadius: 'var(--radius)',
              color: 'var(--text-3)', fontSize: '11px', cursor: 'pointer',
              transition: 'all 0.1s'
            }}>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {children}
      </main>

      <style>{`
        .nav-item:hover {
          background: var(--bg-3);
          color: var(--text);
          border-left-color: var(--border-2) !important;
        }
      `}</style>
    </div>
  )
}
