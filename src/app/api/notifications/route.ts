import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const SHARON_EMAIL = () => process.env.SMTP_USER || 'shineprdev@gmail.com'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function wrapHtml(title: string, body: string) {
  return `
<div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
  <div style="text-align: center; margin-bottom: 28px;">
    <img src="https://shine-frequency.vercel.app/logo.png" alt="Shine" style="width: 56px; height: 56px; border-radius: 50%;" />
  </div>
  <div style="font-size: 20px; font-weight: 600; color: #1D9E75; text-align: center; margin-bottom: 20px;">
    ${title}
  </div>
  <div style="font-size: 14px; color: #333; line-height: 1.7;">
    ${body}
  </div>
  <div style="border-top: 1px solid #eee; padding-top: 16px; margin-top: 28px; text-align: center;">
    <span style="font-size: 12px; color: #1D9E75; font-weight: 600;">Shine Frequency</span>
    <span style="font-size: 11px; color: #aaa;"> — London, UK</span>
  </div>
</div>`
}

// ---- Check functions ----

async function checkOverdueInvoices(supabase: any) {
  const now = new Date().toISOString()
  const { data: invoices } = await (supabase as any)
    .from('invoices')
    .select('id, invoice_number, recipient_name, recipient_email, total, currency, due_at, status')
    .in('status', ['sent', 'viewed'])
    .lt('due_at', now)

  return invoices || []
}

async function checkPromoWindowsClosing(supabase: any) {
  const now = new Date()
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
  const { data: releases } = await (supabase as any)
    .from('releases')
    .select('id, catalogue_number, title, artist_name, promo_window_end')
    .gt('promo_window_end', now.toISOString())
    .lt('promo_window_end', threeDays)
    .in('status', ['scheduled', 'live'])

  return releases || []
}

async function checkUnsignedContracts(supabase: any) {
  const now = new Date()
  const fourteenDays = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data: bookings } = await (supabase as any)
    .from('bookings')
    .select('id, venue_name, venue_city, event_date, contract_status, artist_id')
    .eq('status', 'confirmed')
    .in('contract_status', ['not_sent', 'sent'])
    .lt('event_date', fourteenDays)
    .gt('event_date', now.toISOString())

  if (!bookings || bookings.length === 0) return []

  // Fetch artist names for context
  const artistIds = [...new Set(bookings.map((b: any) => b.artist_id))]
  const { data: artists } = await (supabase as any)
    .from('artists')
    .select('id, stage_name')
    .in('id', artistIds)

  const artistMap = new Map((artists || []).map((a: any) => [a.id, a.stage_name]))
  return bookings.map((b: any) => ({ ...b, artist_name: artistMap.get(b.artist_id) || 'Unknown' }))
}

async function checkPendingReviews(supabase: any) {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const { data: reviews } = await (supabase as any)
    .from('reviews')
    .select('id, rating, body, charted, created_at, contact_id, release_id')
    .eq('status', 'pending')
    .lt('created_at', threeDaysAgo)

  if (!reviews || reviews.length === 0) return []

  const contactIds = [...new Set(reviews.map((r: any) => r.contact_id))]
  const releaseIds = [...new Set(reviews.map((r: any) => r.release_id))]

  const [{ data: contacts }, { data: releases }] = await Promise.all([
    (supabase as any).from('contacts').select('id, full_name').in('id', contactIds),
    (supabase as any).from('releases').select('id, catalogue_number, title').in('id', releaseIds),
  ])

  const contactMap = new Map((contacts || []).map((c: any) => [c.id, c.full_name]))
  const releaseMap = new Map((releases || []).map((r: any) => [r.id, `${r.catalogue_number} — ${r.title}`]))

  return reviews.map((r: any) => ({
    ...r,
    contact_name: contactMap.get(r.contact_id) || 'Unknown',
    release_label: releaseMap.get(r.release_id) || 'Unknown release',
  }))
}

// ---- Send overdue reminders to actual recipients ----

async function sendOverdueReminders(supabase: any) {
  const invoices = await checkOverdueInvoices(supabase)
  let sent = 0

  for (const inv of invoices) {
    if (!inv.recipient_email) continue
    const cs = inv.currency === 'GBP' ? '£' : inv.currency === 'EUR' ? '€' : '$'
    await sendEmail({
      to: inv.recipient_email,
      subject: `Reminder: Invoice ${inv.invoice_number} — ${cs}${inv.total} overdue`,
      html: wrapHtml('Payment Reminder', `
        <p>Hi ${inv.recipient_name.split(' ')[0]},</p>
        <p>This is a friendly reminder that invoice <strong>${inv.invoice_number}</strong> for <strong>${cs}${inv.total}</strong> was due on <strong>${formatDate(inv.due_at)}</strong> and remains unpaid.</p>
        <p>Please arrange payment at your earliest convenience. If you've already paid, please disregard this message.</p>
        <p>Reply to this email with any questions.</p>
      `),
    })
    sent++
  }

  return { sent, total: invoices.length }
}

// ---- Main check & send to Sharon ----

async function checkAndSend(supabase: any) {
  const [overdueInvoices, closingPromos, unsignedContracts, pendingReviews] = await Promise.all([
    checkOverdueInvoices(supabase),
    checkPromoWindowsClosing(supabase),
    checkUnsignedContracts(supabase),
    checkPendingReviews(supabase),
  ])

  const sections: string[] = []

  if (overdueInvoices.length > 0) {
    const rows = overdueInvoices.map((inv: any) => {
      const cs = inv.currency === 'GBP' ? '£' : inv.currency === 'EUR' ? '€' : '$'
      return `<li><strong>${inv.invoice_number}</strong> — ${inv.recipient_name} — ${cs}${inv.total} (due ${formatDate(inv.due_at)}, status: ${inv.status})</li>`
    }).join('')
    sections.push(`
      <div style="margin-bottom: 24px;">
        <div style="font-size: 15px; font-weight: 600; color: #e53e3e; margin-bottom: 8px;">Overdue Invoices (${overdueInvoices.length})</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">${rows}</ul>
      </div>
    `)
  }

  if (closingPromos.length > 0) {
    const rows = closingPromos.map((r: any) =>
      `<li><strong>${r.catalogue_number}</strong> — ${r.artist_name} "${r.title}" — closes ${formatDate(r.promo_window_end)}</li>`
    ).join('')
    sections.push(`
      <div style="margin-bottom: 24px;">
        <div style="font-size: 15px; font-weight: 600; color: #dd6b20; margin-bottom: 8px;">Promo Windows Closing Within 3 Days (${closingPromos.length})</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">${rows}</ul>
      </div>
    `)
  }

  if (unsignedContracts.length > 0) {
    const rows = unsignedContracts.map((b: any) =>
      `<li><strong>${b.artist_name}</strong> @ ${b.venue_name}, ${b.venue_city} — ${formatDate(b.event_date)} (contract: ${b.contract_status})</li>`
    ).join('')
    sections.push(`
      <div style="margin-bottom: 24px;">
        <div style="font-size: 15px; font-weight: 600; color: #dd6b20; margin-bottom: 8px;">Unsigned Contracts — Events Within 14 Days (${unsignedContracts.length})</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">${rows}</ul>
      </div>
    `)
  }

  if (pendingReviews.length > 0) {
    const rows = pendingReviews.map((r: any) =>
      `<li><strong>${r.contact_name}</strong> on ${r.release_label} — rating: ${r.rating ?? 'none'} ${r.charted ? '(charted)' : ''} — submitted ${formatDate(r.created_at)}</li>`
    ).join('')
    sections.push(`
      <div style="margin-bottom: 24px;">
        <div style="font-size: 15px; font-weight: 600; color: #805ad5; margin-bottom: 8px;">Pending Reviews Older Than 3 Days (${pendingReviews.length})</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">${rows}</ul>
      </div>
    `)
  }

  if (sections.length === 0) {
    return { sent: false, message: 'No notifications to send — all clear.' }
  }

  const body = `
    <p>Hi Sharon,</p>
    <p>Here's your notification summary from Shine Frequency:</p>
    ${sections.join('')}
    <p style="font-size: 13px; color: #888; margin-top: 16px;">This is an automated check. Log in to the dashboard to take action.</p>
  `

  await sendEmail({
    to: SHARON_EMAIL(),
    subject: `Shine Frequency — ${sections.length} notification${sections.length > 1 ? 's' : ''} need attention`,
    html: wrapHtml('Notification Summary', body),
  })

  return {
    sent: true,
    counts: {
      overdue_invoices: overdueInvoices.length,
      closing_promos: closingPromos.length,
      unsigned_contracts: unsignedContracts.length,
      pending_reviews: pendingReviews.length,
    },
  }
}

// ---- Route handler ----

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json()
    const supabase = getServiceClient()

    if (action === 'check_and_send') {
      const result = await checkAndSend(supabase)
      return NextResponse.json({ success: true, ...result })
    }

    if (action === 'send_overdue_reminders') {
      const result = await sendOverdueReminders(supabase)
      return NextResponse.json({ success: true, ...result })
    }

    return NextResponse.json({ error: 'Unknown action. Use check_and_send or send_overdue_reminders.' }, { status: 400 })
  } catch (err: any) {
    console.error('Notification error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
