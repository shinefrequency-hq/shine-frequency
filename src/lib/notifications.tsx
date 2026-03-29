'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

interface Notification {
  id: string
  type: 'task' | 'review' | 'invoice'
  text: string
  time: string
  href: string
}

const ICONS: Record<Notification['type'], string> = {
  task: '\u26a0\ufe0f',
  review: '\ud83d\udcdd',
  invoice: '\ud83d\udcb0',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchNotifications() {
      const supabase = createClient()
      const items: Notification[] = []

      // Urgent tasks (not completed, urgency = 'now')
      const { data: tasks } = await (supabase as any)
        .from('tasks')
        .select('id, title, created_at')
        .is('completed_at', null)
        .eq('urgency', 'now')
        .order('created_at', { ascending: false })
        .limit(10)

      if (tasks) {
        for (const t of tasks) {
          items.push({
            id: `task-${t.id}`,
            type: 'task',
            text: `Urgent: ${t.title}`,
            time: t.created_at,
            href: '/dashboard',
          })
        }
      }

      // Pending reviews
      const { data: reviews } = await (supabase as any)
        .from('reviews')
        .select('id, rating, created_at, contacts(full_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10)

      if (reviews) {
        for (const r of reviews) {
          items.push({
            id: `review-${r.id}`,
            type: 'review',
            text: `Review pending: ${r.contacts?.full_name ?? 'Unknown'} (${r.rating}★)`,
            time: r.created_at,
            href: '/dashboard/reviews',
          })
        }
      }

      // Overdue invoices
      const now = new Date().toISOString()
      const { data: overdueInvoices } = await (supabase as any)
        .from('invoices')
        .select('id, invoice_number, due_at, status, created_at')
        .eq('status', 'overdue')
        .order('created_at', { ascending: false })
        .limit(10)

      const { data: pastDueInvoices } = await (supabase as any)
        .from('invoices')
        .select('id, invoice_number, due_at, status, created_at')
        .lt('due_at', now)
        .in('status', ['sent', 'viewed'])
        .order('created_at', { ascending: false })
        .limit(10)

      const invoiceMap = new Map<string, boolean>()
      const allInvoices = [...(overdueInvoices ?? []), ...(pastDueInvoices ?? [])]
      for (const inv of allInvoices) {
        if (!invoiceMap.has(inv.id)) {
          invoiceMap.set(inv.id, true)
          items.push({
            id: `invoice-${inv.id}`,
            type: 'invoice',
            text: `Overdue: ${inv.invoice_number}`,
            time: inv.due_at ?? inv.created_at,
            href: '/dashboard/invoicing',
          })
        }
      }

      // Sort by time desc, limit to 10
      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      setNotifications(items.slice(0, 10))
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 5000)
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const count = notifications.length

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative',
          background: 'transparent',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '6px 10px',
          cursor: 'pointer',
          color: 'var(--text-2)',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          width: '100%',
          justifyContent: 'center',
          transition: 'all 0.1s',
        }}
        aria-label="Notifications"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span style={{ fontSize: '11px' }}>Notifications</span>
        {count > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ef4444',
            color: '#fff',
            fontSize: '9px',
            fontWeight: '600',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'fixed',
          bottom: '60px',
          left: '210px',
          width: '320px',
          background: '#1a1a2e',
          border: '0.5px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          zIndex: 9999,
          overflow: 'hidden',
          maxHeight: '400px',
          overflowY: 'auto',
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 12px',
            borderBottom: '0.5px solid rgba(255,255,255,0.08)',
            fontSize: '12px',
            fontWeight: '600',
            color: '#e2e8f0',
          }}>
            Notifications {count > 0 && `(${count})`}
          </div>

          {/* Items */}
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
                All clear -- nothing urgent
              </div>
            ) : (
              notifications.map(n => (
                <a
                  key={n.id}
                  href={n.href}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '8px 12px',
                    textDecoration: 'none',
                    borderBottom: '0.5px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>
                    {ICONS[n.type]}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: '11px',
                      color: '#e2e8f0',
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {n.text}
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                      {timeAgo(n.time)}
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>

          {/* Footer */}
          <a
            href="/dashboard"
            style={{
              display: 'block',
              padding: '8px 12px',
              textAlign: 'center',
              fontSize: '11px',
              color: 'var(--green, #22c55e)',
              textDecoration: 'none',
              borderTop: '0.5px solid rgba(255,255,255,0.08)',
              fontWeight: '500',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            View all -- Today's Queue
          </a>
        </div>
      )}
    </div>
  )
}
