'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import type { Contact, ContactType } from '@/types/database'

const TYPE_COLORS: Record<ContactType, { bg: string; color: string }> = {
  dj:        { bg: '#1a0a2a', color: '#b8b4f0' },
  producer:  { bg: '#0a1a2a', color: '#7ab8f5' },
  label:     { bg: '#0a2a1e', color: '#4ecca3' },
  venue:     { bg: '#2a1e0a', color: '#f5c842' },
  promoter:  { bg: '#2a1000', color: '#ff7043' },
  press:     { bg: '#1a1a2a', color: '#9e9e9e' },
  artist:    { bg: '#2a0a1a', color: '#f48fb1' },
  industry:  { bg: '#1a1a1a', color: '#777' },
}

const EMPTY: Partial<Contact> = {
  full_name: '',
  email: '',
  phone: '',
  type: 'dj',
  organisation: '',
  city: '',
  country: '',
  country_code: '',
  instagram_handle: '',
  soundcloud_url: '',
  website: '',
  is_on_promo_list: false,
  is_trusted: false,
  is_high_value: false,
  is_sf_artist: false,
  promo_tier: 1,
  notes: '',
}

export default function ContactsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<Contact>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPromo, setFilterPromo] = useState(false)
  const [selected, setSelected] = useState<Contact | null>(null)
  const [sortKey, setSortKey] = useState<string>('full_name')
  const [sortAsc, setSortAsc] = useState(true)
  const [allTags, setAllTags] = useState<Record<string, string[]>>({}) // contact_id -> tag[]

  async function loadTags() {
    const { data } = await (supabase as any).from('contact_tags').select('contact_id, tag')
    const map: Record<string, string[]> = {}
    ;(data ?? []).forEach((t: any) => {
      if (!map[t.contact_id]) map[t.contact_id] = []
      map[t.contact_id].push(t.tag)
    })
    setAllTags(map)
  }

  function toggleSort(key: string) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  async function load() {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('contacts')
      .select('*')
      .order('full_name')
    setContacts(data ?? [])
    setLoading(false)
  }

  async function addTag(contactId: string, tag: string) {
    await (supabase as any).from('contact_tags').insert([{ contact_id: contactId, tag }])
    loadTags()
    toast(`Tagged: ${tag}`)
  }

  async function removeTag(contactId: string, tag: string) {
    await (supabase as any).from('contact_tags').delete().eq('contact_id', contactId).eq('tag', tag)
    loadTags()
    toast('Tag removed')
  }

  useEffect(() => { load(); loadTags() }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && showForm) {
        setShowForm(false)
        setForm(EMPTY)
        setEditId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showForm])

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) { toast('CSV must have header + data rows', 'error'); return }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const row: any = {}
      headers.forEach((h, j) => {
        if (h === 'name' || h === 'full_name') row.full_name = vals[j]
        else if (h === 'email') row.email = vals[j]
        else if (h === 'phone') row.phone = vals[j]
        else if (h === 'type') row.type = vals[j] || 'dj'
        else if (h === 'organisation' || h === 'organization' || h === 'org') row.organisation = vals[j]
        else if (h === 'city') row.city = vals[j]
        else if (h === 'country' || h === 'country_code') row.country_code = vals[j]
      })
      if (row.full_name) {
        if (!row.type) row.type = 'dj'
        rows.push(row)
      }
    }
    if (rows.length === 0) { toast('No valid contacts found in CSV', 'error'); return }
    const { error } = await (supabase as any).from('contacts').insert(rows)
    if (error) { toast(error.message, 'error'); return }
    toast(`Imported ${rows.length} contacts`)
    load()
    if (fileRef.current) fileRef.current.value = ''
  }

  async function save() {
    setSaving(true)
    setError('')
    if (!form.full_name) {
      setError('Name is required')
      setSaving(false)
      return
    }
    if (editId) {
      const { error } = await (supabase as any).from('contacts').update(form).eq('id', editId)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await (supabase as any).from('contacts').insert([form])
      if (error) { setError(error.message); setSaving(false); return }
    }
    toast(editId ? 'Contact updated' : 'Contact added')
    setForm(EMPTY)
    setShowForm(false)
    setEditId(null)
    setSaving(false)
    load()
  }

  async function deleteContact(id: string) {
    if (!confirm('Delete this contact?')) return
    await (supabase as any).from('contacts').delete().eq('id', id)
    toast('Contact deleted')
    if (selected?.id === id) setSelected(null)
    load()
  }

  function editContact(c: Contact) {
    setForm(c)
    setEditId(c.id)
    setShowForm(true)
    setSelected(null)
  }

  const filtered = contacts.filter(c => {
    const matchSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.organisation ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.city ?? '').toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || c.type === filterType
    const matchPromo = !filterPromo || c.is_on_promo_list
    return matchSearch && matchType && matchPromo
  }).sort((a, b) => {
    const av = (a as any)[sortKey] ?? ''
    const bv = (b as any)[sortKey] ?? ''
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return sortAsc ? cmp : -cmp
  })

  const inp = (style = {}) => ({
    width: '100%', padding: '8px 12px',
    background: 'var(--bg-4)', border: '0.5px solid var(--border-3)',
    borderRadius: '8px', color: 'var(--text)', fontSize: '12px',
    outline: 'none', ...style
  } as React.CSSProperties)

  const lbl = { fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' } as React.CSSProperties

  const chk = (checked: boolean, onChange: () => void, label: string) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: checked ? '#4ecca3' : 'var(--text-muted)' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ accentColor: '#1D9E75' }} />
      {label}
    </label>
  )

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const avatarColors: Record<ContactType, string> = {
    dj: '#1a0a2a', producer: '#0a1a2a', label: '#0a2a1e',
    venue: '#2a1e0a', promoter: '#2a1000', press: '#1a1a2a',
    artist: '#2a0a1a', industry: '#1a1a1a'
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Contacts</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{contacts.length} total · {contacts.filter(c => c.is_on_promo_list).length} on promo · Your DJs, press, venues and industry contacts</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input placeholder="Search name, email, city..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp({ width: '220px' }) }} />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...inp({ width: '120px' }) }}>
            <option value="all">All types</option>
            <option value="dj">DJs</option>
            <option value="producer">Producers</option>
            <option value="label">Labels</option>
            <option value="venue">Venues</option>
            <option value="promoter">Promoters</option>
            <option value="press">Press</option>
            <option value="artist">Artists</option>
            <option value="industry">Industry</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: filterPromo ? '#4ecca3' : 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={filterPromo} onChange={() => setFilterPromo(!filterPromo)} style={{ accentColor: '#1D9E75' }} />
            Promo only
          </label>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()} style={{
            padding: '8px 16px', background: 'transparent',
            border: '0.5px solid var(--border-3)', borderRadius: '8px',
            color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer'
          }}>
            Import CSV
          </button>
          <button onClick={() => { setForm(EMPTY); setEditId(null); setSelected(null); setShowForm(!showForm) }} style={{
            padding: '8px 16px', background: showForm ? 'var(--border-3)' : '#1D9E75',
            border: 'none', borderRadius: '8px', color: 'var(--text)',
            fontSize: '12px', fontWeight: '500', cursor: 'pointer'
          }}>
            {showForm ? 'Cancel' : '+ Add contact'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
        {[
          { label: 'DJs', count: contacts.filter(c => c.type === 'dj').length, color: '#b8b4f0' },
          { label: 'Producers', count: contacts.filter(c => c.type === 'producer').length, color: '#7ab8f5' },
          { label: 'Labels', count: contacts.filter(c => c.type === 'label').length, color: '#4ecca3' },
          { label: 'Venues', count: contacts.filter(c => c.type === 'venue').length, color: '#f5c842' },
          { label: 'High value', count: contacts.filter(c => c.is_high_value).length, color: '#1D9E75' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '18px', fontWeight: '500', color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: '1rem' }}>

        {/* Form */}
        {showForm && (
          <div style={{ gridColumn: '1 / -1', background: 'var(--bg-2)', border: '0.5px solid var(--border-2)', borderRadius: '12px', padding: '1.25rem', marginBottom: '0' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '1rem', color: '#1D9E75' }}>
              {editId ? 'Edit contact' : 'New contact'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={lbl}>Full name *</label>
                <input style={inp()} value={form.full_name ?? ''} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="DJ Name" />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input style={inp()} type="email" value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="dj@example.com" />
              </div>
              <div>
                <label style={lbl}>Phone</label>
                <input style={inp()} value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+44..." />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={lbl}>Type</label>
                <select style={inp()} value={form.type ?? 'dj'} onChange={e => setForm(f => ({ ...f, type: e.target.value as ContactType }))}>
                  <option value="dj">DJ</option>
                  <option value="producer">Producer</option>
                  <option value="label">Label</option>
                  <option value="venue">Venue</option>
                  <option value="promoter">Promoter</option>
                  <option value="press">Press</option>
                  <option value="artist">Artist</option>
                  <option value="industry">Industry</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Organisation</label>
                <input style={inp()} value={form.organisation ?? ''} onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))} placeholder="Label / venue name" />
              </div>
              <div>
                <label style={lbl}>City</label>
                <input style={inp()} value={form.city ?? ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Berlin" />
              </div>
              <div>
                <label style={lbl}>Country code</label>
                <input style={inp()} value={form.country_code ?? ''} onChange={e => setForm(f => ({ ...f, country_code: e.target.value.toUpperCase().slice(0,2) }))} placeholder="DE" maxLength={2} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={lbl}>Instagram handle</label>
                <input style={inp()} value={form.instagram_handle ?? ''} onChange={e => setForm(f => ({ ...f, instagram_handle: e.target.value }))} placeholder="@handle" />
              </div>
              <div>
                <label style={lbl}>SoundCloud URL</label>
                <input style={inp()} value={form.soundcloud_url ?? ''} onChange={e => setForm(f => ({ ...f, soundcloud_url: e.target.value }))} placeholder="https://soundcloud.com/..." />
              </div>
              <div>
                <label style={lbl}>Promo tier</label>
                <select style={inp()} value={form.promo_tier ?? 1} onChange={e => setForm(f => ({ ...f, promo_tier: parseInt(e.target.value) }))}>
                  <option value={1}>Tier 1 — First access</option>
                  <option value={2}>Tier 2 — Standard promo</option>
                  <option value={3}>Tier 3 — Extended list</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '12px', flexWrap: 'wrap' }}>
              {chk(form.is_on_promo_list ?? false, () => setForm(f => ({ ...f, is_on_promo_list: !f.is_on_promo_list })), 'On promo list')}
              {chk(form.is_trusted ?? false, () => setForm(f => ({ ...f, is_trusted: !f.is_trusted })), 'Trusted')}
              {chk(form.is_high_value ?? false, () => setForm(f => ({ ...f, is_high_value: !f.is_high_value })), 'High value')}
              {chk(form.is_sf_artist ?? false, () => setForm(f => ({ ...f, is_sf_artist: !f.is_sf_artist })), 'SF artist')}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Notes</label>
              <textarea style={{ ...inp({ height: '64px', resize: 'none' }) }} value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Private notes..." />
            </div>
            {error && <div style={{ padding: '8px 12px', background: 'var(--red-bg)', border: '0.5px solid var(--red-border)', borderRadius: '8px', fontSize: '12px', color: '#f08080', marginBottom: '12px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={save} disabled={saving} style={{ padding: '8px 20px', background: saving ? 'var(--green-dim)' : '#1D9E75', border: 'none', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                {saving ? 'Saving...' : editId ? 'Update contact' : 'Add contact'}
              </button>
              <button onClick={() => { setShowForm(false); setForm(EMPTY); setEditId(null) }} style={{ padding: '8px 16px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Contact list */}
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>Loading contacts...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>No contacts yet</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Click "Add contact" to build your network.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                  {[
                    { label: 'Contact', key: 'full_name' },
                    { label: 'Type', key: 'type' },
                    { label: 'Location', key: 'city' },
                    { label: 'Tags', key: '' },
                    { label: 'Downloads', key: 'total_downloads' },
                    { label: 'Last active', key: 'last_active_at' },
                    { label: '', key: '' },
                  ].map(h => (
                    <th key={h.label} onClick={() => h.key && toggleSort(h.key)} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', cursor: h.key ? 'pointer' : 'default', userSelect: 'none' }}>
                      {h.label}{sortKey === h.key ? (sortAsc ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const tc = TYPE_COLORS[c.type]
                  const isSelected = selected?.id === c.id
                  return (
                    <tr key={c.id}
                      style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid var(--row-border)' : 'none', cursor: 'pointer', background: isSelected ? 'var(--row-selected)' : 'transparent', transition: 'background 0.1s' }}
                      onClick={() => setSelected(isSelected ? null : c)}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--row-hover)' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: avatarColors[c.type], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '500', color: tc.color, flexShrink: 0 }}>
                            {initials(c.full_name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500', color: 'var(--text)', fontSize: '12px' }}>{c.full_name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{c.email ?? '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: tc.bg, color: tc.color }}>
                          {c.type}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {[c.city, c.country_code].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {c.is_on_promo_list && <span style={{ padding: '1px 6px', borderRadius: '10px', fontSize: '9px', fontWeight: '500', background: '#0a2a1e', color: '#4ecca3' }}>Promo</span>}
                          {c.is_high_value && <span style={{ padding: '1px 6px', borderRadius: '10px', fontSize: '9px', fontWeight: '500', background: '#0a2a1e', color: '#1D9E75' }}>High value</span>}
                          {c.is_trusted && <span style={{ padding: '1px 6px', borderRadius: '10px', fontSize: '9px', fontWeight: '500', background: '#1a1a2a', color: '#b8b4f0' }}>Trusted</span>}
                          {c.is_sf_artist && <span style={{ padding: '1px 6px', borderRadius: '10px', fontSize: '9px', fontWeight: '500', background: '#2a0a1a', color: '#f48fb1' }}>SF artist</span>}
                          {(allTags[c.id] || []).map(tag => (
                            <span key={tag} onClick={(e) => { e.stopPropagation(); removeTag(c.id, tag) }} style={{ padding: '1px 6px', borderRadius: '10px', fontSize: '9px', fontWeight: '500', background: '#1a1a2a', color: '#7ab8f5', cursor: 'pointer' }} title="Click to remove">{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>{c.total_downloads}</td>
                      <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-3)' }}>
                        {c.last_active_at ? new Date(c.last_active_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: '5px' }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => editContact(c)} style={{ padding: '3px 8px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '6px', color: 'var(--text-faint)', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => deleteContact(c.id)} style={{ padding: '3px 8px', background: 'transparent', border: '0.5px solid var(--red-muted-border)', borderRadius: '6px', color: 'var(--red-muted)', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Profile panel */}
        {selected && (
          <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', padding: '1.25rem', alignSelf: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: avatarColors[selected.type], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '500', color: TYPE_COLORS[selected.type].color }}>
                  {initials(selected.full_name)}
                </div>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>{selected.full_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '1px' }}>{selected.type} {selected.organisation ? `· ${selected.organisation}` : ''}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: '16px', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
              {[
                { label: 'Downloads', value: selected.total_downloads },
                { label: 'Reviews', value: selected.total_reviews },
                { label: 'Avg rating', value: selected.avg_rating ? `${selected.avg_rating}★` : '—' },
                { label: 'Response', value: selected.response_rate ? `${selected.response_rate}%` : '—' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-4)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '3px' }}>{s.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginBottom: '1rem' }}>
              {selected.email && <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: 'var(--text-3)', width: '80px' }}>Email</span><span style={{ color: '#7ab8f5' }}>{selected.email}</span></div>}
              {selected.phone && <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: 'var(--text-3)', width: '80px' }}>Phone</span><span>{selected.phone}</span></div>}
              {selected.city && <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: 'var(--text-3)', width: '80px' }}>Location</span><span>{[selected.city, selected.country_code].filter(Boolean).join(', ')}</span></div>}
              {selected.instagram_handle && <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: 'var(--text-3)', width: '80px' }}>Instagram</span><span style={{ color: '#f48fb1' }}>{selected.instagram_handle}</span></div>}
              {selected.soundcloud_url && <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: 'var(--text-3)', width: '80px' }}>SoundCloud</span><a href={selected.soundcloud_url} target="_blank" rel="noreferrer" style={{ color: '#ff7043' }}>Link</a></div>}
              {selected.notes && <div style={{ marginTop: '4px', padding: '8px', background: 'var(--bg-4)', borderRadius: '6px', color: 'var(--text-faint)', fontSize: '11px', lineHeight: '1.5' }}>{selected.notes}</div>}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '6px' }}>Tags</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {(allTags[selected.id] || []).map(tag => (
                  <span key={tag} style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', background: '#1a1a2a', color: '#7ab8f5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {tag}
                    <button onClick={() => removeTag(selected.id, tag)} style={{ background: 'none', border: 'none', color: '#7ab8f5', cursor: 'pointer', fontSize: '12px', padding: 0 }}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {['Tier 1 DJ', 'Key Press', 'Berlin', 'London', 'Resident', 'Festival', 'Radio'].filter(t => !(allTags[selected.id] || []).includes(t)).map(tag => (
                  <button key={tag} onClick={() => addTag(selected.id, tag)} style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '9px', background: 'transparent', border: '0.5px solid var(--border-3)', color: 'var(--text-3)', cursor: 'pointer' }}>+ {tag}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button onClick={() => editContact(selected)} style={{ padding: '8px', background: '#1D9E75', border: 'none', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Edit contact</button>
              <button style={{ padding: '8px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-faint)', fontSize: '12px', cursor: 'pointer' }}>Send message</button>
              <button style={{ padding: '8px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-faint)', fontSize: '12px', cursor: 'pointer' }}>Add to promo list</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
