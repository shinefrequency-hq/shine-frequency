'use client'

import { useEffect, useState } from 'react'
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

interface Audience {
  name: string
  contactIds: string[]
}

export default function AudiencesPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [contacts, setContacts] = useState<Contact[]>([])
  const [audiences, setAudiences] = useState<Audience[]>([])
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newAudienceName, setNewAudienceName] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [releases, setReleases] = useState<{ id: string; title: string; artist_name: string; catalogue_number: string }[]>([])
  const [showReleaseSelector, setShowReleaseSelector] = useState(false)
  const [sending, setSending] = useState(false)

  const inp = (style = {}) => ({
    width: '100%', padding: '8px 12px',
    background: 'var(--bg-4)', border: '0.5px solid var(--border-3)',
    borderRadius: '8px', color: 'var(--text)', fontSize: '12px',
    outline: 'none', ...style
  } as React.CSSProperties)

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  async function loadAll() {
    setLoading(true)

    const [{ data: contactsData }, { data: tagsData }, { data: releasesData }] = await Promise.all([
      (supabase as any).from('contacts').select('*').order('full_name'),
      (supabase as any).from('contact_tags').select('*'),
      (supabase as any).from('releases').select('id, title, artist_name, catalogue_number').order('release_date', { ascending: false }),
    ])

    setContacts(contactsData ?? [])
    setReleases(releasesData ?? [])

    // Build audiences from tags
    const tagMap = new Map<string, string[]>()
    for (const row of (tagsData ?? [])) {
      const list = tagMap.get(row.tag) ?? []
      list.push(row.contact_id)
      tagMap.set(row.tag, list)
    }
    const built: Audience[] = []
    tagMap.forEach((contactIds, name) => {
      built.push({ name, contactIds })
    })
    built.sort((a, b) => a.name.localeCompare(b.name))
    setAudiences(built)

    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  const selectedAudienceData = audiences.find(a => a.name === selectedAudience)
  const audienceContacts = selectedAudienceData
    ? contacts.filter(c => selectedAudienceData.contactIds.includes(c.id))
    : []

  // Contacts not in this audience, filtered for the add-contact search
  const availableContacts = selectedAudienceData
    ? contacts.filter(c => {
        if (selectedAudienceData.contactIds.includes(c.id)) return false
        const matchSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) ||
          (c.email ?? '').toLowerCase().includes(search.toLowerCase())
        const matchType = filterType === 'all' || c.type === filterType
        return matchSearch && matchType
      })
    : []

  async function createAudience() {
    const name = newAudienceName.trim()
    if (!name) return
    if (audiences.some(a => a.name.toLowerCase() === name.toLowerCase())) {
      toast('Audience already exists', 'error')
      return
    }
    // We create the audience concept by adding at least one tag row later.
    // For now just add it locally and select it.
    setAudiences(prev => [...prev, { name, contactIds: [] }].sort((a, b) => a.name.localeCompare(b.name)))
    setSelectedAudience(name)
    setNewAudienceName('')
    setShowNewForm(false)
    toast(`Audience "${name}" created`)
  }

  async function deleteAudience(name: string) {
    if (!confirm(`Delete audience "${name}"? This removes all tag associations.`)) return
    const { error } = await (supabase as any).from('contact_tags').delete().eq('tag', name)
    if (error) { toast(error.message, 'error'); return }
    if (selectedAudience === name) setSelectedAudience(null)
    toast(`Audience "${name}" deleted`)
    loadAll()
  }

  async function addContactToAudience(contactId: string) {
    if (!selectedAudience) return
    const { error } = await (supabase as any).from('contact_tags').insert([{
      contact_id: contactId,
      tag: selectedAudience,
    }])
    if (error) { toast(error.message, 'error'); return }
    toast('Contact added to audience')
    loadAll()
  }

  async function removeContactFromAudience(contactId: string) {
    if (!selectedAudience) return
    const { error } = await (supabase as any).from('contact_tags').delete()
      .eq('contact_id', contactId)
      .eq('tag', selectedAudience)
    if (error) { toast(error.message, 'error'); return }
    toast('Contact removed from audience')
    loadAll()
  }

  async function quickCreate(label: string, filterFn: (c: Contact) => boolean) {
    const name = label
    const matching = contacts.filter(filterFn)
    if (matching.length === 0) { toast('No matching contacts found', 'info'); return }

    // Delete existing tags for this audience name, then re-insert
    await (supabase as any).from('contact_tags').delete().eq('tag', name)
    const rows = matching.map(c => ({ contact_id: c.id, tag: name }))
    const { error } = await (supabase as any).from('contact_tags').insert(rows)
    if (error) { toast(error.message, 'error'); return }
    toast(`Created "${name}" with ${matching.length} contacts`)
    setSelectedAudience(name)
    loadAll()
  }

  async function sendToRelease(releaseId: string) {
    if (!selectedAudienceData || selectedAudienceData.contactIds.length === 0) {
      toast('No contacts in this audience', 'error')
      return
    }
    setSending(true)
    const rows = selectedAudienceData.contactIds.map(cid => ({
      release_id: releaseId,
      contact_id: cid,
    }))
    const { error } = await (supabase as any).from('promo_lists').upsert(rows, {
      onConflict: 'release_id,contact_id',
      ignoreDuplicates: true,
    })
    setSending(false)
    setShowReleaseSelector(false)
    if (error) { toast(error.message, 'error'); return }
    const rel = releases.find(r => r.id === releaseId)
    toast(`Added ${selectedAudienceData.contactIds.length} contacts to "${rel?.title ?? 'release'}" promo list`)
  }

  if (loading) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '4px' }}>Audiences</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Audiences</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
            Create named groups of contacts for targeted promo distribution
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => quickCreate('All Tier 1', c => c.promo_tier === 1 && c.is_on_promo_list)}
            style={{ padding: '8px 14px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}
          >
            All Tier 1
          </button>
          <button
            onClick={() => quickCreate('All DJs', c => c.type === 'dj')}
            style={{ padding: '8px 14px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}
          >
            All DJs
          </button>
          <button
            onClick={() => quickCreate('All Press', c => c.type === 'press')}
            style={{ padding: '8px 14px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}
          >
            All Press
          </button>
          <button
            onClick={() => { setShowNewForm(!showNewForm); setNewAudienceName('') }}
            style={{
              padding: '8px 16px', background: showNewForm ? 'var(--border-3)' : '#1D9E75',
              border: 'none', borderRadius: '8px', color: 'var(--text)',
              fontSize: '12px', fontWeight: '500', cursor: 'pointer'
            }}
          >
            {showNewForm ? 'Cancel' : '+ New audience'}
          </button>
        </div>
      </div>

      {/* New audience form */}
      {showNewForm && (
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border-2)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Audience name</label>
          <input
            autoFocus
            style={inp({ width: '260px' })}
            value={newAudienceName}
            onChange={e => setNewAudienceName(e.target.value)}
            placeholder="e.g. Berlin DJs, Techno Press..."
            onKeyDown={e => e.key === 'Enter' && createAudience()}
          />
          <button onClick={createAudience} style={{ padding: '8px 16px', background: '#1D9E75', border: 'none', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Create
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
        {[
          { label: 'Audiences', value: audiences.length, color: '#1D9E75' },
          { label: 'Total contacts', value: contacts.length, color: '#7ab8f5' },
          { label: 'Tagged contacts', value: new Set(audiences.flatMap(a => a.contactIds)).size, color: '#b8b4f0' },
          { label: 'Releases', value: releases.length, color: '#f5c842' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '18px', fontWeight: '500', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Main layout: left = audience list, right = members */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedAudience ? '280px 1fr' : '1fr', gap: '1rem' }}>

        {/* Audience list */}
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--border)', fontSize: '11px', fontWeight: '500', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Audiences ({audiences.length})
          </div>
          {audiences.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>No audiences yet</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Create one above or use a quick-create button.</div>
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {audiences.map(a => {
                const isActive = selectedAudience === a.name
                return (
                  <div
                    key={a.name}
                    onClick={() => setSelectedAudience(isActive ? null : a.name)}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      borderBottom: '0.5px solid var(--row-border)',
                      background: isActive ? 'var(--row-selected)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--row-hover)' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: '500', color: isActive ? '#1D9E75' : 'var(--text)' }}>{a.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>{a.contactIds.length} contact{a.contactIds.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: '#0a2a1e', color: '#4ecca3' }}>
                        {a.contactIds.length}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); deleteAudience(a.name) }}
                        style={{ padding: '2px 6px', background: 'transparent', border: '0.5px solid var(--red-muted-border)', borderRadius: '6px', color: 'var(--red-muted)', fontSize: '10px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right panel: audience members */}
        {selectedAudience && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Audience header + actions */}
            <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#1D9E75' }}>{selectedAudience}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{audienceContacts.length} member{audienceContacts.length !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowReleaseSelector(!showReleaseSelector)}
                    disabled={audienceContacts.length === 0}
                    style={{
                      padding: '8px 16px', background: audienceContacts.length === 0 ? 'var(--border-3)' : '#1D9E75',
                      border: 'none', borderRadius: '8px', color: 'var(--text)',
                      fontSize: '12px', fontWeight: '500', cursor: audienceContacts.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: audienceContacts.length === 0 ? 0.5 : 1,
                    }}
                  >
                    Send release to audience
                  </button>
                  {showReleaseSelector && (
                    <div style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: '6px',
                      background: 'var(--bg-2)', border: '0.5px solid var(--border-2)',
                      borderRadius: '10px', padding: '6px', zIndex: 100,
                      minWidth: '300px', maxHeight: '280px', overflowY: 'auto',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    }}>
                      <div style={{ padding: '6px 8px', fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Select release
                      </div>
                      {releases.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', fontSize: '12px', color: 'var(--text-3)' }}>No releases found</div>
                      ) : releases.map(r => (
                        <button
                          key={r.id}
                          onClick={() => sendToRelease(r.id)}
                          disabled={sending}
                          style={{
                            width: '100%', padding: '8px 10px', background: 'transparent',
                            border: 'none', borderRadius: '6px', textAlign: 'left',
                            cursor: 'pointer', color: 'var(--text)', fontSize: '12px',
                            display: 'flex', flexDirection: 'column', gap: '2px',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontWeight: '500' }}>{r.title}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{r.artist_name} / {r.catalogue_number}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Members table */}
            <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--border)', fontSize: '11px', fontWeight: '500', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Members
              </div>
              {audienceContacts.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>No members yet</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Search contacts below to add them.</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '8px 14px', fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Contact</th>
                      <th style={{ textAlign: 'left', padding: '8px 14px', fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Type</th>
                      <th style={{ textAlign: 'left', padding: '8px 14px', fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Location</th>
                      <th style={{ textAlign: 'right', padding: '8px 14px', fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {audienceContacts.map((c, i) => {
                      const tc = TYPE_COLORS[c.type]
                      return (
                        <tr key={c.id} style={{ borderBottom: i < audienceContacts.length - 1 ? '0.5px solid var(--row-border)' : 'none' }}>
                          <td style={{ padding: '8px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '500', color: tc.color, flexShrink: 0 }}>
                                {initials(c.full_name)}
                              </div>
                              <div>
                                <div style={{ fontWeight: '500', color: 'var(--text)', fontSize: '12px' }}>{c.full_name}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{c.email ?? ''}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '8px 14px' }}>
                            <span style={{ padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: tc.bg, color: tc.color }}>{c.type}</span>
                          </td>
                          <td style={{ padding: '8px 14px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            {[c.city, c.country_code].filter(Boolean).join(', ') || '--'}
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                            <button
                              onClick={() => removeContactFromAudience(c.id)}
                              style={{ padding: '3px 8px', background: 'transparent', border: '0.5px solid var(--red-muted-border)', borderRadius: '6px', color: 'var(--red-muted)', fontSize: '10px', cursor: 'pointer' }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Add contacts panel */}
            <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Add contacts
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  placeholder="Search contacts to add..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={inp({ width: '240px' })}
                />
                <select value={filterType} onChange={e => setFilterType(e.target.value)} style={inp({ width: '120px' })}>
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
              </div>
              {(search || filterType !== 'all') && (
                <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {availableContacts.length === 0 ? (
                    <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '12px', color: 'var(--text-3)' }}>
                      {search || filterType !== 'all' ? 'No matching contacts found' : 'Type to search contacts'}
                    </div>
                  ) : availableContacts.slice(0, 50).map(c => {
                    const tc = TYPE_COLORS[c.type]
                    return (
                      <div
                        key={c.id}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '6px 10px', borderRadius: '6px', cursor: 'pointer',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '500', color: tc.color, flexShrink: 0 }}>
                            {initials(c.full_name)}
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)' }}>{c.full_name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{c.type}{c.city ? ` / ${c.city}` : ''}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => addContactToAudience(c.id)}
                          style={{ padding: '3px 10px', background: '#1D9E75', border: 'none', borderRadius: '6px', color: 'var(--text)', fontSize: '10px', fontWeight: '500', cursor: 'pointer' }}
                        >
                          Add
                        </button>
                      </div>
                    )
                  })}
                  {availableContacts.length > 50 && (
                    <div style={{ padding: '6px', textAlign: 'center', fontSize: '11px', color: 'var(--text-3)' }}>
                      Showing 50 of {availableContacts.length} — refine your search
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
