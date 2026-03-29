'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Staff, UserRole } from '@/types/database'

const ROLE_COLORS: Record<UserRole, { bg: string; color: string }> = {
  owner:                { bg: 'var(--green-bg)', color: '#4ecca3' },
  senior_manager:       { bg: 'var(--blue-bg)', color: '#7ab8f5' },
  distribution_manager: { bg: 'var(--purple-bg)', color: '#b8b4f0' },
  booking_agent:        { bg: 'var(--amber-bg)', color: '#f5c842' },
  social_media_manager: { bg: 'var(--pink-bg)', color: '#f48fb1' },
  podcast_producer:     { bg: 'var(--orange-bg)', color: '#ff7043' },
  read_only:            { bg: 'var(--bg-4)', color: 'var(--text-3)' },
}

const EMPTY: Partial<Staff> = {
  email: '',
  full_name: '',
  role: 'read_only',
  is_active: true,
}

export default function StaffPage() {
  const supabase = createClient()
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<Staff>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('staff')
      .select('*')
      .order('created_at', { ascending: true })
    setStaff(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    setError('')
    if (!form.email || !form.full_name) {
      setError('Email and name are required')
      setSaving(false)
      return
    }
    if (editId) {
      const { error } = await (supabase as any).from('staff').update(form).eq('id', editId)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await (supabase as any).from('staff').insert([form])
      if (error) { setError(error.message); setSaving(false); return }
    }
    setForm(EMPTY)
    setShowForm(false)
    setEditId(null)
    setSaving(false)
    load()
  }

  function editStaff(s: Staff) {
    setForm(s)
    setEditId(s.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function toggleActive(id: string, current: boolean) {
    await (supabase as any).from('staff').update({ is_active: !current }).eq('id', id)
    load()
  }

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const inp = (style = {}) => ({
    width: '100%', padding: '8px 12px',
    background: 'var(--bg-4)', border: '0.5px solid var(--border-3)',
    borderRadius: '8px', color: 'var(--text)', fontSize: '12px',
    outline: 'none', ...style
  } as React.CSSProperties)

  const lbl = { fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' } as React.CSSProperties

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1100px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Staff & roles</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{staff.length} team members · {staff.filter(s => s.is_active).length} active</div>
        </div>
        <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(!showForm) }} style={{
          padding: '8px 16px', background: showForm ? 'var(--border-3)' : '#1D9E75',
          border: 'none', borderRadius: '8px', color: 'var(--text)',
          fontSize: '12px', fontWeight: '500', cursor: 'pointer'
        }}>
          {showForm ? 'Cancel' : '+ Invite member'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border-2)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '1rem', color: '#1D9E75' }}>
            {editId ? 'Edit member' : 'Invite new member'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Full name *</label>
              <input style={inp()} value={form.full_name ?? ''} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Sharon O'Brien" />
            </div>
            <div>
              <label style={lbl}>Email *</label>
              <input style={inp()} type="email" value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="sharon@shinefrequency.com" />
            </div>
            <div>
              <label style={lbl}>Role</label>
              <select style={inp()} value={form.role ?? 'read_only'} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}>
                <option value="owner">Owner</option>
                <option value="senior_manager">Senior manager</option>
                <option value="distribution_manager">Distribution manager</option>
                <option value="booking_agent">Booking agent</option>
                <option value="social_media_manager">Social media manager</option>
                <option value="podcast_producer">Podcast producer</option>
                <option value="read_only">Read only</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: form.is_active ? '#4ecca3' : 'var(--text-muted)' }}>
              <input type="checkbox" checked={form.is_active ?? true} onChange={() => setForm(f => ({ ...f, is_active: !f.is_active }))} style={{ accentColor: '#1D9E75' }} />
              Active
            </label>
          </div>
          {error && <div style={{ padding: '8px 12px', background: 'var(--red-bg)', border: '0.5px solid var(--red-border)', borderRadius: '8px', fontSize: '12px', color: '#f08080', marginBottom: '12px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={save} disabled={saving} style={{ padding: '8px 20px', background: saving ? 'var(--green-dim)' : '#1D9E75', border: 'none', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              {saving ? 'Saving...' : editId ? 'Update member' : 'Send invite'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY); setEditId(null) }} style={{ padding: '8px 16px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px', background: 'var(--bg-2)', borderRadius: '12px', border: '0.5px solid var(--border)', gridColumn: '1 / -1' }}>Loading...</div>
        ) : staff.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-2)', borderRadius: '12px', border: '0.5px solid var(--border)', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>No team members</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Invite your first team member above.</div>
          </div>
        ) : staff.map(s => {
          const rc = ROLE_COLORS[s.role]
          return (
            <div key={s.id} style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', padding: '1rem', opacity: s.is_active ? 1 : 0.5, transition: 'all 0.1s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: rc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '500', color: rc.color, flexShrink: 0 }}>
                  {initials(s.full_name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '500', color: 'var(--text)', fontSize: '13px' }}>{s.full_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: rc.bg, color: rc.color }}>
                  {s.role.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '10px', color: s.is_active ? '#4ecca3' : 'var(--text-3)' }}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '8px' }}>
                {s.last_login_at ? `Last login ${new Date(s.last_login_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'Never logged in'}
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => editStaff(s)} style={{ flex: 1, padding: '5px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '6px', color: 'var(--text-faint)', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => toggleActive(s.id, s.is_active)} style={{ flex: 1, padding: '5px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '6px', color: s.is_active ? 'var(--red-muted)' : '#4ecca3', fontSize: '11px', cursor: 'pointer' }}>
                  {s.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
