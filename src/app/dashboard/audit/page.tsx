'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { AuditLog } from '@/types/database'

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  releases:    { bg: 'var(--green-bg)', color: '#4ecca3' },
  contacts:    { bg: 'var(--blue-bg)', color: '#7ab8f5' },
  bookings:    { bg: 'var(--amber-bg)', color: '#f5c842' },
  invoices:    { bg: 'var(--purple-bg)', color: '#b8b4f0' },
  reviews:     { bg: 'var(--pink-bg)', color: '#f48fb1' },
  staff:       { bg: 'var(--orange-bg)', color: '#ff7043' },
  campaigns:   { bg: 'var(--blue-bg)', color: '#7ab8f5' },
  messages:    { bg: 'var(--green-bg)', color: '#4ecca3' },
  automations: { bg: 'var(--amber-bg)', color: '#f5c842' },
}

export default function AuditPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterModule, setFilterModule] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    setLogs(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const modules = [...new Set(logs.map(l => l.module))]

  const filtered = logs.filter(l => {
    const matchSearch = l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.actor_email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      l.module.toLowerCase().includes(search.toLowerCase())
    const matchModule = filterModule === 'all' || l.module === filterModule
    return matchSearch && matchModule
  })

  const inp = (style = {}) => ({
    width: '100%', padding: '8px 12px',
    background: 'var(--bg-4)', border: '0.5px solid var(--border-3)',
    borderRadius: '8px', color: 'var(--text)', fontSize: '12px',
    outline: 'none', ...style
  } as React.CSSProperties)

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Audit log</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{logs.length} events logged</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input placeholder="Search actions..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp({ width: '200px' }) }} />
          <select value={filterModule} onChange={e => setFilterModule(e.target.value)} style={{ ...inp({ width: '140px' }) }}>
            <option value="all">All modules</option>
            {modules.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>Loading audit log...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>No audit events</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Activity will be recorded here automatically.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {['Time', 'Actor', 'Action', 'Module', 'Record', 'Details'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => {
                const mc = MODULE_COLORS[l.module] ?? { bg: 'var(--bg-4)', color: 'var(--text-3)' }
                const isExpanded = expanded === l.id
                return (
                  <tr key={l.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid var(--row-border)' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                    onClick={() => setExpanded(isExpanded ? null : l.id)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                      {new Date(l.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-faint)' }}>{l.actor_email ?? 'System'}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '500', color: 'var(--text)', fontSize: '12px' }}>{l.action}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: mc.bg, color: mc.color }}>
                        {l.module}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-4)', fontFamily: 'monospace' }}>
                      {l.record_id ? `${l.record_type ?? ''}:${l.record_id.slice(0, 8)}` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {(l.old_values || l.new_values) ? (
                        <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{isExpanded ? 'Hide' : 'View'} changes</span>
                      ) : <span style={{ color: 'var(--text-5)', fontSize: '12px' }}>—</span>}
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
