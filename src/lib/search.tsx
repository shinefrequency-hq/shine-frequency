'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface SearchResult {
  label: string
  sub?: string
}

interface SearchGroup {
  type: string
  href: string
  results: SearchResult[]
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<SearchGroup[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cmd+K / Ctrl+K to focus
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setGroups([])
      setOpen(false)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const like = `%${q}%`

    const [releases, contacts, bookings, invoices] = await Promise.all([
      (supabase as any)
        .from('releases')
        .select('title, artist_name, catalogue_number')
        .or(`title.ilike.${like},artist_name.ilike.${like},catalogue_number.ilike.${like}`)
        .limit(5),
      (supabase as any)
        .from('contacts')
        .select('full_name, email, organisation')
        .or(`full_name.ilike.${like},email.ilike.${like},organisation.ilike.${like}`)
        .limit(5),
      (supabase as any)
        .from('bookings')
        .select('venue_name, contact_name')
        .or(`venue_name.ilike.${like},contact_name.ilike.${like}`)
        .limit(5),
      (supabase as any)
        .from('invoices')
        .select('invoice_number, recipient_name')
        .or(`invoice_number.ilike.${like},recipient_name.ilike.${like}`)
        .limit(5),
    ])

    const g: SearchGroup[] = []

    if (releases.data?.length) {
      g.push({
        type: 'Releases',
        href: '/dashboard/releases',
        results: releases.data.map((r: any) => ({
          label: r.title ?? r.catalogue_number ?? '—',
          sub: r.artist_name,
        })),
      })
    }
    if (contacts.data?.length) {
      g.push({
        type: 'Contacts',
        href: '/dashboard/contacts',
        results: contacts.data.map((r: any) => ({
          label: r.full_name ?? r.email ?? '—',
          sub: r.organisation,
        })),
      })
    }
    if (bookings.data?.length) {
      g.push({
        type: 'Bookings',
        href: '/dashboard/bookings',
        results: bookings.data.map((r: any) => ({
          label: r.venue_name ?? '—',
          sub: r.contact_name,
        })),
      })
    }
    if (invoices.data?.length) {
      g.push({
        type: 'Invoices',
        href: '/dashboard/invoicing',
        results: invoices.data.map((r: any) => ({
          label: r.invoice_number ?? '—',
          sub: r.recipient_name,
        })),
      })
    }

    setGroups(g)
    setOpen(true)
    setLoading(false)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(val), 300)
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (query.trim() && groups.length) setOpen(true) }}
          placeholder="Search… ⌘K"
          style={{
            width: '100%',
            height: '34px',
            padding: '0 8px 0 28px',
            background: 'var(--bg-4)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            fontSize: '12px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {loading && (
          <div style={{
            position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
            width: '12px', height: '12px', border: '2px solid var(--border)',
            borderTop: '2px solid #1D9E75', borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }} />
        )}
      </div>

      {open && groups.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '38px',
          left: 0,
          right: 0,
          background: 'var(--bg-2)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          zIndex: 999,
          maxHeight: '340px',
          overflowY: 'auto',
        }}>
          {groups.map((g) => (
            <div key={g.type}>
              <div style={{
                fontSize: '9px',
                fontWeight: '600',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-3)',
                padding: '8px 10px 4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span>{g.type}</span>
                <span style={{
                  fontSize: '9px',
                  color: '#1D9E75',
                  fontWeight: '500',
                }}>
                  {g.results.length}
                </span>
              </div>
              {g.results.map((r, i) => (
                <Link
                  key={i}
                  href={g.href}
                  onClick={() => { setOpen(false); setQuery('') }}
                  style={{
                    display: 'block',
                    padding: '6px 10px',
                    textDecoration: 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.3 }}>
                    {highlight(r.label, query)}
                  </div>
                  {r.sub && (
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '1px' }}>
                      {highlight(r.sub, query)}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}

      {open && query.trim() && groups.length === 0 && !loading && (
        <div style={{
          position: 'absolute',
          top: '38px',
          left: 0,
          right: 0,
          background: 'var(--bg-2)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          zIndex: 999,
          padding: '12px 10px',
          fontSize: '11px',
          color: 'var(--text-3)',
          textAlign: 'center',
        }}>
          No results found
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function highlight(text: string, query: string) {
  if (!query.trim()) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: '#1D9E75', fontWeight: '600' }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  )
}
