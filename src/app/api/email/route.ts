import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendEmail, promoInviteEmail, invoiceEmail, bookingConfirmEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  try {
    if (action === 'send_promo_invite') {
      const { to, contactName, releaseTitle, artistName, catalogueNumber, dropboxUrl, genre } = body
      const template = promoInviteEmail({ contactName, releaseTitle, artistName, catalogueNumber, dropboxUrl, genre })
      await sendEmail({ to, ...template })
      return NextResponse.json({ success: true })
    }

    if (action === 'send_invoice') {
      const { to, recipientName, invoiceNumber, total, currency, dueDate } = body
      const template = invoiceEmail({ recipientName, invoiceNumber, total, currency, dueDate })
      await sendEmail({ to, ...template })
      return NextResponse.json({ success: true })
    }

    if (action === 'send_booking_confirm') {
      const { to, artistName, venueName, venueCity, eventDate, setTime, fee, currency, contactName } = body
      const template = bookingConfirmEmail({ artistName, venueName, venueCity, eventDate, setTime, fee, currency, contactName })
      await sendEmail({ to, ...template })
      return NextResponse.json({ success: true })
    }

    if (action === 'send_custom') {
      const { to, subject, html } = body
      await sendEmail({ to, subject, html })
      return NextResponse.json({ success: true })
    }

    if (action === 'test') {
      await sendEmail({
        to: process.env.SMTP_USER || 'shineprdev@gmail.com',
        subject: 'Shine Frequency — Email test',
        html: `<div style="font-family: sans-serif; padding: 20px;"><p>Email is working. Sent from Shine Frequency platform.</p></div>`,
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
