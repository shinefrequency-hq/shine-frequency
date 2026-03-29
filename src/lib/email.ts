import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, replyTo }: EmailOptions) {
  const from = process.env.SMTP_FROM || 'Shine Frequency <shineprdev@gmail.com>'

  const result = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    replyTo: replyTo || process.env.SMTP_USER,
  })

  return result
}

// --- Email templates ---

export function promoInviteEmail(opts: {
  contactName: string
  releaseTitle: string
  artistName: string
  catalogueNumber: string
  dropboxUrl?: string
  genre?: string
}) {
  const { contactName, releaseTitle, artistName, catalogueNumber, dropboxUrl, genre } = opts
  const firstName = contactName.split(' ')[0]

  return {
    subject: `${catalogueNumber} — ${artistName} "${releaseTitle}" | Promo Access`,
    html: `
<div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
  <div style="text-align: center; margin-bottom: 28px;">
    <img src="https://shine-frequency.vercel.app/logo.png" alt="Shine" style="width: 56px; height: 56px; border-radius: 50%;" />
  </div>
  <div style="font-size: 20px; font-weight: 600; color: #1D9E75; text-align: center; margin-bottom: 4px;">
    ${catalogueNumber}
  </div>
  <div style="font-size: 16px; font-weight: 500; text-align: center; color: #1a1a1a; margin-bottom: 4px;">
    ${artistName} — ${releaseTitle}
  </div>
  ${genre ? `<div style="font-size: 13px; color: #888; text-align: center; margin-bottom: 24px;">${genre}</div>` : '<div style="margin-bottom: 24px;"></div>'}
  <div style="font-size: 14px; color: #333; line-height: 1.7; margin-bottom: 24px;">
    Hey ${firstName},<br><br>
    New release from <strong>${artistName}</strong> on Shine Frequency. Your promo access is ready.
    ${dropboxUrl ? `<br><br>Grab your copy below — would love to hear your thoughts.` : `<br><br>We'll send your download link shortly.`}
  </div>
  ${dropboxUrl ? `
  <div style="text-align: center; margin-bottom: 28px;">
    <a href="${dropboxUrl}" style="display: inline-block; padding: 12px 32px; background: #1D9E75; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">
      Download from Dropbox
    </a>
  </div>` : ''}
  <div style="font-size: 13px; color: #888; line-height: 1.6; margin-bottom: 20px;">
    If you'd like to leave a review or chart this release, just reply to this email.
  </div>
  <div style="border-top: 1px solid #eee; padding-top: 16px; text-align: center;">
    <span style="font-size: 12px; color: #1D9E75; font-weight: 600;">Shine Frequency</span>
    <span style="font-size: 11px; color: #aaa;"> — London, UK</span>
  </div>
</div>`,
  }
}

export function invoiceEmail(opts: {
  recipientName: string
  invoiceNumber: string
  total: string
  currency: string
  dueDate: string
}) {
  const { recipientName, invoiceNumber, total, currency, dueDate } = opts
  const cs = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$'

  return {
    subject: `Invoice ${invoiceNumber} — ${cs}${total} from Shine Frequency`,
    html: `
<div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
  <div style="text-align: center; margin-bottom: 28px;">
    <img src="https://shine-frequency.vercel.app/logo.png" alt="Shine" style="width: 56px; height: 56px; border-radius: 50%;" />
  </div>
  <div style="font-size: 20px; font-weight: 600; color: #1D9E75; text-align: center; margin-bottom: 20px;">
    Invoice ${invoiceNumber}
  </div>
  <div style="font-size: 14px; color: #333; line-height: 1.7; margin-bottom: 24px;">
    Hi ${recipientName.split(' ')[0]},<br><br>
    Please find your invoice from Shine Frequency attached below.
  </div>
  <div style="background: #f0faf6; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
      <span style="font-size: 13px; color: #666;">Amount due</span>
      <span style="font-size: 18px; font-weight: 700; color: #1D9E75; font-family: monospace;">${cs}${total}</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span style="font-size: 13px; color: #666;">Due by</span>
      <span style="font-size: 13px; font-weight: 500; color: #1a1a1a;">${dueDate}</span>
    </div>
  </div>
  <div style="font-size: 13px; color: #888; line-height: 1.6; margin-bottom: 20px;">
    Please reply to this email if you have any questions about this invoice.
  </div>
  <div style="border-top: 1px solid #eee; padding-top: 16px; text-align: center;">
    <span style="font-size: 12px; color: #1D9E75; font-weight: 600;">Shine Frequency</span>
    <span style="font-size: 11px; color: #aaa;"> — London, UK</span>
  </div>
</div>`,
  }
}

export function bookingConfirmEmail(opts: {
  artistName: string
  venueName: string
  venueCity: string
  eventDate: string
  setTime: string
  fee: string
  currency: string
  contactName: string
}) {
  const { artistName, venueName, venueCity, eventDate, setTime, fee, currency, contactName } = opts
  const cs = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$'

  return {
    subject: `Booking confirmed: ${artistName} @ ${venueName}, ${eventDate}`,
    html: `
<div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
  <div style="text-align: center; margin-bottom: 28px;">
    <img src="https://shine-frequency.vercel.app/logo.png" alt="Shine" style="width: 56px; height: 56px; border-radius: 50%;" />
  </div>
  <div style="font-size: 20px; font-weight: 600; color: #1D9E75; text-align: center; margin-bottom: 20px;">
    Booking Confirmed
  </div>
  <div style="font-size: 14px; color: #333; line-height: 1.7; margin-bottom: 24px;">
    Hi ${contactName.split(' ')[0]},<br><br>
    This confirms the booking for <strong>${artistName}</strong> at <strong>${venueName}</strong>.
  </div>
  <div style="background: #f0faf6; border-radius: 10px; padding: 20px; margin-bottom: 24px; font-size: 13px; color: #333; line-height: 2;">
    <strong>Artist:</strong> ${artistName}<br>
    <strong>Venue:</strong> ${venueName}, ${venueCity}<br>
    <strong>Date:</strong> ${eventDate}<br>
    <strong>Set time:</strong> ${setTime}<br>
    <strong>Fee:</strong> ${cs}${fee}
  </div>
  <div style="font-size: 13px; color: #888; line-height: 1.6; margin-bottom: 20px;">
    Contract and rider details to follow. Please reply with any questions.
  </div>
  <div style="border-top: 1px solid #eee; padding-top: 16px; text-align: center;">
    <span style="font-size: 12px; color: #1D9E75; font-weight: 600;">Shine Frequency</span>
    <span style="font-size: 11px; color: #aaa;"> — London, UK</span>
  </div>
</div>`,
  }
}
