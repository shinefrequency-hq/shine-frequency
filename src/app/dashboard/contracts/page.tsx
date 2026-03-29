'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/lib/toast'

type DocType = 'Contract' | 'Template' | 'NDA' | 'Rider' | 'Invoice' | 'Other'
type DocCategory = 'Booking' | 'Distribution' | 'Artist' | 'General'
type DocStatus = 'Draft' | 'Sent' | 'Signed' | 'Expired' | 'Archived'

interface Document {
  id?: string
  name: string
  type: DocType
  category: DocCategory
  description: string
  dropbox_url: string
  artist_id: string | null
  status: DocStatus
  signed_date: string | null
  expires_date: string | null
  tags: string[]
  created_at?: string
}

const EMPTY: Document = {
  name: '',
  type: 'Contract',
  category: 'General',
  description: '',
  dropbox_url: '',
  artist_id: null,
  status: 'Draft',
  signed_date: null,
  expires_date: null,
  tags: [],
}

const DOC_TYPES: DocType[] = ['Contract', 'Template', 'NDA', 'Rider', 'Invoice', 'Other']
const DOC_CATEGORIES: DocCategory[] = ['Booking', 'Distribution', 'Artist', 'General']
const DOC_STATUSES: DocStatus[] = ['Draft', 'Sent', 'Signed', 'Expired', 'Archived']

const FILTER_TABS = ['All', 'Templates', 'Drafts', 'Sent', 'Signed', 'Expired'] as const

const STATUS_COLORS: Record<DocStatus, { bg: string; color: string }> = {
  Draft:    { bg: '#1a1a1a', color: '#777' },
  Sent:     { bg: '#0a1a2a', color: '#7ab8f5' },
  Signed:   { bg: '#0a2a1e', color: '#4ecca3' },
  Expired:  { bg: '#2a0a0a', color: '#f08080' },
  Archived: { bg: '#1a1a1a', color: '#555' },
}

const PAGE_SIZE = 25

export default function ContractsPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [docs, setDocs] = useState<(Document & { artist_name?: string })[]>([])
  const [artists, setArtists] = useState<{ id: string; stage_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Document>({ ...EMPTY })
  const [tagsInput, setTagsInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<typeof FILTER_TABS[number]>('All')
  const [selected, setSelected] = useState<(Document & { artist_name?: string }) | null>(null)
  const [sortKey, setSortKey] = useState<string>('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(0)

  function toggleSort(key: string) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  async function load() {
    setLoading(true)
    const { data: dData } = await (supabase as any)
      .from('documents')
      .select('*, artists(stage_name)')
      .order('created_at', { ascending: false })
    const rows = (dData ?? []).map((d: any) => ({
      ...d,
      tags: d.tags ?? [],
      artist_name: d.artists?.stage_name ?? '',
    }))
    setDocs(rows)

    const { data: aData } = await (supabase as any)
      .from('artists')
      .select('id, stage_name')
      .order('stage_name')
    setArtists(aData ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (showForm) setShowForm(false)
        else if (selected) setSelected(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showForm, selected])

  function openNew() {
    setForm({ ...EMPTY })
    setTagsInput('')
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(doc: Document & { artist_name?: string }) {
    setForm({ ...doc })
    setTagsInput((doc.tags ?? []).join(', '))
    setEditId(doc.id ?? null)
    setShowForm(true)
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    const payload = {
      name: form.name,
      type: form.type,
      category: form.category,
      description: form.description,
      dropbox_url: form.dropbox_url || null,
      artist_id: form.artist_id || null,
      status: form.status,
      signed_date: form.status === 'Signed' ? form.signed_date : null,
      expires_date: form.expires_date || null,
      tags,
    }
    if (editId) {
      const { error } = await (supabase as any).from('documents').update(payload).eq('id', editId)
      if (error) toast(error.message, 'error')
      else toast('Document updated')
    } else {
      const { error } = await (supabase as any).from('documents').insert(payload)
      if (error) toast(error.message, 'error')
      else toast('Document created')
    }
    setSaving(false)
    setShowForm(false)
    load()
  }

  async function deleteDoc(id: string) {
    if (!confirm('Delete this document?')) return
    const { error } = await (supabase as any).from('documents').delete().eq('id', id)
    if (error) toast(error.message, 'error')
    else { toast('Document deleted'); setSelected(null) }
    load()
  }

  // Filtering
  let filtered = docs
  if (activeTab === 'Templates') filtered = filtered.filter(d => d.type === 'Template')
  else if (activeTab === 'Drafts') filtered = filtered.filter(d => d.status === 'Draft')
  else if (activeTab === 'Sent') filtered = filtered.filter(d => d.status === 'Sent')
  else if (activeTab === 'Signed') filtered = filtered.filter(d => d.status === 'Signed')
  else if (activeTab === 'Expired') filtered = filtered.filter(d => d.status === 'Expired')

  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      (d.artist_name ?? '').toLowerCase().includes(q) ||
      (d.tags ?? []).some(t => t.toLowerCase().includes(q))
    )
  }

  // Sort
  filtered = [...filtered].sort((a: any, b: any) => {
    const av = a[sortKey] ?? ''
    const bv = b[sortKey] ?? ''
    const cmp = String(av).localeCompare(String(bv))
    return sortAsc ? cmp : -cmp
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', background: 'var(--bg-3)',
    border: '0.5px solid var(--border)', borderRadius: 'var(--radius)',
    color: 'var(--text)', fontSize: '12px', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '10px', fontWeight: '500', color: 'var(--text-3)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px',
  }

  const thStyle = (key: string): React.CSSProperties => ({
    padding: '8px 10px', textAlign: 'left', fontSize: '10px', fontWeight: '500',
    color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: '0.5px solid var(--border)', cursor: 'pointer', userSelect: 'none',
    whiteSpace: 'nowrap',
  })

  return (
    <div style={{ padding: '1.5rem', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
            Contracts &amp; Documents
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
            Templates, signed contracts, and secure document storage
          </p>
        </div>
        <button onClick={openNew} style={{
          padding: '8px 16px', background: 'var(--green)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius)', fontSize: '12px',
          fontWeight: '500', cursor: 'pointer',
        }}>
          + New document
        </button>
      </div>

      {/* Filter tabs + search */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {FILTER_TABS.map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setPage(0) }} style={{
            padding: '5px 12px', fontSize: '11px', fontWeight: '500',
            border: '0.5px solid var(--border)', borderRadius: '20px',
            background: activeTab === tab ? 'var(--bg-3)' : 'transparent',
            color: activeTab === tab ? 'var(--text)' : 'var(--text-3)',
            cursor: 'pointer',
          }}>
            {tab}
          </button>
        ))}
        <input
          placeholder="Search documents..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          style={{
            ...inputStyle, width: '200px', marginLeft: 'auto',
          }}
        />
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', gap: '0', flex: 1, minHeight: 0 }}>
        {/* Table */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>Loading...</div>
          ) : paged.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>No documents found</div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {[
                      { key: 'name', label: 'Name' },
                      { key: 'type', label: 'Type' },
                      { key: 'category', label: 'Category' },
                      { key: 'status', label: 'Status' },
                      { key: 'artist_name', label: 'Related Artist' },
                      { key: 'signed_date', label: 'Signed' },
                      { key: 'expires_date', label: 'Expires' },
                    ].map(col => (
                      <th key={col.key} onClick={() => toggleSort(col.key)} style={thStyle(col.key)}>
                        {col.label} {sortKey === col.key ? (sortAsc ? '↑' : '↓') : ''}
                      </th>
                    ))}
                    <th style={{ ...thStyle(''), cursor: 'default' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(doc => {
                    const sc = STATUS_COLORS[doc.status as DocStatus] ?? STATUS_COLORS.Draft
                    return (
                      <tr
                        key={doc.id}
                        onClick={() => setSelected(doc)}
                        style={{
                          cursor: 'pointer',
                          borderBottom: '0.5px solid var(--row-border)',
                          background: selected?.id === doc.id ? 'var(--row-selected)' : 'transparent',
                        }}
                        onMouseEnter={e => { if (selected?.id !== doc.id) (e.currentTarget.style.background = 'var(--row-hover)') }}
                        onMouseLeave={e => { if (selected?.id !== doc.id) (e.currentTarget.style.background = 'transparent') }}
                      >
                        <td style={{ padding: '8px 10px', fontSize: '12px', color: 'var(--text)', fontWeight: '500' }}>{doc.name}</td>
                        <td style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-2)' }}>{doc.type}</td>
                        <td style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-2)' }}>{doc.category}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '500',
                            background: sc.bg, color: sc.color,
                          }}>
                            {doc.status}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-2)' }}>{doc.artist_name || '-'}</td>
                        <td style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-2)' }}>{doc.signed_date || '-'}</td>
                        <td style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-2)' }}>{doc.expires_date || '-'}</td>
                        <td style={{ padding: '8px 10px' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => openEdit(doc)} style={{
                              padding: '3px 8px', fontSize: '10px', background: 'var(--bg-3)',
                              border: '0.5px solid var(--border)', borderRadius: 'var(--radius)',
                              color: 'var(--text-2)', cursor: 'pointer',
                            }}>Edit</button>
                            {doc.dropbox_url && (
                              <a href={doc.dropbox_url} target="_blank" rel="noopener noreferrer" style={{
                                padding: '3px 8px', fontSize: '10px', background: 'var(--blue-bg)',
                                border: '0.5px solid var(--blue-border)', borderRadius: 'var(--radius)',
                                color: 'var(--blue-text)', cursor: 'pointer', textDecoration: 'none',
                              }}>Dropbox</a>
                            )}
                            <button onClick={() => doc.id && deleteDoc(doc.id)} style={{
                              padding: '3px 8px', fontSize: '10px', background: 'var(--red-bg)',
                              border: '0.5px solid var(--red-border)', borderRadius: 'var(--radius)',
                              color: 'var(--red-text)', cursor: 'pointer',
                            }}>Del</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px 0', alignItems: 'center' }}>
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    style={{
                      padding: '4px 10px', fontSize: '11px', background: 'var(--bg-3)',
                      border: '0.5px solid var(--border)', borderRadius: 'var(--radius)',
                      color: 'var(--text-2)', cursor: page === 0 ? 'default' : 'pointer',
                      opacity: page === 0 ? 0.4 : 1,
                    }}
                  >Prev</button>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    style={{
                      padding: '4px 10px', fontSize: '11px', background: 'var(--bg-3)',
                      border: '0.5px solid var(--border)', borderRadius: 'var(--radius)',
                      color: 'var(--text-2)', cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                      opacity: page >= totalPages - 1 ? 0.4 : 1,
                    }}
                  >Next</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail panel */}
        {selected && !showForm && (
          <div style={{
            width: '340px', flexShrink: 0, borderLeft: '0.5px solid var(--border)',
            background: 'var(--bg-2)', padding: '1rem', overflowY: 'auto',
            marginLeft: '0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>{selected.name}</h3>
              <button onClick={() => setSelected(null)} style={{
                background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '16px',
              }}>x</button>
            </div>
            {[
              { label: 'Type', value: selected.type },
              { label: 'Category', value: selected.category },
              { label: 'Status', value: selected.status },
              { label: 'Related Artist', value: selected.artist_name || '-' },
              { label: 'Description', value: selected.description || '-' },
              { label: 'Signed Date', value: selected.signed_date || '-' },
              { label: 'Expires Date', value: selected.expires_date || '-' },
              { label: 'Tags', value: (selected.tags ?? []).join(', ') || '-' },
            ].map(row => (
              <div key={row.label} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '9px', fontWeight: '500', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{row.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>{row.value}</div>
              </div>
            ))}
            {selected.dropbox_url && (
              <a href={selected.dropbox_url} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-block', padding: '6px 14px', fontSize: '11px', fontWeight: '500',
                background: 'var(--blue-bg)', border: '0.5px solid var(--blue-border)',
                borderRadius: 'var(--radius)', color: 'var(--blue-text)', textDecoration: 'none',
                marginBottom: '10px',
              }}>
                Open in Dropbox
              </a>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={() => openEdit(selected)} style={{
                padding: '6px 14px', fontSize: '11px', fontWeight: '500',
                background: 'var(--bg-3)', border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius)', color: 'var(--text-2)', cursor: 'pointer',
              }}>Edit</button>
              <button onClick={() => selected.id && deleteDoc(selected.id)} style={{
                padding: '6px 14px', fontSize: '11px', fontWeight: '500',
                background: 'var(--red-bg)', border: '0.5px solid var(--red-border)',
                borderRadius: 'var(--radius)', color: 'var(--red-text)', cursor: 'pointer',
              }}>Delete</button>
            </div>
          </div>
        )}
      </div>

      {/* Form overlay */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-2)', border: '0.5px solid var(--border)',
            borderRadius: '12px', padding: '1.5rem', width: '480px', maxHeight: '85vh',
            overflowY: 'auto',
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)', marginBottom: '1rem' }}>
              {editId ? 'Edit document' : 'New document'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Name */}
              <div>
                <div style={labelStyle}>Name</div>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Document name" />
              </div>

              {/* Type + Category row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={labelStyle}>Type</div>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as DocType })} style={inputStyle}>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>Category</div>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as DocCategory })} style={inputStyle}>
                    {DOC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <div style={labelStyle}>Description</div>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} placeholder="Optional description" />
              </div>

              {/* Dropbox URL */}
              <div>
                <div style={labelStyle}>Dropbox URL</div>
                <input value={form.dropbox_url} onChange={e => setForm({ ...form, dropbox_url: e.target.value })} style={inputStyle} placeholder="https://dropbox.com/..." />
              </div>

              {/* Artist + Status row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={labelStyle}>Related Artist</div>
                  <select value={form.artist_id ?? ''} onChange={e => setForm({ ...form, artist_id: e.target.value || null })} style={inputStyle}>
                    <option value="">None</option>
                    {artists.map(a => <option key={a.id} value={a.id}>{a.stage_name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>Status</div>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as DocStatus })} style={inputStyle}>
                    {DOC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Signed date (conditional) */}
              {form.status === 'Signed' && (
                <div>
                  <div style={labelStyle}>Signed Date</div>
                  <input type="date" value={form.signed_date ?? ''} onChange={e => setForm({ ...form, signed_date: e.target.value })} style={inputStyle} />
                </div>
              )}

              {/* Expires date */}
              <div>
                <div style={labelStyle}>Expires Date</div>
                <input type="date" value={form.expires_date ?? ''} onChange={e => setForm({ ...form, expires_date: e.target.value })} style={inputStyle} />
              </div>

              {/* Tags */}
              <div>
                <div style={labelStyle}>Tags (comma-separated)</div>
                <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} style={inputStyle} placeholder="e.g. techno, booking, 2026" />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.5rem' }}>
              <button onClick={() => setShowForm(false)} style={{
                padding: '8px 16px', fontSize: '12px', background: 'transparent',
                border: '0.5px solid var(--border)', borderRadius: 'var(--radius)',
                color: 'var(--text-3)', cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{
                padding: '8px 16px', fontSize: '12px', fontWeight: '500',
                background: 'var(--green)', color: '#fff', border: 'none',
                borderRadius: 'var(--radius)', cursor: 'pointer',
                opacity: saving ? 0.6 : 1,
              }}>{saving ? 'Saving...' : editId ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
