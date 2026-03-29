'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import type { Invoice, InvoiceStatus, LineItem } from '@/types/database'
import { generateInvoicePDF } from '@/lib/invoice-pdf'

const STATUS_COLORS: Record<InvoiceStatus, { bg: string; color: string }> = {
  draft:     { bg: '#1a1a1a', color: '#666' },
  sent:      { bg: '#0a1a2a', color: '#7ab8f5' },
  viewed:    { bg: '#1a1a2a', color: '#b8b4f0' },
  paid:      { bg: '#0a2a1e', color: '#4ecca3' },
  overdue:   { bg: '#2a0a0a', color: '#f08080' },
  cancelled: { bg: '#1a1a1a', color: '#444' },
}

const EMPTY_LINE: LineItem = { description: '', quantity: 1, unit_price: 0, total: 0 }

const EMPTY: Partial<Invoice> = {
  invoice_number: '',
  recipient_name: '',
  recipient_email: '',
  recipient_address: '',
  line_items: [{ ...EMPTY_LINE }],
  subtotal: 0,
  tax_rate: 20,
  tax_amount: 0,
  total: 0,
  currency: 'GBP',
  status: 'draft',
  notes: '',
}

function recalc(items: LineItem[], taxRate: number) {
  const lines = items.map(li => ({ ...li, total: li.quantity * li.unit_price }))
  const subtotal = lines.reduce((s, li) => s + li.total, 0)
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100
  return { line_items: lines, subtotal, tax_amount: taxAmount, total: subtotal + taxAmount }
}

export default function InvoicingPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<Invoice>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  async function load() {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })
    setInvoices(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

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

  function updateLineItem(index: number, field: keyof LineItem, value: string | number) {
    setForm(f => {
      const items = [...(f.line_items ?? [])]
      items[index] = { ...items[index], [field]: value }
      const calc = recalc(items, f.tax_rate ?? 20)
      return { ...f, ...calc }
    })
  }

  function addLineItem() {
    setForm(f => ({ ...f, line_items: [...(f.line_items ?? []), { ...EMPTY_LINE }] }))
  }

  function removeLineItem(index: number) {
    setForm(f => {
      const items = (f.line_items ?? []).filter((_, i) => i !== index)
      const calc = recalc(items, f.tax_rate ?? 20)
      return { ...f, ...calc }
    })
  }

  function updateTaxRate(rate: number) {
    setForm(f => {
      const calc = recalc(f.line_items ?? [], rate)
      return { ...f, tax_rate: rate, ...calc }
    })
  }

  async function save() {
    setSaving(true)
    setError('')
    if (!form.invoice_number || !form.recipient_name) {
      setError('Invoice number and recipient name are required')
      setSaving(false)
      return
    }
    if (editId) {
      const { error } = await (supabase as any).from('invoices').update(form).eq('id', editId)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await (supabase as any).from('invoices').insert([form])
      if (error) { setError(error.message); setSaving(false); return }
    }
    setForm(EMPTY)
    setShowForm(false)
    setEditId(null)
    setSaving(false)
    load()
    toast(editId ? 'Invoice updated' : 'Invoice created')
  }

  async function sendInvoiceEmail(inv: Invoice) {
    if (!inv.recipient_email) {
      toast('No recipient email on this invoice', 'error')
      return
    }
    toast('Sending invoice...', 'info')
    const res = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_invoice',
        to: inv.recipient_email,
        recipientName: inv.recipient_name,
        invoiceNumber: inv.invoice_number,
        total: inv.total.toFixed(2),
        currency: inv.currency,
        dueDate: inv.due_at ? new Date(inv.due_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'On receipt',
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast(data.error || 'Failed to send', 'error')
      return
    }
    // Update status to sent if currently draft
    if (inv.status === 'draft') {
      await (supabase as any).from('invoices').update({ status: 'sent', issued_at: new Date().toISOString() }).eq('id', inv.id)
      load()
    }
    toast('Invoice emailed to ' + inv.recipient_email)
  }

  async function markAsPaid(inv: Invoice) {
    const ref = prompt('Payment reference (optional):')
    await (supabase as any).from('invoices').update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_reference: ref || null,
    }).eq('id', inv.id)
    load()
    toast(`${inv.invoice_number} marked as paid`)
  }

  async function sendReminder(inv: Invoice) {
    if (!inv.recipient_email) { toast('No email on this invoice', 'error'); return }
    const daysOver = inv.due_at ? Math.floor((Date.now() - new Date(inv.due_at).getTime()) / 86400000) : 0
    toast('Sending reminder...', 'info')
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_custom',
        to: inv.recipient_email,
        subject: `Overdue: Invoice ${inv.invoice_number} — ${currSymbol(inv.currency)}${inv.total}`,
        html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <img src="https://shine-frequency.vercel.app/logo.png" style="width: 48px; height: 48px; border-radius: 50%; margin-bottom: 16px;" />
          <p>Hi ${inv.recipient_name.split(' ')[0]},</p>
          <p>This is a reminder that invoice <strong>${inv.invoice_number}</strong> for <strong>${currSymbol(inv.currency)}${inv.total.toFixed(2)}</strong> is now <strong>${daysOver} days overdue</strong>.</p>
          <p>Please arrange payment at your earliest convenience. Reply to this email if you have any questions.</p>
          <p style="color: #888; font-size: 13px; margin-top: 24px;">Shine Frequency — London, UK</p>
        </div>`,
      }),
    })
    toast('Reminder sent to ' + inv.recipient_email)
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Delete this invoice?')) return
    await (supabase as any).from('invoices').delete().eq('id', id)
    load()
    toast('Invoice deleted')
  }

  function editInvoice(inv: Invoice) {
    setForm(inv)
    setEditId(inv.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function exportCSV() {
    const headers = ['Invoice #', 'Recipient', 'Email', 'Total', 'Currency', 'Status', 'Issued', 'Due', 'Paid']
    const rows = filtered.map(inv => [
      inv.invoice_number, inv.recipient_name, inv.recipient_email ?? '',
      inv.total, inv.currency, inv.status,
      inv.issued_at ? new Date(inv.issued_at).toLocaleDateString('en-GB') : '',
      inv.due_at ? new Date(inv.due_at).toLocaleDateString('en-GB') : '',
      inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('en-GB') : ''
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `shine-invoices-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
    toast('Invoices exported')
  }

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.recipient_name.toLowerCase().includes(search.toLowerCase()) ||
      (inv.recipient_email ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus
    return matchSearch && matchStatus
  })

  const overdueInvoices = invoices.filter(inv => {
    if (inv.status === 'paid' || inv.status === 'cancelled') return false
    if (!inv.due_at) return false
    return new Date(inv.due_at) < new Date()
  })

  const totalOutstanding = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'viewed' || inv.status === 'overdue')
    .reduce((s, inv) => s + inv.total, 0)

  const currSymbol = (c: string) => c === 'GBP' ? '\u00A3' : c === 'EUR' ? '\u20AC' : '$'

  const inp = (style = {}) => ({
    width: '100%', padding: '8px 12px',
    background: 'var(--bg-4)', border: '0.5px solid var(--border-3)',
    borderRadius: '8px', color: 'var(--text)', fontSize: '12px',
    outline: 'none', ...style
  } as React.CSSProperties)

  const lbl = { fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' } as React.CSSProperties

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>Invoicing</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{invoices.length} total · {overdueInvoices.length} overdue · Create, send and track invoices</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp({ width: '200px' }) }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp({ width: '130px' }) }}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={exportCSV} style={{
            padding: '8px 16px', background: 'transparent',
            border: '0.5px solid var(--border-3)', borderRadius: '8px',
            color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer'
          }}>Export</button>
          <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(!showForm) }} style={{
            padding: '8px 16px', background: showForm ? 'var(--border-3)' : '#1D9E75',
            border: 'none', borderRadius: '8px', color: 'var(--text)',
            fontSize: '12px', fontWeight: '500', cursor: 'pointer'
          }}>
            {showForm ? 'Cancel' : '+ New invoice'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
        {[
          { label: 'Draft', count: invoices.filter(inv => inv.status === 'draft').length, color: '#666' },
          { label: 'Sent', count: invoices.filter(inv => inv.status === 'sent').length, color: '#7ab8f5' },
          { label: 'Paid', count: invoices.filter(inv => inv.status === 'paid').length, color: '#4ecca3' },
          { label: 'Overdue', count: overdueInvoices.length, color: '#f08080' },
          { label: 'Outstanding', count: `\u00A3${totalOutstanding.toLocaleString()}`, color: '#f5c842' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '18px', fontWeight: '500', color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* Overdue alert */}
      {overdueInvoices.length > 0 && (
        <div style={{ padding: '10px 14px', background: 'var(--red-bg)', border: '0.5px solid var(--red-border)', borderRadius: '10px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#f08080', fontWeight: '500' }}>
            {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--red-muted)' }}>
            {overdueInvoices.map(inv => `${inv.invoice_number} (${currSymbol(inv.currency)}${inv.total})`).join(' · ')}
          </span>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border-2)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '1rem', color: '#1D9E75' }}>
            {editId ? 'Edit invoice' : 'New invoice'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Invoice number *</label>
              <input style={inp()} value={form.invoice_number ?? ''} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} placeholder="SF-INV-001" />
            </div>
            <div>
              <label style={lbl}>Recipient name *</label>
              <input style={inp()} value={form.recipient_name ?? ''} onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))} placeholder="Venue / Promoter" />
            </div>
            <div>
              <label style={lbl}>Recipient email</label>
              <input style={inp()} value={form.recipient_email ?? ''} onChange={e => setForm(f => ({ ...f, recipient_email: e.target.value }))} placeholder="email@venue.com" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Status</label>
              <select style={inp()} value={form.status ?? 'draft'} onChange={e => setForm(f => ({ ...f, status: e.target.value as InvoiceStatus }))}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="viewed">Viewed</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Issue date</label>
              <input style={inp()} type="date" value={form.issued_at ? form.issued_at.slice(0, 10) : ''} onChange={e => setForm(f => ({ ...f, issued_at: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
            </div>
            <div>
              <label style={lbl}>Due date</label>
              <input style={inp()} type="date" value={form.due_at ? form.due_at.slice(0, 10) : ''} onChange={e => setForm(f => ({ ...f, due_at: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
            </div>
          </div>

          {/* Line items */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Line items</div>
            {(form.line_items ?? []).map((li, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px 100px 30px', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                <input style={inp()} value={li.description} onChange={e => updateLineItem(idx, 'description', e.target.value)} placeholder="Description" />
                <input style={inp()} type="number" value={li.quantity} onChange={e => updateLineItem(idx, 'quantity', parseInt(e.target.value) || 0)} />
                <input style={inp()} type="number" step="0.01" value={li.unit_price} onChange={e => updateLineItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} />
                <div style={{ fontSize: '12px', color: 'var(--text-faint)', textAlign: 'right', fontFamily: 'monospace' }}>
                  {currSymbol(form.currency ?? 'GBP')}{(li.quantity * li.unit_price).toFixed(2)}
                </div>
                <button onClick={() => removeLineItem(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--red-muted)', fontSize: '14px', cursor: 'pointer' }}>×</button>
              </div>
            ))}
            <button onClick={addLineItem} style={{ padding: '4px 10px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}>+ Add line</button>
          </div>

          {/* Totals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Notes</label>
              <textarea style={{ ...inp({ height: '64px', resize: 'none' }) }} value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Payment terms, notes..." />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span style={{ fontFamily: 'monospace' }}>{currSymbol(form.currency ?? 'GBP')}{(form.subtotal ?? 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tax</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input style={{ ...inp({ width: '50px', textAlign: 'right' }) }} type="number" value={form.tax_rate ?? 20} onChange={e => updateTaxRate(parseFloat(e.target.value) || 0)} />
                  <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>%</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tax amount</span>
                <span style={{ fontFamily: 'monospace' }}>{currSymbol(form.currency ?? 'GBP')}{(form.tax_amount ?? 0).toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '0.5px solid var(--border-3)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '500' }}>
                <span>Total</span>
                <span style={{ color: '#1D9E75', fontFamily: 'monospace' }}>{currSymbol(form.currency ?? 'GBP')}{(form.total ?? 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {error && <div style={{ padding: '8px 12px', background: 'var(--red-bg)', border: '0.5px solid var(--red-border)', borderRadius: '8px', fontSize: '12px', color: '#f08080', marginBottom: '12px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={save} disabled={saving} style={{ padding: '8px 20px', background: saving ? 'var(--green-dim)' : '#1D9E75', border: 'none', borderRadius: '8px', color: 'var(--text)', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              {saving ? 'Saving...' : editId ? 'Update invoice' : 'Create invoice'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY); setEditId(null) }} style={{ padding: '8px 16px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>Loading invoices...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D9E75', marginBottom: '6px' }}>No invoices yet</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Click "New invoice" to create one.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {['Invoice #', 'Recipient', 'Total', 'Status', 'Issued', 'Due', 'Views', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '10px', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => {
                const sc = STATUS_COLORS[inv.status]
                const isOverdue = inv.due_at && new Date(inv.due_at) < new Date() && inv.status !== 'paid' && inv.status !== 'cancelled'
                const daysOverdue = inv.due_at ? Math.floor((Date.now() - new Date(inv.due_at).getTime()) / 86400000) : 0
                return (
                  <tr key={inv.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid var(--row-border)' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-faint)' }}>{inv.invoice_number}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '500', color: 'var(--text)', fontSize: '12px' }}>{inv.recipient_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{inv.recipient_email ?? ''}</div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '500', fontFamily: 'monospace', color: 'var(--text)' }}>
                      {currSymbol(inv.currency)}{inv.total.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '500', background: isOverdue ? '#2a0a0a' : sc.bg, color: isOverdue ? '#f08080' : sc.color }}>
                        {isOverdue ? `overdue ${daysOverdue}d` : inv.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--text-3)' }}>
                      {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '11px', color: isOverdue ? '#f08080' : 'var(--text-3)' }}>
                      {inv.due_at ? new Date(inv.due_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>{inv.view_count}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => generateInvoicePDF(inv)} style={{ padding: '3px 8px', background: '#0a2a1e', border: '0.5px solid #1D9E75', borderRadius: '6px', color: '#4ecca3', fontSize: '11px', cursor: 'pointer' }}>PDF</button>
                        <button onClick={() => sendInvoiceEmail(inv)} style={{ padding: '3px 8px', background: '#0a1a2a', border: '0.5px solid #1a3a5a', borderRadius: '6px', color: '#7ab8f5', fontSize: '11px', cursor: 'pointer' }}>Email</button>
                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <button onClick={() => markAsPaid(inv)} style={{ padding: '3px 8px', background: '#0a2a1e', border: '0.5px solid #1D9E75', borderRadius: '6px', color: '#4ecca3', fontSize: '11px', cursor: 'pointer' }}>Paid</button>
                        )}
                        {isOverdue && (
                          <button onClick={() => sendReminder(inv)} style={{ padding: '3px 8px', background: '#2a0a0a', border: '0.5px solid #5a1a1a', borderRadius: '6px', color: '#f08080', fontSize: '11px', cursor: 'pointer' }}>Chase</button>
                        )}
                        <button onClick={() => editInvoice(inv)} style={{ padding: '3px 8px', background: 'transparent', border: '0.5px solid var(--border-3)', borderRadius: '6px', color: 'var(--text-faint)', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => deleteInvoice(inv.id)} style={{ padding: '3px 8px', background: 'transparent', border: '0.5px solid var(--red-muted-border)', borderRadius: '6px', color: 'var(--red-muted)', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                      </div>
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
