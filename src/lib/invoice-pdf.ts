'use client'

import type { Invoice, LineItem } from '@/types/database'

function currSymbol(c: string) {
  return c === 'GBP' ? '£' : c === 'EUR' ? '€' : '$'
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function generateInvoicePDF(invoice: Invoice) {
  const cs = currSymbol(invoice.currency)
  const lines = (invoice.line_items ?? []) as LineItem[]

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${invoice.invoice_number}</title>
<style>
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #1a1a1a;
    background: #fff;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 40px 50px;
    position: relative;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 40px;
    padding-bottom: 24px;
    border-bottom: 3px solid #1D9E75;
  }
  .logo-area {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .logo-text {
    font-weight: 900;
    font-size: 24px;
    letter-spacing: 0.12em;
    color: #FF6B35;
  }
  .company-name {
    font-size: 22px;
    font-weight: 600;
    color: #1D9E75;
    letter-spacing: -0.02em;
  }
  .company-sub {
    font-size: 11px;
    color: #888;
    margin-top: 2px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .invoice-title {
    text-align: right;
  }
  .invoice-title h1 {
    font-size: 28px;
    font-weight: 700;
    color: #1D9E75;
    margin-bottom: 4px;
  }
  .invoice-number {
    font-size: 14px;
    color: #555;
    font-family: monospace;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 36px;
  }
  .meta-block h3 {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #1D9E75;
    margin-bottom: 8px;
    font-weight: 600;
  }
  .meta-block p {
    font-size: 13px;
    color: #333;
    line-height: 1.6;
  }
  .dates {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20px;
    margin-bottom: 36px;
    background: #f0faf6;
    border-radius: 10px;
    padding: 16px 20px;
  }
  .date-item label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #888;
    display: block;
    margin-bottom: 4px;
  }
  .date-item span {
    font-size: 13px;
    font-weight: 500;
    color: #1a1a1a;
  }
  .status-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .status-paid { background: #d4f5e9; color: #0a7a4f; }
  .status-sent { background: #dbeafe; color: #1e5bb8; }
  .status-draft { background: #f0f0f0; color: #666; }
  .status-overdue { background: #fee; color: #c00; }
  .status-viewed { background: #ede9fe; color: #6b21a8; }
  .status-cancelled { background: #f0f0f0; color: #999; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }
  thead th {
    text-align: left;
    padding: 12px 16px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #fff;
    background: #1D9E75;
  }
  thead th:first-child { border-radius: 8px 0 0 0; }
  thead th:last-child { border-radius: 0 8px 0 0; text-align: right; }
  thead th:nth-child(2), thead th:nth-child(3) { text-align: center; }
  tbody td {
    padding: 14px 16px;
    font-size: 13px;
    color: #333;
    border-bottom: 1px solid #eee;
  }
  tbody td:last-child { text-align: right; font-family: monospace; font-weight: 500; }
  tbody td:nth-child(2), tbody td:nth-child(3) { text-align: center; font-family: monospace; }
  tbody tr:last-child td { border-bottom: 2px solid #1D9E75; }
  .totals {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 36px;
  }
  .totals-box {
    width: 260px;
  }
  .totals-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 13px;
    color: #555;
  }
  .totals-row span:last-child {
    font-family: monospace;
    font-weight: 500;
    color: #1a1a1a;
  }
  .totals-row.total {
    border-top: 2px solid #1D9E75;
    padding-top: 12px;
    margin-top: 4px;
    font-size: 18px;
    font-weight: 700;
    color: #1a1a1a;
  }
  .totals-row.total span:last-child {
    color: #1D9E75;
    font-size: 18px;
  }
  .notes {
    background: #f8f8f8;
    border-radius: 10px;
    padding: 16px 20px;
    margin-bottom: 36px;
  }
  .notes h3 {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #888;
    margin-bottom: 6px;
    font-weight: 600;
  }
  .notes p {
    font-size: 12px;
    color: #555;
    line-height: 1.6;
  }
  .footer {
    position: absolute;
    bottom: 40px;
    left: 50px;
    right: 50px;
    text-align: center;
    padding-top: 16px;
    border-top: 1px solid #eee;
  }
  .footer p {
    font-size: 10px;
    color: #aaa;
    line-height: 1.6;
  }
  .footer .brand {
    color: #1D9E75;
    font-weight: 600;
  }
  @media print {
    body { padding: 0; }
    .page { padding: 30px 40px; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo-area">
      <div class="logo-text">SHINE</div>
      <div>
        <div class="company-name">Shine Frequency</div>
        <div class="company-sub">Music Distribution & Agency</div>
      </div>
    </div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <div class="invoice-number">${invoice.invoice_number}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-block">
      <h3>From</h3>
      <p>
        <strong>Shine Frequency Ltd</strong><br>
        London, United Kingdom<br>
        shineprdev@gmail.com
      </p>
    </div>
    <div class="meta-block">
      <h3>Bill to</h3>
      <p>
        <strong>${invoice.recipient_name}</strong><br>
        ${invoice.recipient_email ? invoice.recipient_email + '<br>' : ''}
        ${invoice.recipient_address ? invoice.recipient_address.replace(/\n/g, '<br>') : ''}
      </p>
    </div>
  </div>

  <div class="dates">
    <div class="date-item">
      <label>Issue date</label>
      <span>${fmtDate(invoice.issued_at)}</span>
    </div>
    <div class="date-item">
      <label>Due date</label>
      <span>${fmtDate(invoice.due_at)}</span>
    </div>
    <div class="date-item">
      <label>Status</label>
      <span class="status-badge status-${invoice.status}">${invoice.status}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lines.map(li => `
      <tr>
        <td>${li.description}</td>
        <td>${li.quantity}</td>
        <td>${cs}${li.unit_price.toFixed(2)}</td>
        <td>${cs}${(li.quantity * li.unit_price).toFixed(2)}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row">
        <span>Subtotal</span>
        <span>${cs}${invoice.subtotal.toFixed(2)}</span>
      </div>
      <div class="totals-row">
        <span>VAT (${invoice.tax_rate}%)</span>
        <span>${cs}${invoice.tax_amount.toFixed(2)}</span>
      </div>
      <div class="totals-row total">
        <span>Total</span>
        <span>${cs}${invoice.total.toFixed(2)}</span>
      </div>
    </div>
  </div>

  ${invoice.notes ? `
  <div class="notes">
    <h3>Notes</h3>
    <p>${invoice.notes.replace(/\n/g, '<br>')}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>
      <span class="brand">Shine Frequency Ltd</span> — London, UK<br>
      Thank you for your business
    </p>
  </div>
</div>
</body>
</html>`

  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  printWindow.document.write(html)
  printWindow.document.close()
  // Give images time to load
  setTimeout(() => {
    printWindow.print()
  }, 500)
}
