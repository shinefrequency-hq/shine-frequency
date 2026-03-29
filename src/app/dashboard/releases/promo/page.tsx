'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import { useSearchParams } from 'next/navigation'
import type { Release, Contact, PromoList } from '@/types/database'

type PromoRow = PromoList & {
  contact_name?: string
  contact_email?: string
  contact_type?: string
}

export default function PromoListPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const releaseIdParam = searchParams.get('release')

  const [releases, setReleases] = useState<Release[]>([])
  const [selectedRelease, setSelectedRelease] = useState<string>(releaseIdParam ?? '')
  const [promoList, setPromoList] = useState<PromoRow[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [filterTier, setFilterTier] = useState<string>('all')
  const [search, setSearch] = useState('')

  async function loadReleases() {
    const { data } = await (supabase as any).from('releases').select('*').order('created_at', { ascending: false })
    setReleases(data ?? [])
    if (!selectedRelease && data && data.length > 0) {
      setSelectedRelease(data[0].id)
    }
  }

  async function loadPromoList() {
    if (!selectedRelease) return
    setLoading(true)
    const { data } = await (supabase as any)
      .from('promo_lists')
      .select('*, contacts(full_name, email, type)')
      .eq('release_id', selectedRelease)
      .order('invited_at', { ascending: false })
    const rows: PromoRow[] = (data ?? []).map((p: any) => ({
      ...p,
      contact_name: p.contacts?.full_name,
      contact_email: p.contacts?.email,
      contact_type: p.contacts?.type,
    }))
    setPromoList(rows)
    setLoading(false)
  }

  async function loadContacts() {
    const { data } = await (supabase as any)
      .from('contacts')
      .select('*')
      .eq('is_on_promo_list', true)
      .order('full_name')
    setContacts(data ?? [])
  }

  useEffect(() => { loadReleases(); loadContacts() }, [])
  useEffect(() => { if (selectedRelease) loadPromoList() }, [selectedRelease])

  async function addToPromo() {
    if (selectedContacts.size === 0 || !selectedRelease) return
    setAdding(true)
    const rows = [...selectedContacts].map(contactId => ({
      release_id: selectedRelease,
      contact_id: contactId,
    }))
    await (supabase as any).from('promo_lists').upsert(rows, { onConflict: 'release_id,contact_id' })
    toast(`Added ${selectedContacts.size} contacts to promo list`)
    setAdding(false)
    setShowAddPanel(false)
    setSelectedContacts(new Set())
    loadPromoList()
  }

  async function removeFromPromo(id: string) {
    if (!confirm('Remove from promo list?')) return
    await (supabase as any).from('promo_lists').delete().eq('id', id)
    toast('Removed from promo list')
    loadPromoList()
  }

  const existingContactIds = new Set(promoList.map(p => p.contact_id))
  const availableContacts = contacts.filter(c => {
    if (existingContactIds.has(c.id)) return false
    const matchSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase())
    const matchTier = filterTier === 'all' || c.promo_tier === parseInt(filterTier)
    return matchSearch && matchTier
  })

  function toggleContact(id: string) {
    const next = new Set(selectedContacts)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedContacts(next)
  }

  const release = releases.find(r => r.id === selectedRelease)
  const downloadedCount = promoList.filter(p => p.downloaded_at).length
  const reviewedCount = promoList.filter(p => p.reviewed_at).length
  const dlRate = promoList.length > 0 ? Math.round((downloadedCount / promoList.length) * 100) : 0
  const rvRate = promoList.length > 0 ? Math.round((reviewedCount / promoList.length) * 100) : 0

  const inp = (style = {}) => ({
    width: '100%', padding: '8px 12px',
    background: 'var(--bg-4)', border: '0.5px solid var(--border-3)',
    borderRadius: '8px', color: 'var(--text)', fontSize: '12px',
    outline: 'none', ...style
  } as React.CSSProperties)

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1100px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Promo list</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
            Manage who receives promo access for each release
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select style={{ ...inp({ width: '280px' }) }} value={selectedRelease} onChange={e => setSelectedRelease(e.target.value)}>
            <option value="">Select release...</option>
            {releases.map(r => <option key={r.id} value={r.id}>{r.catalogue_number} — {r.title}</option>)}
          </select>
          <button onClick={() => setShowAddPanel(!showAddPanel)} style={{
            padding: '8px 16px', background: showAddPanel ? 'var(--border-3)' : '#1D9E75',
            border: 'none', borderRadius: '8px', color: 'var(--text)',
            fontSize: '12px', fontWeight: '500', cursor: 'pointer'
          }}>
            {showAddPanel ? 'Cancel' : '+ Add contacts'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {selectedRelease && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
          {[
            { label: 'On promo list', value: promoList.length, color: '#7ab8f5' },
            { label: 'Downloaded', value: `${downloadedCount} (${dlRate}%)`, color: '#f5c842' },
            { label: 'Reviewed', value: `${reviewedCount} (${rvRate}%)`, color: '#4ecca3' },
            { label: 'Release', value: release?.catalogue_number ?? '—', color: 'var(--text)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add panel */}
      {showAddPanel && (
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border-2)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp({ width: '220px' }) }} />
            <select value={filterTier} onChange={e => setFilterTier(e.target.value)} style={{ ...inp({ width: '140px' }) }}>
              <option value="all">All tiers</option>
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
            </select>
            <button onClick={addToPromo} disabled={adding || selectedContacts.size === 0} style={{
              padding: '8px 16px', background: adding || selectedContacts.size === 0 ? 'var(--green-dim)' : '#1D9E75',
              border: 'none', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', fontWeight: '500', cursor: 'pointer'
            }}>
              {adding ? 'Adding...' : `Add ${selectedContacts.size} contacts`}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            {[1, 2, 3].map(tier => {
              const tierContacts = availableContacts.filter(c => (c.promo_tier ?? 1) === tier)
              return (
                <button key={tier} onClick={() => {
                  const next = new Set(selectedContacts)
                  tierContacts.forEach(c => next.add(c.id))
                  setSelectedContacts(next)
                }} style={{
                  padding: '5px 12px', background: 'transparent',
                  border: '0.5px solid var(--border-3)', borderRadius: '6px',
                  color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer'
                }}>
                  Select Tier {tier} ({tierContacts.length})
                </button>
              )
            })}
            <button onClick={() => {
              const next = new Set(selectedContacts)
              availableContacts.forEach(c => next.add(c.id))
              setSelectedContacts(next)
            }} style={{
              padding: '5px 12px', background: 'transparent',
              border: '0.5px solid var(--border-3)', borderRadius: '6px',
              color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer'
            }}>
              Select all ({availableContacts.length})
            </button>
            {selectedContacts.size > 0 && (
              <button onClick={() => setSelectedContacts(new Set())} style={{
                padding: '5px 12px', background: 'transparent',
                border: '0.5px solid var(--red-muted-border)', borderRadius: '6px',
                color: 'var(--red-muted)', fontSize: '11px', cursor: 'pointer'
              }}>
                Clear
              </button>
            )}
          </div>
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {availableContacts.map(c => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '0.5px solid var(--row-border)', cursor: 'pointer', fontSize: '12px' }}>
                <input type="checkbox" checked={selectedContacts.has(c.id)} onChange={() => toggleContact(c.id)} style={{ accentColor: '#1D9E75' }} />
                <span style={{ fontWeight: '500', color: 'var(--text)' }}>{c.full_name}</span>
                <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>{c.type} · Tier {c.promo_tier ?? 1}</span>
                <span style={{ color: 'var(--text-3)', fontSize: '11px', marginLeft: 'auto' }}>{c.email ?? ''}</span>
              </label>
            ))}
            {availableContacts.length === 0 && (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>All promo contacts already added</div>
            )}
          </div>
        </div>
      )}

      {/* Promo list table */}
      <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {!selectedRelease ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>Select a release above</div>
        ) : loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>Loading...</div>
        ) : promoList.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>No promo contacts</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Click "Add contacts" to assign promo recipients.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {['Contact', 'Type', 'Invited', 'Downloaded', 'Reviewed', 'Downloads', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promoList.map((p, i) => (
                <tr key={p.id}
                  style={{ borderBottom: i < promoList.length - 1 ? '0.5px solid var(--row-border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: '500', color: 'var(--text)', fontSize: '12px' }}>{p.contact_name ?? '—'}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{p.contact_email ?? ''}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-faint)' }}>{p.contact_type ?? ''}</td>
                  <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-3)' }}>
                    {new Date(p.invited_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {p.downloaded_at ? (
                      <span style={{ padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: 'var(--green-bg)', color: '#4ecca3' }}>
                        {new Date(p.downloaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    ) : <span style={{ color: 'var(--text-5)', fontSize: '12px' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {p.reviewed_at ? (
                      <span style={{ padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: 'var(--blue-bg)', color: '#7ab8f5' }}>
                        {new Date(p.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    ) : <span style={{ color: 'var(--text-5)', fontSize: '12px' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-faint)' }}>{p.download_count}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => removeFromPromo(p.id)} style={{ padding: '3px 8px', background: 'transparent', border: '0.5px solid var(--red-muted-border)', borderRadius: '6px', color: 'var(--red-muted)', fontSize: '11px', cursor: 'pointer' }}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
