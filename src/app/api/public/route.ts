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

      // Create contact (allows duplicate emails for aliases/labels)
      const { data: contactData, error: cErr } = await sb
        .from('contacts')
        .insert([contact])
        .select()
        .single()

      if (cErr) {
        return NextResponse.json({ error: cErr.message }, { status: 400 })
      }

      // Create or update artist
      const { error: aErr } = await sb
        .from('artists')
        .upsert([{ ...artist, contact_id: contactData.id }], { onConflict: 'stage_name' })

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

      // Send welcome email
      try {
        const { sendEmail } = await import('@/lib/email')
        await sendEmail({
          to: contact.email,
          subject: 'Welcome to Shine — Your submission has been received',
          html: `<div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #fff;">
  <div style="font-weight: 900; font-size: 24px; letter-spacing: 0.12em; color: #FF6B35; margin-bottom: 20px;">SHINE</div>
  <div style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px;">Welcome, ${artist.stage_name}</div>
  <p style="font-size: 14px; color: #555; line-height: 1.7; margin-bottom: 16px;">Thanks for submitting your details to Shine. We've received everything and Sharon will review your submission shortly.</p>
  <p style="font-size: 14px; color: #555; line-height: 1.7; margin-bottom: 16px;">Once approved, you'll get access to <strong>Shine Frequency</strong> — your dedicated portal where you can track your releases, see who's playing your music, view DJ feedback, and much more.</p>
  <div style="background: #f8f8f8; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
    <div style="font-size: 13px; color: #888; margin-bottom: 8px;">Your portal login will be:</div>
    <div style="font-size: 14px; color: #1a1a1a;"><strong>${contact.email}</strong></div>
    <div style="font-size: 12px; color: #999; margin-top: 4px;">We'll let you know when your account is active.</div>
  </div>
  <a href="https://shine-frequency.vercel.app/portal" style="display: inline-block; padding: 12px 24px; background: #1D9E75; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">Visit Shine Frequency</a>
  <div style="border-top: 1px solid #eee; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #bbb;">Shine Music — London, UK</div>
</div>`,
        })
      } catch {}

      return NextResponse.json({ success: true, contact_id: contactData.id })
    }

    // --- Promo sign-up ---
    if (action === 'join_promo') {
      const { contact } = body

      let contactData: any
      const { data: inserted, error: cErr } = await sb
        .from('contacts')
        .insert([contact])
        .select()
        .single()

      if (cErr) {
        if (cErr.message?.includes('duplicate') || cErr.code === '23505') {
          // Already registered — update and notify
          const { data: existing } = await sb.from('contacts').select('id').eq('email', contact.email).single()
          if (existing) {
            await sb.from('contacts').update(contact).eq('id', existing.id)
            contactData = existing
          }
        } else {
          return NextResponse.json({ error: cErr.message }, { status: 400 })
        }
      } else {
        contactData = inserted
      }

      if (contactData) {
        await sb.from('tasks').insert([{
          title: `New promo sign-up: ${contact.full_name}`,
          description: `${contact.full_name} (${contact.email}) signed up for promos. ${contact.notes || ''}. Review and approve.`,
          urgency: 'today',
          related_contact_id: contactData.id,
          auto_generated: true,
        }])
      }

      // Send welcome email
      if (contactData && contact.email) {
        try {
          const { sendEmail } = await import('@/lib/email')
          await sendEmail({
            to: contact.email,
            subject: 'Welcome to Shine — Promo access request received',
            html: `<div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #fff;">
  <div style="font-weight: 900; font-size: 24px; letter-spacing: 0.12em; color: #FF6B35; margin-bottom: 20px;">SHINE</div>
  <div style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px;">Welcome, ${contact.full_name}</div>
  <p style="font-size: 14px; color: #555; line-height: 1.7; margin-bottom: 16px;">Thanks for signing up for promo access with Shine. Sharon will review your application and get you set up.</p>
  <p style="font-size: 14px; color: #555; line-height: 1.7; margin-bottom: 16px;">Once approved, you'll receive promo copies of new releases before they drop — with private Dropbox download links, track previews, and the ability to leave structured feedback.</p>
  <div style="background: #f8f8f8; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
    <div style="font-size: 13px; color: #888; margin-bottom: 4px;">What happens next:</div>
    <div style="font-size: 13px; color: #555; line-height: 1.8;">
      1. Sharon reviews your application<br>
      2. You get added to the promo list<br>
      3. New releases land in your inbox with download links<br>
      4. You download, listen, and leave feedback
    </div>
  </div>
  <a href="https://shine-frequency.vercel.app/portal" style="display: inline-block; padding: 12px 24px; background: #1D9E75; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">Access your portal</a>
  <div style="border-top: 1px solid #eee; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #bbb;">Shine Music — London, UK</div>
</div>`,
          })
        } catch {}
      }

      return NextResponse.json({ success: true, contact_id: contactData?.id })
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
      const { email, password } = body

      // Simple password check (demo: password is the email prefix before @)
      // In production, use proper auth (magic link, Supabase Auth, etc.)
      const expectedPass = email.split('@')[0]
      if (password !== expectedPass && password !== 'shine2026') {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
      }

      // Check contacts first
      let contact: any = null
      const { data: c } = await sb.from('contacts').select('id, full_name').eq('email', email).limit(1).single()
      if (c) {
        contact = c
      } else {
        // Check artists table
        const { data: a } = await sb.from('artists').select('id, stage_name, email, contact_id').eq('email', email).limit(1).single()
        if (a) {
          // If artist has a linked contact, use that
          if (a.contact_id) {
            const { data: linkedContact } = await sb.from('contacts').select('id, full_name').eq('id', a.contact_id).single()
            contact = linkedContact || { id: a.id, full_name: a.stage_name }
          } else {
            contact = { id: a.id, full_name: a.stage_name }
          }
        }
      }

      if (!contact) return NextResponse.json({ error: 'No account found with this email' }, { status: 404 })
      return NextResponse.json({ success: true, contact })
    }

    // --- Password reset ---
    if (action === 'password_reset') {
      const { email } = body
      // Check if account exists
      const { data: contact } = await sb.from('contacts').select('id, full_name').eq('email', email).limit(1).single()
      const { data: artist } = await sb.from('artists').select('id, stage_name').eq('email', email).limit(1).single()
      const name = contact?.full_name || artist?.stage_name || 'there'

      if (contact || artist) {
        // Send reset email (demo: just sends the password hint)
        const { sendEmail } = await import('@/lib/email')
        const tempPassword = email.split('@')[0] // demo password
        await sendEmail({
          to: email,
          subject: 'Password Reset — Shine Frequency',
          html: `
<div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #fff;">
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="font-weight: 900; font-size: 20px; letter-spacing: 0.12em; color: #FF6B35;">SHINE</div>
  </div>
  <div style="font-size: 18px; font-weight: 600; color: #1D9E75; text-align: center; margin-bottom: 16px;">Password Reset</div>
  <p style="font-size: 14px; color: #333; line-height: 1.6;">Hi ${name},</p>
  <p style="font-size: 14px; color: #333; line-height: 1.6;">You requested a password reset for your Shine Frequency portal account.</p>
  <div style="background: #f0faf6; border-radius: 10px; padding: 16px 20px; margin: 20px 0; text-align: center;">
    <div style="font-size: 12px; color: #888; margin-bottom: 4px;">Your temporary password</div>
    <div style="font-size: 20px; font-weight: 700; color: #1D9E75; font-family: monospace; letter-spacing: 2px;">${tempPassword}</div>
  </div>
  <p style="font-size: 13px; color: #888; line-height: 1.6;">Use this to log in at <a href="https://shine-frequency.vercel.app/portal" style="color: #1D9E75;">shine-frequency.vercel.app/portal</a></p>
  <div style="border-top: 1px solid #eee; padding-top: 16px; margin-top: 24px; text-align: center;">
    <span style="font-size: 12px; color: #1D9E75; font-weight: 600;">Shine Frequency</span>
    <span style="font-size: 11px; color: #aaa;"> — London, UK</span>
  </div>
</div>`,
        }).catch(() => {})
      }

      return NextResponse.json({ success: true })
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

      // --- Rich stats per release ---
      const releaseStats = []
      for (const rel of (releases.data ?? [])) {
        // Who downloaded (DJs playing it)
        const { data: downloads } = await sb.from('download_events')
          .select('contact_id, contacts(full_name, type, city, country_code, organisation)')
          .eq('release_id', rel.id)

        // Reviews with DJ details
        const { data: relReviews } = await sb.from('reviews')
          .select('rating, body, status, charted, chart_name, is_featured, contacts(full_name, type, city, country_code, organisation)')
          .eq('release_id', rel.id)

        // Promo list stats
        const { data: promos } = await sb.from('promo_lists')
          .select('downloaded_at, reviewed_at, contacts(full_name, city, country_code)')
          .eq('release_id', rel.id)

        // Track stats
        const { data: tracks } = await sb.from('tracks')
          .select('position, title, bpm, key, download_count, play_count, charted_count')
          .eq('release_id', rel.id)
          .order('position')

        // Social posts
        const { data: socials } = await sb.from('social_posts')
          .select('platform, like_count, comment_count, share_count, reach, published_at')
          .eq('release_id', rel.id)

        // Discoveries (from scanner)
        const { data: discoveries } = await sb.from('discoveries')
          .select('*')
          .eq('release_id', rel.id)
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .eq('status', 'published')

        // Build location breakdown
        const locationMap: Record<string, number> = {}
        const djsPlaying: any[] = []
        ;(downloads ?? []).forEach((d: any) => {
          const loc = [d.contacts?.city, d.contacts?.country_code].filter(Boolean).join(', ')
          if (loc) locationMap[loc] = (locationMap[loc] || 0) + 1
          if (d.contacts?.full_name) {
            djsPlaying.push({
              name: d.contacts.full_name,
              type: d.contacts.type,
              city: d.contacts.city,
              country: d.contacts.country_code,
              org: d.contacts.organisation,
            })
          }
        })

        // Unique DJs
        const uniqueDJs = djsPlaying.filter((dj, i, arr) => arr.findIndex(x => x.name === dj.name) === i)

        // Chart entries
        const chartEntries = (relReviews ?? []).filter((r: any) => r.charted && r.chart_name).map((r: any) => ({
          chart: r.chart_name,
          dj: r.contacts?.full_name,
          city: r.contacts?.city,
        }))

        // Featured quotes
        const featuredQuotes = (relReviews ?? [])
          .filter((r: any) => r.status === 'approved' && r.rating >= 4)
          .map((r: any) => ({
            quote: r.body?.split('\n').filter((l: string) => l.length > 20 && !l.startsWith('Overall:') && !l.startsWith('Energy:') && !l.startsWith('Mixability:') && !l.startsWith('Sound quality:') && !l.startsWith('Crowd reaction:') && !l.startsWith('Play context:') && !l.startsWith('Genre fit:') && !l.startsWith('Would chart:') && !l.startsWith('Would play:') && !l.startsWith('Favourite track:') && !l.startsWith('Chart:'))[0] || r.body?.slice(0, 150),
            dj: r.contacts?.full_name,
            org: r.contacts?.organisation,
            city: r.contacts?.city,
            rating: r.rating,
          }))
          .filter((q: any) => q.quote)
          .slice(0, 5)

        // Social reach total
        const totalReach = (socials ?? []).reduce((s: number, p: any) => s + (p.reach || 0), 0)
        const totalLikes = (socials ?? []).reduce((s: number, p: any) => s + (p.like_count || 0), 0)
        const totalShares = (socials ?? []).reduce((s: number, p: any) => s + (p.share_count || 0), 0)

        // Avg rating
        const approvedReviews = (relReviews ?? []).filter((r: any) => r.status === 'approved')
        const avgRating = approvedReviews.length > 0
          ? (approvedReviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / approvedReviews.length).toFixed(1)
          : null

        // Download rate
        const totalPromo = (promos ?? []).length
        const downloaded = (promos ?? []).filter((p: any) => p.downloaded_at).length
        const reviewed = (promos ?? []).filter((p: any) => p.reviewed_at).length

        releaseStats.push({
          id: rel.id,
          catalogue_number: rel.catalogue_number,
          title: rel.title,
          artwork_url: rel.artwork_url,
          status: rel.status,
          heat_status: rel.heat_status,
          genre: rel.genre,
          format: rel.format,
          release_date: rel.release_date,
          // Stats
          djs_playing: uniqueDJs,
          dj_count: uniqueDJs.length,
          locations: Object.entries(locationMap).sort((a, b) => b[1] - a[1]).map(([loc, count]) => ({ location: loc, count })),
          chart_entries: chartEntries,
          chart_count: chartEntries.length,
          featured_quotes: featuredQuotes,
          avg_rating: avgRating,
          total_reviews: (relReviews ?? []).length,
          approved_reviews: approvedReviews.length,
          promo_sent: totalPromo,
          promo_downloaded: downloaded,
          promo_reviewed: reviewed,
          download_rate: totalPromo > 0 ? Math.round((downloaded / totalPromo) * 100) : 0,
          review_rate: totalPromo > 0 ? Math.round((reviewed / totalPromo) * 100) : 0,
          tracks: tracks ?? [],
          social_reach: totalReach,
          social_likes: totalLikes,
          social_shares: totalShares,
          discoveries: (discoveries ?? []).map((d: any) => ({
            platform: d.platform,
            title: d.title,
            url: d.url,
            channel: d.channel,
            views: d.views,
            thumbnail: d.thumbnail,
            plays: d.plays,
            community_want: d.community_want,
            community_have: d.community_have,
            note: d.note,
            discovered_at: d.discovered_at,
          })),
          discovery_count: (discoveries ?? []).length,
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          contact: contact.data,
          artist: artist.data,
          releases: releases.data ?? [],
          releaseStats,
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

    // --- Portal messages ---
    if (action === 'portal_messages') {
      const { contact_id } = body
      const { data } = await sb.from('messages')
        .select('*')
        .eq('contact_id', contact_id)
        .order('created_at', { ascending: true })
      return NextResponse.json({ success: true, messages: data ?? [] })
    }

    if (action === 'portal_send_message') {
      const { contact_id, body: msgBody } = body

      // Save message (inbound = from artist to admin)
      const { error } = await sb.from('messages').insert([{
        contact_id,
        direction: 'inbound',
        channel: 'portal',
        body: msgBody,
        is_read: false,
      }])

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })

      // Get contact name for notification
      const { data: contact } = await sb.from('contacts').select('full_name, email').eq('id', contact_id).single()
      const name = contact?.full_name || 'Unknown'

      // Create task for Sharon so she sees it
      await sb.from('tasks').insert([{
        title: `New message from ${name}`,
        description: `${name} sent a message via portal: "${msgBody.slice(0, 100)}"`,
        urgency: 'today',
        related_contact_id: contact_id,
        auto_generated: true,
      }])

      // Send email notification to Sharon
      try {
        const { sendEmail } = await import('@/lib/email')
        await sendEmail({
          to: process.env.SMTP_USER || 'shineprdev@gmail.com',
          subject: `New portal message from ${name}`,
          html: `
<div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
  <div style="background: #1D9E75; color: #fff; font-weight: 800; font-size: 14px; letter-spacing: 0.12em; padding: 5px 10px; border-radius: 3px; display: inline-block; margin-bottom: 16px;">SHINE</div>
  <div style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px;">New message from ${name}</div>
  <div style="background: #f8f8f8; border-radius: 8px; padding: 16px; margin-bottom: 16px; font-size: 14px; color: #333; line-height: 1.6; border-left: 3px solid #1D9E75;">
    ${msgBody}
  </div>
  <div style="font-size: 13px; color: #888;">
    Reply from your <a href="https://shine-frequency.vercel.app/dashboard/messages" style="color: #1D9E75;">Frequency dashboard</a>
  </div>
  <div style="border-top: 1px solid #eee; padding-top: 12px; margin-top: 16px; font-size: 11px; color: #bbb;">
    Shine Frequency — London, UK
  </div>
</div>`,
        })
      } catch {}

      return NextResponse.json({ success: true })
    }

    // --- Mark portal messages as read ---
    if (action === 'portal_mark_read') {
      const { contact_id } = body
      await sb.from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('contact_id', contact_id)
        .eq('direction', 'outbound')
        .eq('is_read', false)
      return NextResponse.json({ success: true })
    }

    // --- Site content for homepage ---
    if (action === 'get_site_content') {
      const { data } = await sb.from('site_content')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      const grouped: Record<string, any[]> = {}
      for (const item of (data ?? [])) {
        if (!grouped[item.section]) grouped[item.section] = []
        grouped[item.section].push(item.value)
      }
      return NextResponse.json({ success: true, content: grouped })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
