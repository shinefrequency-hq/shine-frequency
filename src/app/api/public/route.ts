import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS for public form submissions
function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body
  const sb = getClient()

  try {
    // --- Artist onboarding ---
    if (action === 'onboard_artist') {
      const { contact, artist } = body

      // Create contact
      const { data: contactData, error: cErr } = await sb
        .from('contacts')
        .insert([contact])
        .select()
        .single()

      if (cErr) {
        if (cErr.message?.includes('duplicate') || cErr.code === '23505') {
          return NextResponse.json({ error: 'An artist with this email already exists. Please contact us directly.' }, { status: 400 })
        }
        return NextResponse.json({ error: cErr.message }, { status: 400 })
      }

      // Create artist
      const { error: aErr } = await sb
        .from('artists')
        .insert([{ ...artist, contact_id: contactData.id }])

      if (aErr) {
        return NextResponse.json({ error: aErr.message }, { status: 400 })
      }

      // Create task
      await sb.from('tasks').insert([{
        title: `New artist submission: ${artist.stage_name}`,
        description: `${artist.stage_name} (${contact.email}) submitted via onboarding form. ${artist.agent_notes || ''}. Review and approve.`,
        urgency: 'today',
        related_contact_id: contactData.id,
        auto_generated: true,
      }])

      return NextResponse.json({ success: true, contact_id: contactData.id })
    }

    // --- Promo sign-up ---
    if (action === 'join_promo') {
      const { contact } = body

      const { data: contactData, error: cErr } = await sb
        .from('contacts')
        .insert([contact])
        .select()
        .single()

      if (cErr) {
        if (cErr.message?.includes('duplicate') || cErr.code === '23505') {
          return NextResponse.json({ error: 'This email is already registered.' }, { status: 400 })
        }
        return NextResponse.json({ error: cErr.message }, { status: 400 })
      }

      await sb.from('tasks').insert([{
        title: `New promo sign-up: ${contact.full_name}`,
        description: `${contact.full_name} (${contact.email}) signed up for promos. ${contact.notes || ''}. Review and approve.`,
        urgency: 'today',
        related_contact_id: contactData.id,
        auto_generated: true,
      }])

      return NextResponse.json({ success: true, contact_id: contactData.id })
    }

    // --- DJ review submission ---
    if (action === 'submit_review') {
      const { email, name, review } = body

      // Find or create contact
      let contactId: string
      const { data: existing } = await sb.from('contacts').select('id').eq('email', email).single()

      if (existing) {
        contactId = existing.id
      } else {
        const { data: newContact, error } = await sb.from('contacts').insert([{
          full_name: name,
          email,
          type: 'dj',
          is_on_promo_list: false,
          is_trusted: false,
          is_high_value: false,
          is_sf_artist: false,
        }]).select().single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        contactId = newContact.id
      }

      // Create review
      const { error: rErr } = await sb.from('reviews').insert([{
        ...review,
        contact_id: contactId,
      }])

      if (rErr) return NextResponse.json({ error: rErr.message }, { status: 400 })

      // Create task
      await sb.from('tasks').insert([{
        title: `New DJ review: ${name} on ${review.catalogue_number || ''}`,
        description: `${name} submitted a ${review.rating}-star review. Review and approve.`,
        urgency: 'today',
        related_release_id: review.release_id,
        related_contact_id: contactId,
        auto_generated: true,
      }])

      return NextResponse.json({ success: true })
    }

    // --- Website contact form ---
    if (action === 'contact_form') {
      const { name, email, type, message } = body
      await sb.from('tasks').insert([{
        title: `Website enquiry: ${name} — ${type}`,
        description: `From: ${name} (${email})\nType: ${type}\n\n${message}`,
        urgency: 'today',
        auto_generated: true,
      }])
      return NextResponse.json({ success: true })
    }

    // --- Portal lookup ---
    if (action === 'portal_lookup') {
      const { email } = body
      const { data: contact } = await sb.from('contacts').select('id, full_name').eq('email', email).single()
      if (!contact) return NextResponse.json({ error: 'No account found' }, { status: 404 })
      return NextResponse.json({ success: true, contact })
    }

    // --- Portal data ---
    if (action === 'portal_data') {
      const { contact_id, email, name } = body

      const [contact, artist, releases, bookings, invoices, promoAccess, reviews] = await Promise.all([
        sb.from('contacts').select('*').eq('id', contact_id).single(),
        sb.from('artists').select('*').eq('contact_id', contact_id).single(),
        sb.from('releases').select('*').eq('artist_name', name).order('created_at', { ascending: false }),
        sb.from('bookings').select('*, artists(stage_name)').eq('contact_email', email).order('event_date', { ascending: false }),
        sb.from('invoices').select('*').eq('recipient_email', email).order('created_at', { ascending: false }),
        sb.from('promo_lists').select('*, releases(catalogue_number, title, artist_name, artwork_url, genre, dropbox_folder_url)').eq('contact_id', contact_id).order('invited_at', { ascending: false }),
        sb.from('reviews').select('*, releases(catalogue_number, title, artist_name)').eq('contact_id', contact_id).order('created_at', { ascending: false }),
      ])

      // Also get bookings by artist
      let allBookings = bookings.data ?? []
      if (artist.data) {
        const { data: artistBookings } = await sb.from('bookings').select('*, artists(stage_name)').eq('artist_id', artist.data.id).order('event_date', { ascending: false })
        allBookings = [...allBookings, ...(artistBookings ?? [])].filter((b, i, arr) => arr.findIndex(x => x.id === b.id) === i)
      }

      // Also get invoices for their bookings
      let allInvoices = invoices.data ?? []
      if (allBookings.length > 0) {
        const { data: bookingInvoices } = await sb.from('invoices').select('*').in('booking_id', allBookings.map((b: any) => b.id))
        allInvoices = [...allInvoices, ...(bookingInvoices ?? [])].filter((inv, i, arr) => arr.findIndex(x => x.id === inv.id) === i)
      }

      return NextResponse.json({
        success: true,
        data: {
          contact: contact.data,
          artist: artist.data,
          releases: releases.data ?? [],
          bookings: allBookings,
          invoices: allInvoices,
          promoAccess: promoAccess.data ?? [],
          reviews: reviews.data ?? [],
        }
      })
    }

    // --- Release lookup for review form ---
    if (action === 'get_releases') {
      const { data } = await sb.from('releases')
        .select('id, catalogue_number, title, artist_name, genre, artwork_url, bpm_range')
        .in('status', ['live', 'scheduled'])
        .order('created_at', { ascending: false })
      return NextResponse.json({ success: true, releases: data ?? [] })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
