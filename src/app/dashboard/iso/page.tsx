'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type CheckItem = {
  id: string
  category: string
  control: string
  description: string
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable'
  evidence: string
}

const STATUS_COLORS = {
  compliant:      { bg: 'var(--green-bg)', color: '#4ecca3', label: 'Compliant' },
  partial:        { bg: 'var(--amber-bg)', color: '#f5c842', label: 'Partial' },
  non_compliant:  { bg: 'var(--red-bg)', color: '#f08080', label: 'Non-compliant' },
  not_applicable: { bg: 'var(--bg-4)', color: 'var(--text-3)', label: 'N/A' },
}

const CHECKLIST: CheckItem[] = [
  { id: '1', category: 'A.5 — Information security policies', control: 'A.5.1', description: 'Information security policy documented and approved', status: 'compliant', evidence: 'Policy v2.1 approved by Sharon, stored in /policies/infosec-policy.pdf' },
  { id: '2', category: 'A.5 — Information security policies', control: 'A.5.2', description: 'Policy reviewed at planned intervals', status: 'compliant', evidence: 'Last review 2026-01-15, next due 2026-07-15' },
  { id: '3', category: 'A.6 — Organisation of information security', control: 'A.6.1', description: 'Roles and responsibilities defined', status: 'compliant', evidence: 'Staff roles defined in platform with RBAC (owner, senior_manager, distribution_manager etc.)' },
  { id: '4', category: 'A.6 — Organisation of information security', control: 'A.6.2', description: 'Acceptable use policy signed by all staff', status: 'partial', evidence: '3 of 5 staff have signed. 2 pending — follow up required' },
  { id: '5', category: 'A.8 — Asset management', control: 'A.8.1', description: 'Asset inventory maintained', status: 'compliant', evidence: 'All releases tracked in catalogue with Dropbox folder IDs, file sizes, formats' },
  { id: '6', category: 'A.8 — Asset management', control: 'A.8.2', description: 'Acceptable use of assets', status: 'compliant', evidence: 'Promo list access tokens expire, download events logged with IP and user agent' },
  { id: '7', category: 'A.9 — Access control', control: 'A.9.1', description: 'Access control policy', status: 'compliant', evidence: 'Supabase RLS policies enforced on all tables. Role-based access in application layer' },
  { id: '8', category: 'A.9 — Access control', control: 'A.9.2', description: 'User access management', status: 'compliant', evidence: 'Staff accounts managed via platform. Auth via Supabase with email/password' },
  { id: '9', category: 'A.9 — Access control', control: 'A.9.4', description: 'System access restricted', status: 'compliant', evidence: 'Service role key stored in env vars, not committed to repo. Anon key has limited RLS permissions' },
  { id: '10', category: 'A.12 — Operations security', control: 'A.12.4', description: 'Event logging', status: 'compliant', evidence: 'Audit log table captures all CRUD operations with actor, timestamp, old/new values, IP' },
  { id: '11', category: 'A.12 — Operations security', control: 'A.12.6', description: 'Technical vulnerability management', status: 'partial', evidence: 'npm audit run quarterly. Last scan 2026-02-01. 0 critical, 2 moderate — tracked in backlog' },
  { id: '12', category: 'A.13 — Communications security', control: 'A.13.1', description: 'Network security management', status: 'compliant', evidence: 'All traffic over HTTPS. Supabase uses TLS 1.3. Vercel edge network with DDoS protection' },
  { id: '13', category: 'A.14 — System acquisition', control: 'A.14.1', description: 'Security requirements in development', status: 'compliant', evidence: 'TypeScript strict mode, RLS on all tables, input validation at form level, no raw SQL' },
  { id: '14', category: 'A.16 — Incident management', control: 'A.16.1', description: 'Incident management process', status: 'non_compliant', evidence: 'No formal incident response plan documented yet. TODO: draft and approve by Q2 2026' },
  { id: '15', category: 'A.18 — Compliance', control: 'A.18.1', description: 'Compliance with legal requirements', status: 'compliant', evidence: 'GDPR DPA signed with Supabase. Data stored in EU region. Contact consent tracked' },
]

export default function ISOPage() {
  const [items, setItems] = useState<CheckItem[]>(CHECKLIST)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const categories = [...new Set(items.map(i => i.category))]

  const filtered = items.filter(i => {
    const matchStatus = filterStatus === 'all' || i.status === filterStatus
    const matchCategory = filterCategory === 'all' || i.category === filterCategory
    return matchStatus && matchCategory
  })

  const counts = {
    compliant: items.filter(i => i.status === 'compliant').length,
    partial: items.filter(i => i.status === 'partial').length,
    non_compliant: items.filter(i => i.status === 'non_compliant').length,
    not_applicable: items.filter(i => i.status === 'not_applicable').length,
  }

  const complianceRate = items.length > 0
    ? Math.round((counts.compliant / (items.length - counts.not_applicable)) * 100)
    : 0

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
          <div style={{ fontSize: '18px', fontWeight: '500' }}>ISO 27001 Compliance</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
            {items.length} controls assessed · {complianceRate}% compliant
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp({ width: '150px' }) }}>
            <option value="all">All statuses</option>
            <option value="compliant">Compliant</option>
            <option value="partial">Partial</option>
            <option value="non_compliant">Non-compliant</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ ...inp({ width: '260px' }) }}>
            <option value="all">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
        {[
          { label: 'Compliance rate', count: `${complianceRate}%`, color: '#1D9E75' },
          { label: 'Compliant', count: counts.compliant, color: '#4ecca3' },
          { label: 'Partial', count: counts.partial, color: '#f5c842' },
          { label: 'Non-compliant', count: counts.non_compliant, color: '#f08080' },
          { label: 'N/A', count: counts.not_applicable, color: 'var(--text-3)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '18px', fontWeight: '500', color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
              {['Control', 'Description', 'Status', 'Evidence'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => {
              const sc = STATUS_COLORS[item.status]
              return (
                <tr key={item.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid var(--row-border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: '500', color: 'var(--text)', fontSize: '12px', fontFamily: 'monospace' }}>{item.control}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-4)', marginTop: '2px' }}>{item.category.split(' — ')[0]}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-faint)', maxWidth: '300px' }}>{item.description}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-3)', maxWidth: '350px', lineHeight: '1.5' }}>{item.evidence}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
