'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Release, Contact } from '@/types/database'

type PromoContact = Contact & { already_sent?: boolean }

export default function BroadcastPage() {
  const supabase = createClient()
  const [releases, setReleases] = useState<Release[]>([])
  const [contacts, setContacts] = useState<PromoContact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRelease, setSelectedRelease] = useState<string>('')
  const [selectedTier, setSelectedTier] = useState<string>('all')
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    const { data: rData } = await supabase
      .from('releases')
      .select('*')
      .order('created_at', { ascending: false })
    setReleases(rData ?? [])

    const { data: cData } = await (supabase as any)
      .from('contacts')
      .select('*')
      .eq('is_on_promo_list', true)
      .order('full_name')
    setContacts(cData ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = contacts.filter(c => {
    const matchSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase())
    const matchTier = selectedTier === 'all' || c.promo_tier === parseInt(selectedTier)
    return matchSearch && matchTier
  })

  function toggleAll() {
    if (selectedContacts.size === filtered.length) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(filtered.map(c => c.id)))
    }
  }

  function toggleContact(id: string) {
    const next = new Set(selectedContacts)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedContacts(next)
  }

  async function sendBroadcast() {
    if (!selectedRelease || selectedContacts.size === 0) return
    setSending(true)
    const release = releases.find(r => r.id === selectedRelease)
    const contactList = contacts.filter(c => selectedContacts.has(c.id))

    for (const c of contactList) {
      const body = message
        .replace('{first_name}', c.full_name.split(' ')[0])
        .replace('{release_title}', release?.title ?? '')
        .replace('{artist_name}', release?.artist_name ?? '')
        .replace('{dropbox_url}', release?.dropbox_folder_url ?? '')
        .replace('{catalogue_number}', release?.catalogue_number ?? '')

      await (supabase as any).from('messages').insert([{
        contact_id: c.id,
        direction: 'outbound',
        channel: 'broadcast',
        body,
        is_read: true,
      }])
    }

    setSending(false)
    setSent(true)
    setTimeout(() => setSent(false), 4000)
    setSelectedContacts(new Set())
  }

  const inp = (style = {}) => ({
    width: '100%', padding: '8px 12px',
    background: 'var(--bg-4)', border: '0.5px solid var(--border-3)',
    borderRadius: '8px', color: 'var(--text)', fontSize: '12px',
    outline: 'none', ...style
  } as React.CSSProperties)

  const lbl = { fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' } as React.CSSProperties

  return (
    <div style={{ padding: '1.5rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '18px', fontWeight: '500' }}>Broadcast</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
          Send bulk messages to your promo list contacts
        </div>
      </div>

      {/* Config */}
      <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border-2)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={lbl}>Release</label>
            <select style={inp()} value={selectedRelease} onChange={e => setSelectedRelease(e.target.value)}>
              <option value="">Select release...</option>
              {releases.map(r => <option key={r.id} value={r.id}>{r.catalogue_number} — {r.title}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Promo tier</label>
            <select style={inp()} value={selectedTier} onChange={e => setSelectedTier(e.target.value)}>
              <option value="all">All tiers</option>
              <option value="1">Tier 1 — First access</option>
              <option value="2">Tier 2 — Standard</option>
              <option value="3">Tier 3 — Extended</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Search contacts</label>
            <input style={inp()} value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or email..." />
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={lbl}>Message template</label>
          <textarea
            style={{ ...inp({ height: '100px', resize: 'none' }) }}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Hey {first_name}, {release_title} by {artist_name} is now available for promo. Grab your copy: {dropbox_url}"
          />
          <div style={{ fontSize: '10px', color: 'var(--text-4)', marginTop: '4px' }}>
            Variables: {'{first_name}'} {'{release_title}'} {'{artist_name}'} {'{dropbox_url}'} {'{catalogue_number}'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
            {selectedContacts.size} of {filtered.length} contacts selected
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {sent && <span style={{ fontSize: '12px', color: '#4ecca3', padding: '8px' }}>Broadcast sent!</span>}
            <button
              onClick={sendBroadcast}
              disabled={sending || !selectedRelease || selectedContacts.size === 0 || !message.trim()}
              style={{
                padding: '8px 20px',
                background: sending || !selectedRelease || selectedContacts.size === 0 ? 'var(--green-dim)' : '#1D9E75',
                border: 'none', borderRadius: '8px', color: 'var(--text)',
                fontSize: '12px', fontWeight: '500', cursor: 'pointer'
              }}
            >
              {sending ? 'Sending...' : `Send to ${selectedContacts.size} contacts`}
            </button>
          </div>
        </div>
      </div>

      {/* Contact list */}
      <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>Loading promo contacts...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>No promo contacts</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Add contacts to the promo list first.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', width: '30px' }}>
                  <input type="checkbox" checked={selectedContacts.size === filtered.length && filtered.length > 0} onChange={toggleAll} style={{ accentColor: '#1D9E75' }} />
                </th>
                {['Contact', 'Type', 'Tier', 'Location', 'Email'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid var(--row-border)' : 'none', transition: 'background 0.1s', background: selectedContacts.has(c.id) ? 'var(--row-selected)' : 'transparent' }}
                  onMouseEnter={e => { if (!selectedContacts.has(c.id)) e.currentTarget.style.background = 'var(--row-hover)' }}
                  onMouseLeave={e => { if (!selectedContacts.has(c.id)) e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <input type="checkbox" checked={selectedContacts.has(c.id)} onChange={() => toggleContact(c.id)} style={{ accentColor: '#1D9E75' }} />
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: '500', color: 'var(--text)', fontSize: '12px' }}>{c.full_name}</td>
                  <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-faint)' }}>{c.type}</td>
                  <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-faint)' }}>Tier {c.promo_tier ?? 1}</td>
                  <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-muted)' }}>{[c.city, c.country_code].filter(Boolean).join(', ') || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-3)' }}>{c.email ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
