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

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
