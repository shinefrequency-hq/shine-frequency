'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Automation, AutomationTrigger } from '@/types/database'

const TRIGGER_LABELS: Record<AutomationTrigger, { label: string; color: string; bg: string }> = {
  promo_window_opens:  { label: 'Promo window opens', color: '#7ab8f5', bg: '#0a1a2a' },
  no_download_48h:     { label: 'No download 48h', color: '#f5c842', bg: '#2a1e0a' },
  no_review_5d:        { label: 'No review 5 days', color: '#ff7043', bg: '#2a1000' },
  heat_window_72h:     { label: 'Heat window 72h', color: '#f08080', bg: '#2a0a0a' },
  booking_confirmed:   { label: 'Booking confirmed', color: '#4ecca3', bg: '#0a2a1e' },
  invoice_overdue_7d:  { label: 'Invoice overdue 7d', color: '#f5c842', bg: '#2a1e0a' },
  invoice_overdue_14d: { label: 'Invoice overdue 14d', color: '#f08080', bg: '#2a0a0a' },
  release_goes_live:   { label: 'Release goes live', color: '#b8b4f0', bg: '#1a1a2a' },
  travel_unbooked_30d: { label: 'Travel unbooked 30d', color: '#ff7043', bg: '#2a1000' },
}

export default function AutomationsPage() {
  const supabase = createClient()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<Automation>>({ name: '', trigger: 'promo_window_opens', is_active: true, message_template: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Automation | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('automations')
      .select('*')
      .order('created_at', { ascending: true })
    setAutomations(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleActive(id: string, current: boolean) {
    await (supabase as any).from('automations').update({ is_active: !current }).eq('id', id)
    load()
  }

  async function save() {
    setSaving(true)
    setError('')
    if (!form.name || !form.trigger) {
      setError('Name and trigger are required')
      setSaving(false)
      return
    }
    if (editId) {
      const { error } = await (supabase as any).from('automations').update(form).eq('id', editId)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await (supabase as any).from('automations').insert([form])
      if (error) { setError(error.message); setSaving(false); return }
    }
    setForm({ name: '', trigger: 'promo_window_opens', is_active: true, message_template: '' })
    setShowForm(false)
    setEditId(null)
    setSaving(false)
    load()
  }

  async function deleteAutomation(id: string) {
    if (!confirm('Delete this automation?')) return
    await (supabase as any).from('automations').delete().eq('id', id)
    if (selected?.id === id) setSelected(null)
    load()
  }

  function editAutomation(a: Automation) {
    setForm(a)
    setEditId(a.id)
    setShowForm(true)
    setSelected(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeCount = automations.filter(a => a.is_active).length
  const totalRuns = automations.reduce((s, a) => s + a.run_count, 0)

  const inp = (style = {}) => ({
    width: '100%', padding: '8px 12px',
    background: '#1a1a1a', border: '0.5px solid #333',
    borderRadius: '8px', color: '#fff', fontSize: '12px',
    outline: 'none', ...style
  } as React.CSSProperties)

  const lbl = { fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' } as React.CSSProperties

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Automations</div>
          <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
            {automations.length} rules · {activeCount} active · {totalRuns} total runs
          </div>
        </div>
        <button onClick={() => { setForm({ name: '', trigger: 'promo_window_opens', is_active: true, message_template: '' }); setEditId(null); setSelected(null); setShowForm(!showForm) }} style={{
          padding: '8px 16px', background: showForm ? '#333' : '#1D9E75',
          border: 'none', borderRadius: '8px', color: '#fff',
          fontSize: '12px', fontWeight: '500', cursor: 'pointer'
        }}>
          {showForm ? 'Cancel' : '+ New automation'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total rules', count: automations.length, color: '#7ab8f5' },
          { label: 'Active', count: activeCount, color: '#4ecca3' },
          { label: 'Inactive', count: automations.length - activeCount, color: '#666' },
          { label: 'Total runs', count: totalRuns, color: '#f5c842' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111', border: '0.5px solid #222', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '18px', fontWeight: '500', color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#111', border: '0.5px solid #2a2a2a', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '1rem', color: '#1D9E75' }}>
            {editId ? 'Edit automation' : 'New automation'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Name *</label>
              <input style={inp()} value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Auto-send promo links" />
            </div>
            <div>
              <label style={lbl}>Trigger *</label>
              <select style={inp()} value={form.trigger ?? 'promo_window_opens'} onChange={e => setForm(f => ({ ...f, trigger: e.target.value as AutomationTrigger }))}>
                {(Object.keys(TRIGGER_LABELS) as AutomationTrigger[]).map(t => (
                  <option key={t} value={t}>{TRIGGER_LABELS[t].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={lbl}>Message template</label>
            <textarea style={{ ...inp({ height: '80px', resize: 'none' }) }} value={form.message_template ?? ''} onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))} placeholder="Hey {first_name}, {release_title} is now available..." />
            <div style={{ fontSize: '10px', color: '#444', marginTop: '4px' }}>
              Variables: {'{first_name}'} {'{release_title}'} {'{dropbox_url}'} {'{invoice_number}'} {'{amount}'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: form.is_active ? '#4ecca3' : '#666' }}>
              <input type="checkbox" checked={form.is_active ?? true} onChange={() => setForm(f => ({ ...f, is_active: !f.is_active }))} style={{ accentColor: '#1D9E75' }} />
              Active
            </label>
          </div>

          {error && <div style={{ padding: '8px 12px', background: '#2a0a0a', border: '0.5px solid #5a1a1a', borderRadius: '8px', fontSize: '12px', color: '#f08080', marginBottom: '12px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={save} disabled={saving} style={{ padding: '8px 20px', background: saving ? '#0a4a30' : '#1D9E75', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              {saving ? 'Saving...' : editId ? 'Update' : 'Create automation'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null) }} style={{ padding: '8px 16px', background: 'transparent', border: '0.5px solid #333', borderRadius: '8px', color: '#666', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: '1rem' }}>
        {/* Automation list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#555', fontSize: '12px', background: '#111', borderRadius: '12px', border: '0.5px solid #222' }}>Loading...</div>
          ) : automations.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#111', borderRadius: '12px', border: '0.5px solid #222' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>No automations</div>
              <div style={{ fontSize: '12px', color: '#555' }}>Create an automation to get started.</div>
            </div>
          ) : automations.map(a => {
            const tl = TRIGGER_LABELS[a.trigger]
            const isSelected = selected?.id === a.id
            return (
              <div key={a.id}
                style={{
                  background: isSelected ? '#161a16' : '#111', border: '0.5px solid #222',
                  borderRadius: '12px', padding: '1rem', cursor: 'pointer',
                  opacity: a.is_active ? 1 : 0.5, transition: 'all 0.1s'
                }}
                onClick={() => setSelected(isSelected ? null : a)}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#161616' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? '#161a16' : '#111' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div onClick={e => { e.stopPropagation(); toggleActive(a.id, a.is_active) }} style={{
                      width: '36px', height: '20px', borderRadius: '10px', cursor: 'pointer',
                      background: a.is_active ? '#1D9E75' : '#333', padding: '2px',
                      transition: 'background 0.2s', flexShrink: 0
                    }}>
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                        transform: a.is_active ? 'translateX(16px)' : 'translateX(0)',
                        transition: 'transform 0.2s'
                      }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: '#fff', fontSize: '13px' }}>{a.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: tl.bg, color: tl.color }}>
                          {tl.label}
                        </span>
                        <span style={{ fontSize: '10px', color: '#555' }}>
                          {a.run_count} runs
                          {a.last_ran_at && ` · last ${new Date(a.last_ran_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => editAutomation(a)} style={{ padding: '3px 8px', background: 'transparent', border: '0.5px solid #333', borderRadius: '6px', color: '#888', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => deleteAutomation(a.id)} style={{ padding: '3px 8px', background: 'transparent', border: '0.5px solid #2a1a1a', borderRadius: '6px', color: '#5a2a2a', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background: '#111', border: '0.5px solid #222', borderRadius: '12px', padding: '1.25rem', alignSelf: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontWeight: '500', fontSize: '14px' }}>{selected.name}</div>
                <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                  {selected.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '16px', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
              <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                <div style={{ fontSize: '10px', color: '#555', marginBottom: '3px' }}>Trigger</div>
                <div style={{ fontSize: '12px', color: TRIGGER_LABELS[selected.trigger].color }}>{TRIGGER_LABELS[selected.trigger].label}</div>
              </div>
              <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                <div style={{ fontSize: '10px', color: '#555', marginBottom: '3px' }}>Run count</div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>{selected.run_count}</div>
              </div>
            </div>

            {selected.message_template && (
              <>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Message template</div>
                <div style={{ padding: '10px', background: '#1a1a1a', borderRadius: '8px', fontSize: '12px', color: '#888', lineHeight: '1.6', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                  {selected.message_template}
                </div>
              </>
            )}

            {selected.last_ran_at && (
              <div style={{ fontSize: '11px', color: '#555', marginBottom: '1rem' }}>
                Last ran: {new Date(selected.last_ran_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button onClick={() => toggleActive(selected.id, selected.is_active)} style={{
                padding: '8px', background: selected.is_active ? '#2a0a0a' : '#0a2a1e',
                border: `0.5px solid ${selected.is_active ? '#5a1a1a' : '#1a4a3a'}`,
                borderRadius: '8px', color: selected.is_active ? '#f08080' : '#4ecca3',
                fontSize: '12px', cursor: 'pointer'
              }}>
                {selected.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => editAutomation(selected)} style={{ padding: '8px', background: '#1D9E75', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Edit automation</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
