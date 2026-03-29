import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load env
const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) env[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '')
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function seed() {
  console.log('Seeding Shine Frequency demo data...\n')

  // --- STAFF ---
  const { data: staffData } = await supabase.from('staff').select('id').limit(1)
  let staffId = staffData?.[0]?.id
  if (!staffId) {
    const { data } = await supabase.from('staff').insert([
      { email: 'shineprdev@gmail.com', full_name: 'Sharon', role: 'owner', is_active: true }
    ]).select()
    staffId = data?.[0]?.id
  }
  console.log('✓ Staff ready')

  // --- RELEASES ---
  const releases = [
    { catalogue_number: 'SF-041', title: 'Pressure Systems', artist_name: 'Surgeon', label: 'Shine Frequency', status: 'live', release_date: '2026-03-01', promo_window_start: '2026-02-15', promo_window_end: '2026-03-15', heat_status: 'hot', format: 'EP', total_tracks: 4, total_size_mb: 82.5, genre: 'Industrial Techno', bpm_range: '135–142', description: 'Four-track EP of relentless industrial techno from the Birmingham legend.', internal_notes: 'Strong Berghain support. Tier 1 promo sent early.', created_by: staffId },
    { catalogue_number: 'SF-042', title: 'Deconstructed', artist_name: 'Paula Temple', label: 'Shine Frequency', status: 'live', release_date: '2026-03-10', promo_window_start: '2026-02-24', promo_window_end: '2026-04-07', heat_status: 'critical', format: 'EP', total_tracks: 5, total_size_mb: 105.3, genre: 'Noise Techno, EBM', bpm_range: '140–150', description: 'Fierce five-tracker blending noise textures with pounding EBM grooves.', internal_notes: 'Lauren Lo Sung charted A1. Chase remaining T1 contacts.', created_by: staffId },
    { catalogue_number: 'SF-043', title: 'Magnetic North', artist_name: 'Rebekah', label: 'Shine Frequency', status: 'scheduled', release_date: '2026-04-18', promo_window_start: '2026-04-01', promo_window_end: '2026-04-25', heat_status: 'building', format: 'LP', total_tracks: 8, total_size_mb: 195.0, genre: 'Techno', bpm_range: '130–138', description: 'Full-length album exploring darker shades of techno.', internal_notes: 'Artwork pending. Dropbox folder ready.', created_by: staffId },
    { catalogue_number: 'SF-044', title: 'Wet Will Always Dry', artist_name: 'Blawan', label: 'Shine Frequency', status: 'draft', release_date: null, promo_window_start: null, promo_window_end: null, heat_status: 'pending', format: 'EP', total_tracks: 3, total_size_mb: 58.2, genre: 'Broken Techno', bpm_range: '128–135', description: 'Three broken-beat techno cuts.', internal_notes: 'Awaiting final master from Jamie. Expected mid-April.', created_by: staffId },
    { catalogue_number: 'SF-045', title: 'Second Ritual', artist_name: 'Ancient Methods', label: 'Shine Frequency', status: 'in_review', release_date: '2026-05-02', promo_window_start: '2026-04-15', promo_window_end: '2026-05-10', heat_status: 'pending', format: 'EP', total_tracks: 4, total_size_mb: 76.8, genre: 'Dark Techno, Industrial', bpm_range: '132–140', description: 'Ritualistic techno that moves between drone and dancefloor.', internal_notes: 'Contract signed. Waiting for artwork approval.', created_by: staffId },
  ]
  const { data: relData, error: relErr } = await supabase.from('releases').upsert(releases, { onConflict: 'catalogue_number' }).select()
  if (relErr) console.log('Releases error:', relErr.message)
  else console.log(`✓ ${relData.length} releases`)
  const releaseMap = {}
  ;(relData ?? []).forEach(r => { releaseMap[r.catalogue_number] = r.id })

  // --- CONTACTS ---
  const contacts = [
    { full_name: 'Ben Klock', email: 'benklock@berghain.de', type: 'dj', city: 'Berlin', country: 'Germany', country_code: 'DE', organisation: 'Ostgut Ton', is_on_promo_list: true, is_trusted: true, is_high_value: true, is_sf_artist: false, promo_tier: 1 },
    { full_name: 'Marcel Dettmann', email: 'marcel@mdrecords.de', type: 'dj', city: 'Berlin', country: 'Germany', country_code: 'DE', organisation: 'MDR', is_on_promo_list: true, is_trusted: true, is_high_value: true, is_sf_artist: false, promo_tier: 1 },
    { full_name: 'Helena Hauff', email: 'helena@returntoanalog.de', type: 'dj', city: 'Hamburg', country: 'Germany', country_code: 'DE', organisation: 'Return to Analog', is_on_promo_list: true, is_trusted: true, is_high_value: false, is_sf_artist: false, promo_tier: 1 },
    { full_name: 'Perc', email: 'ali@perctrax.com', type: 'producer', city: 'London', country: 'UK', country_code: 'GB', organisation: 'Perc Trax', is_on_promo_list: true, is_trusted: true, is_high_value: true, is_sf_artist: false, promo_tier: 1 },
    { full_name: 'Ansome', email: 'ansome@perc-trax.com', type: 'producer', city: 'London', country: 'UK', country_code: 'GB', is_on_promo_list: true, is_trusted: false, is_high_value: false, is_sf_artist: false, promo_tier: 2 },
    { full_name: 'Lauren Lo Sung', email: 'lauren@djlosung.com', type: 'dj', city: 'London', country: 'UK', country_code: 'GB', is_on_promo_list: true, is_trusted: true, is_high_value: false, is_sf_artist: false, promo_tier: 1 },
    { full_name: 'Dax J', email: 'dax@monnom-black.com', type: 'dj', city: 'London', country: 'UK', country_code: 'GB', organisation: 'Monnom Black', is_on_promo_list: true, is_trusted: false, is_high_value: true, is_sf_artist: false, promo_tier: 1 },
    { full_name: 'Speedy J', email: 'jochem@electricdeluxe.com', type: 'producer', city: 'Rotterdam', country: 'Netherlands', country_code: 'NL', organisation: 'Electric Deluxe', is_on_promo_list: true, is_trusted: true, is_high_value: true, is_sf_artist: false, promo_tier: 1 },
    { full_name: 'Amelie Lens', email: 'amelie@lenske.be', type: 'dj', city: 'Antwerp', country: 'Belgium', country_code: 'BE', organisation: 'Lenske', is_on_promo_list: true, is_trusted: false, is_high_value: false, is_sf_artist: false, promo_tier: 2 },
    { full_name: 'VTSS', email: 'vtss@intrepid.pl', type: 'dj', city: 'Warsaw', country: 'Poland', country_code: 'PL', is_on_promo_list: true, is_trusted: false, is_high_value: false, is_sf_artist: false, promo_tier: 2 },
    { full_name: 'Jeff Mills', email: 'jeff@axisrecords.com', type: 'dj', city: 'Chicago', country: 'USA', country_code: 'US', organisation: 'Axis Records', is_on_promo_list: true, is_trusted: false, is_high_value: true, is_sf_artist: false, promo_tier: 1 },
    { full_name: 'DJ Stingray', email: 'stingray@detroitelectro.com', type: 'dj', city: 'Detroit', country: 'USA', country_code: 'US', is_on_promo_list: true, is_trusted: false, is_high_value: false, is_sf_artist: false, promo_tier: 2 },
    { full_name: 'Fabric London', email: 'bookings@fabriclondon.com', type: 'venue', city: 'London', country: 'UK', country_code: 'GB', organisation: 'Fabric', is_on_promo_list: false, is_trusted: false, is_high_value: true, is_sf_artist: false },
    { full_name: 'Berghain Bookings', email: 'bookings@berghain.de', type: 'venue', city: 'Berlin', country: 'Germany', country_code: 'DE', organisation: 'Berghain', is_on_promo_list: false, is_trusted: false, is_high_value: true, is_sf_artist: false },
    { full_name: 'Tresor Berlin', email: 'bookings@tresorberlin.com', type: 'venue', city: 'Berlin', country: 'Germany', country_code: 'DE', organisation: 'Tresor', is_on_promo_list: false, is_trusted: false, is_high_value: false, is_sf_artist: false },
    { full_name: 'Resident Advisor', email: 'reviews@residentadvisor.net', type: 'press', city: 'London', country: 'UK', country_code: 'GB', organisation: 'RA', is_on_promo_list: true, is_trusted: false, is_high_value: true, is_sf_artist: false, promo_tier: 1 },
    { full_name: 'Inverted Audio', email: 'promos@invertedaudio.com', type: 'press', city: 'London', country: 'UK', country_code: 'GB', organisation: 'Inverted Audio', is_on_promo_list: true, is_trusted: false, is_high_value: false, is_sf_artist: false, promo_tier: 2 },
    { full_name: 'De School Amsterdam', email: 'bookings@deschool.nl', type: 'venue', city: 'Amsterdam', country: 'Netherlands', country_code: 'NL', organisation: 'De School', is_on_promo_list: false, is_trusted: false, is_high_value: false, is_sf_artist: false },
    { full_name: 'Corsica Studios', email: 'bookings@corsica.london', type: 'venue', city: 'London', country: 'UK', country_code: 'GB', organisation: 'Corsica Studios', is_on_promo_list: false, is_trusted: false, is_high_value: false, is_sf_artist: false },
    { full_name: 'Objekt', email: 'tj@objekt.co', type: 'producer', city: 'Berlin', country: 'Germany', country_code: 'DE', is_on_promo_list: true, is_trusted: true, is_high_value: false, is_sf_artist: false, promo_tier: 1 },
  ]
  const { data: ctData, error: ctErr } = await supabase.from('contacts').upsert(contacts, { onConflict: 'email' }).select()
  if (ctErr) console.log('Contacts error:', ctErr.message)
  else console.log(`✓ ${ctData.length} contacts`)
  const contactMap = {}
  ;(ctData ?? []).forEach(c => { contactMap[c.full_name] = c.id })

  // --- ARTISTS ---
  const artists = [
    { stage_name: 'Surgeon', real_name: 'Anthony Child', email: 'surgeon@dynamic-tension.com', standard_fee: 2500, currency: 'GBP', contact_id: null },
    { stage_name: 'Paula Temple', real_name: 'Paula Temple', email: 'paula@noisemanifestation.com', standard_fee: 3000, currency: 'EUR', contact_id: null },
    { stage_name: 'Rebekah', real_name: 'Rebekah Maybank', email: 'rebekah@elements-series.com', standard_fee: 2000, currency: 'GBP', contact_id: null },
    { stage_name: 'Blawan', real_name: 'Jamie Roberts', email: 'blawan@ternesc.com', standard_fee: 3500, currency: 'GBP', contact_id: null },
    { stage_name: 'Ancient Methods', real_name: 'Michael Wollenhaupt', email: 'am@ancientmethods.com', standard_fee: 2000, currency: 'EUR', contact_id: null },
  ]
  const { data: artData, error: artErr } = await supabase.from('artists').upsert(artists, { onConflict: 'stage_name' }).select()
  if (artErr) console.log('Artists error:', artErr.message)
  else console.log(`✓ ${artData.length} artists`)
  const artistMap = {}
  ;(artData ?? []).forEach(a => { artistMap[a.stage_name] = a.id })

  // --- REVIEWS ---
  const reviews = [
    { release_id: releaseMap['SF-041'], contact_id: contactMap['Ben Klock'], status: 'approved', rating: 5, body: 'Absolutely massive. The A1 is pure Berghain material — will be playing this every weekend for the next 6 months. The production quality is outstanding.', charted: true, chart_name: 'Ben Klock Berghain Chart March 2026', is_featured: true, approved_at: '2026-03-05T10:00:00Z' },
    { release_id: releaseMap['SF-041'], contact_id: contactMap['Marcel Dettmann'], status: 'approved', rating: 4, body: 'Strong release. B2 has that hypnotic loop I look for. Will definitely play the A-side at Panorama Bar.', charted: true, chart_name: 'Dettmann March Picks', is_featured: false, approved_at: '2026-03-06T14:00:00Z' },
    { release_id: releaseMap['SF-042'], contact_id: contactMap['Lauren Lo Sung'], status: 'approved', rating: 5, body: 'This is FIERCE. Paula has outdone herself. The noise textures on A1 are incredible — played it at fabric last Friday and the room went mental.', charted: true, chart_name: 'Lo Sung March Top 10', is_featured: true, approved_at: '2026-03-12T09:00:00Z' },
    { release_id: releaseMap['SF-042'], contact_id: contactMap['Dax J'], status: 'approved', rating: 4, body: 'Solid EP. The EBM influence on B1 is very well done. Will be including this in my Monnom Black sets.', charted: false, is_featured: false, approved_at: '2026-03-14T16:00:00Z' },
    { release_id: releaseMap['SF-042'], contact_id: contactMap['Perc'], status: 'pending', rating: 5, body: 'Absolutely destroyed the dancefloor with A2. The sound design is next level. One of the best releases I\'ve heard this year.', charted: false, is_featured: false },
    { release_id: releaseMap['SF-041'], contact_id: contactMap['Helena Hauff'], status: 'pending', rating: 4, body: 'Great EP. The raw analog feel on B1 is exactly what I look for. Perfect for my late-night sets.', charted: false, is_featured: false },
    { release_id: releaseMap['SF-042'], contact_id: contactMap['Resident Advisor'], status: 'pending', rating: 4, body: 'A confident statement of intent from Temple. The EP navigates noise and rhythm with surgical precision. Recommended.', charted: false, is_featured: false },
    { release_id: releaseMap['SF-041'], contact_id: contactMap['Speedy J'], status: 'approved', rating: 5, body: 'Surgeon continues to push boundaries. Every track on this EP could headline a set. The mastering is pristine.', charted: true, chart_name: 'Electric Deluxe Spring Chart', is_featured: false, approved_at: '2026-03-08T11:00:00Z' },
    { release_id: releaseMap['SF-042'], contact_id: contactMap['VTSS'], status: 'pending', rating: 3, body: 'Some interesting moments but feels a bit one-dimensional in places. B2 is the standout for me.', charted: false, is_featured: false },
    { release_id: releaseMap['SF-041'], contact_id: contactMap['Inverted Audio'], status: 'approved', rating: 4, body: 'Another quality release from Shine Frequency. Surgeon delivers four tracks of uncompromising industrial techno that reward repeated listening.', charted: false, is_featured: true, approved_at: '2026-03-10T10:00:00Z' },
  ]
  const { data: rvData, error: rvErr } = await supabase.from('reviews').insert(reviews).select()
  if (rvErr) console.log('Reviews error:', rvErr.message)
  else console.log(`✓ ${rvData.length} reviews`)

  // --- BOOKINGS ---
  const bookings = [
    { artist_id: artistMap['Surgeon'], venue_name: 'Berghain', venue_city: 'Berlin', venue_country: 'DE', event_date: '2026-04-12', set_time: '03:00–05:00', set_length_minutes: 120, fee: 3000, currency: 'EUR', status: 'confirmed', contract_status: 'signed', contract_signed_at: '2026-03-01T10:00:00Z', travel_booked: true, hotel_booked: true, contact_name: 'Berghain Bookings', contact_email: 'bookings@berghain.de', internal_notes: 'Panorama Bar. Sound check at 01:00.', managed_by: staffId },
    { artist_id: artistMap['Paula Temple'], venue_name: 'fabric', venue_city: 'London', venue_country: 'GB', event_date: '2026-04-25', set_time: '02:00–04:00', set_length_minutes: 120, fee: 2500, currency: 'GBP', status: 'confirmed', contract_status: 'sent', travel_booked: false, hotel_booked: false, contact_name: 'Fabric London', contact_email: 'bookings@fabriclondon.com', internal_notes: 'Room One. Need to chase contract.', managed_by: staffId },
    { artist_id: artistMap['Rebekah'], venue_name: 'Tresor', venue_city: 'Berlin', venue_country: 'DE', event_date: '2026-05-09', set_time: '01:00–03:00', set_length_minutes: 120, fee: 2000, currency: 'EUR', status: 'pending', contract_status: 'not_sent', travel_booked: false, hotel_booked: false, contact_name: 'Tresor Berlin', contact_email: 'bookings@tresorberlin.com', internal_notes: 'Album launch event. Discussing support acts.', managed_by: staffId },
    { artist_id: artistMap['Blawan'], venue_name: 'De School', venue_city: 'Amsterdam', venue_country: 'NL', event_date: '2026-05-23', set_time: '00:00–02:00', set_length_minutes: 120, fee: 3000, currency: 'EUR', status: 'enquiry', contract_status: 'not_sent', travel_booked: false, hotel_booked: false, contact_name: 'De School Amsterdam', contact_email: 'bookings@deschool.nl', internal_notes: 'Initial enquiry from venue. Fee negotiation ongoing.', managed_by: staffId },
    { artist_id: artistMap['Ancient Methods'], venue_name: 'Corsica Studios', venue_city: 'London', venue_country: 'GB', event_date: '2026-06-06', set_time: '23:00–01:00', set_length_minutes: 120, fee: 1800, currency: 'GBP', status: 'confirmed', contract_status: 'signed', contract_signed_at: '2026-03-20T14:00:00Z', rider_url: 'https://example.com/rider-am.pdf', rider_received_at: '2026-03-18T10:00:00Z', travel_booked: true, hotel_booked: false, contact_name: 'Corsica Studios', contact_email: 'bookings@corsica.london', internal_notes: 'Support from local DJ TBA. Hotel not needed — staying with friends.', managed_by: staffId },
  ]
  const { data: bkData, error: bkErr } = await supabase.from('bookings').insert(bookings).select()
  if (bkErr) console.log('Bookings error:', bkErr.message)
  else console.log(`✓ ${bkData.length} bookings`)
  const bookingMap = {}
  ;(bkData ?? []).forEach(b => { bookingMap[b.venue_name] = b.id })

  // --- INVOICES ---
  const invoices = [
    { invoice_number: 'SF-INV-001', booking_id: bookingMap['Berghain'], recipient_name: 'Berghain GmbH', recipient_email: 'bookings@berghain.de', line_items: [{ description: 'Surgeon DJ set — Berghain 12 Apr 2026', quantity: 1, unit_price: 3000, total: 3000 }], subtotal: 3000, tax_rate: 0, tax_amount: 0, total: 3000, currency: 'EUR', status: 'paid', issued_at: '2026-03-02T10:00:00Z', due_at: '2026-04-01T10:00:00Z', paid_at: '2026-03-15T09:00:00Z', created_by: staffId },
    { invoice_number: 'SF-INV-002', booking_id: bookingMap['fabric'], recipient_name: 'Fabric London Ltd', recipient_email: 'bookings@fabriclondon.com', line_items: [{ description: 'Paula Temple DJ set — fabric 25 Apr 2026', quantity: 1, unit_price: 2500, total: 2500 }], subtotal: 2500, tax_rate: 20, tax_amount: 500, total: 3000, currency: 'GBP', status: 'sent', issued_at: '2026-03-15T10:00:00Z', due_at: '2026-04-14T10:00:00Z', created_by: staffId },
    { invoice_number: 'SF-INV-003', booking_id: bookingMap['Corsica Studios'], recipient_name: 'Corsica Studios', recipient_email: 'bookings@corsica.london', line_items: [{ description: 'Ancient Methods DJ set — Corsica 6 Jun 2026', quantity: 1, unit_price: 1800, total: 1800 }], subtotal: 1800, tax_rate: 20, tax_amount: 360, total: 2160, currency: 'GBP', status: 'draft', created_by: staffId },
    { invoice_number: 'SF-INV-004', recipient_name: 'Club XYZ', recipient_email: 'accounts@clubxyz.com', line_items: [{ description: 'Rebekah DJ set — cancelled show deposit retention', quantity: 1, unit_price: 500, total: 500 }], subtotal: 500, tax_rate: 20, tax_amount: 100, total: 600, currency: 'GBP', status: 'overdue', issued_at: '2026-02-01T10:00:00Z', due_at: '2026-03-01T10:00:00Z', created_by: staffId },
  ]
  const { data: invData, error: invErr } = await supabase.from('invoices').upsert(invoices, { onConflict: 'invoice_number' }).select()
  if (invErr) console.log('Invoices error:', invErr.message)
  else console.log(`✓ ${invData.length} invoices`)

  // --- TASKS ---
  const tasks = [
    { title: 'Chase fabric contract for Paula Temple', urgency: 'now', related_booking_id: bookingMap['fabric'], assigned_to: staffId },
    { title: 'Follow up on SF-INV-004 — 28 days overdue', urgency: 'now', related_invoice_id: invData?.find(i => i.invoice_number === 'SF-INV-004')?.id, assigned_to: staffId },
    { title: 'Chase remaining Tier 1 reviews for SF-042', urgency: 'today', related_release_id: releaseMap['SF-042'], assigned_to: staffId },
    { title: 'Approve pending reviews for SF-041 and SF-042', urgency: 'today', assigned_to: staffId },
    { title: 'Book hotel for Rebekah Tresor show', urgency: 'this_week', related_booking_id: bookingMap['Tresor'], assigned_to: staffId },
    { title: 'Send contract to Tresor for Rebekah booking', urgency: 'this_week', related_booking_id: bookingMap['Tresor'], assigned_to: staffId },
    { title: 'Finalise artwork for SF-043 Magnetic North', urgency: 'this_week', related_release_id: releaseMap['SF-043'], assigned_to: staffId },
    { title: 'Schedule social posts for SF-042 launch', urgency: 'today', related_release_id: releaseMap['SF-042'], assigned_to: staffId },
  ]
  const { data: tkData, error: tkErr } = await supabase.from('tasks').insert(tasks).select()
  if (tkErr) console.log('Tasks error:', tkErr.message)
  else console.log(`✓ ${tkData.length} tasks`)

  // --- PODCAST EPISODES ---
  const { data: showData } = await supabase.from('podcast_shows').select('id, name')
  const showMap = {}
  ;(showData ?? []).forEach(s => { showMap[s.name] = s.id })

  const episodes = [
    { show_id: showMap['Shine Frequency Radio'], episode_number: 47, title: 'SFR047 — Surgeon Guest Mix', description: 'Surgeon delivers a 90-minute masterclass in industrial techno to celebrate the SF-041 release.', guest_name: 'Surgeon', duration_seconds: 5400, status: 'published', published_at: '2026-03-01T18:00:00Z', play_count: 2847 },
    { show_id: showMap['Shine Frequency Radio'], episode_number: 48, title: 'SFR048 — Paula Temple Special', description: 'Paula Temple takes over with a ferocious mix of noise, EBM, and broken techno ahead of the SF-042 launch.', guest_name: 'Paula Temple', duration_seconds: 5400, status: 'published', published_at: '2026-03-08T18:00:00Z', play_count: 3215 },
    { show_id: showMap['Shine Frequency Radio'], episode_number: 49, title: 'SFR049 — Rebekah Album Preview', description: 'Exclusive first listen of 4 tracks from the upcoming Magnetic North album.', guest_name: 'Rebekah', duration_seconds: 3600, status: 'scheduled', scheduled_at: '2026-04-05T18:00:00Z', play_count: 0 },
    { show_id: showMap['SF Late Night Series'], episode_number: 12, title: 'SFLNS012 — Speedy J Extended Set', description: 'Two hours of deep, hypnotic techno from Rotterdam\'s finest.', guest_name: 'Speedy J', duration_seconds: 7200, status: 'published', published_at: '2026-02-15T22:00:00Z', play_count: 1892 },
    { show_id: showMap['SF Late Night Series'], episode_number: 13, title: 'SFLNS013 — Helena Hauff Electro Session', description: 'Helena Hauff digs deep into her electro crate for a hypnotic late-night session.', guest_name: 'Helena Hauff', duration_seconds: 7200, status: 'published', published_at: '2026-03-15T22:00:00Z', play_count: 2103 },
    { show_id: showMap['SF Late Night Series'], episode_number: 14, title: 'SFLNS014 — Objekt B2B Blawan', description: 'A rare B2B from two of the UK\'s most inventive producers.', guest_name: 'Objekt & Blawan', duration_seconds: 7200, status: 'draft', play_count: 0 },
  ]
  const { data: epData, error: epErr } = await supabase.from('podcast_episodes').insert(episodes).select()
  if (epErr) console.log('Episodes error:', epErr.message)
  else console.log(`✓ ${epData.length} podcast episodes`)

  // --- PROMO LISTS ---
  const promoContacts = ['Ben Klock', 'Marcel Dettmann', 'Helena Hauff', 'Perc', 'Ansome',
    'Lauren Lo Sung', 'Dax J', 'Speedy J', 'Amelie Lens', 'VTSS', 'Jeff Mills',
    'DJ Stingray', 'Resident Advisor', 'Inverted Audio', 'Objekt']
  const promoRows = []
  for (const cat of ['SF-041', 'SF-042']) {
    for (const name of promoContacts) {
      if (!contactMap[name] || !releaseMap[cat]) continue
      const downloaded = Math.random() > 0.3
      const reviewed = downloaded && Math.random() > 0.5
      promoRows.push({
        release_id: releaseMap[cat],
        contact_id: contactMap[name],
        invited_at: cat === 'SF-041' ? '2026-02-15T10:00:00Z' : '2026-02-24T10:00:00Z',
        downloaded_at: downloaded ? (cat === 'SF-041' ? '2026-02-16T14:00:00Z' : '2026-02-25T18:00:00Z') : null,
        reviewed_at: reviewed ? (cat === 'SF-041' ? '2026-02-20T10:00:00Z' : '2026-03-01T10:00:00Z') : null,
        download_count: downloaded ? Math.floor(Math.random() * 5) + 1 : 0,
      })
    }
  }
  const { data: plData, error: plErr } = await supabase.from('promo_lists').upsert(promoRows, { onConflict: 'release_id,contact_id' }).select()
  if (plErr) console.log('Promo lists error:', plErr.message)
  else console.log(`✓ ${plData.length} promo list entries`)

  // --- DOWNLOAD EVENTS ---
  const dlEvents = []
  for (const cat of ['SF-041', 'SF-042']) {
    for (const name of ['Ben Klock', 'Marcel Dettmann', 'Lauren Lo Sung', 'Perc', 'Speedy J', 'Helena Hauff', 'Dax J']) {
      if (!contactMap[name] || !releaseMap[cat]) continue
      dlEvents.push({
        release_id: releaseMap[cat],
        contact_id: contactMap[name],
        delivery_method: 'dropbox',
        file_size_mb: Math.round(Math.random() * 50 + 30),
        downloaded_at: cat === 'SF-041' ? '2026-02-16T14:00:00Z' : '2026-02-25T18:00:00Z',
      })
    }
  }
  const { data: dlData, error: dlErr } = await supabase.from('download_events').insert(dlEvents).select()
  if (dlErr) console.log('Downloads error:', dlErr.message)
  else console.log(`✓ ${dlData.length} download events`)

  // --- MESSAGES ---
  const msgs = [
    { contact_id: contactMap['Ben Klock'], direction: 'outbound', channel: 'email', body: 'Hey Ben — SF-041 is ready for you. Private Dropbox link in the promo email. Let me know what you think!', is_read: true, created_at: '2026-02-15T10:30:00Z' },
    { contact_id: contactMap['Ben Klock'], direction: 'inbound', channel: 'email', body: 'Sharon, this is massive! A1 is going straight into my Berghain set this weekend. Will send a full review tomorrow.', is_read: true, created_at: '2026-02-16T16:00:00Z' },
    { contact_id: contactMap['Ben Klock'], direction: 'inbound', channel: 'email', body: 'Review submitted — 5 stars. Also charted it in my March Berghain chart. Absolute weapon.', is_read: true, created_at: '2026-02-18T09:00:00Z' },
    { contact_id: contactMap['Lauren Lo Sung'], direction: 'outbound', channel: 'email', body: 'Lauren — SF-042 from Paula Temple dropping soon. Sending you early access. This one is FIERCE.', is_read: true, created_at: '2026-02-24T11:00:00Z' },
    { contact_id: contactMap['Lauren Lo Sung'], direction: 'inbound', channel: 'email', body: 'OMG Sharon this is incredible! Played A1 at fabric last night and the room went MENTAL. Review incoming.', is_read: true, created_at: '2026-02-26T02:00:00Z' },
    { contact_id: contactMap['Lauren Lo Sung'], direction: 'inbound', channel: 'email', body: 'Review done — 5 stars, charted it in my March top 10. Can you send me the artwork for an IG story?', is_read: false, created_at: '2026-03-12T09:30:00Z' },
    { contact_id: contactMap['Perc'], direction: 'outbound', channel: 'email', body: 'Ali — SF-042 is out to Tier 1 now. Think you\'ll love this one. Paula at her most ferocious.', is_read: true, created_at: '2026-02-24T11:15:00Z' },
    { contact_id: contactMap['Perc'], direction: 'inbound', channel: 'email', body: 'Cheers Sharon. Downloaded. Will give it a proper listen over the weekend and write something up.', is_read: true, created_at: '2026-02-25T19:00:00Z' },
    { contact_id: contactMap['Perc'], direction: 'inbound', channel: 'email', body: 'Review sent — A2 is absolutely devastating. Sound design is next level. One of the best this year.', is_read: false, created_at: '2026-03-15T10:00:00Z' },
    { contact_id: contactMap['Fabric London'], direction: 'outbound', channel: 'email', body: 'Hi — following up on the Paula Temple booking for 25 April. Can you confirm the contract is with your legal team? Need it signed by end of week ideally.', is_read: true, created_at: '2026-03-20T09:00:00Z' },
    { contact_id: contactMap['Fabric London'], direction: 'inbound', channel: 'email', body: 'Hi Sharon, contract is with our bookings manager. Should have it back to you by Thursday. All looks fine our end.', is_read: true, created_at: '2026-03-21T11:00:00Z' },
    { contact_id: contactMap['Berghain Bookings'], direction: 'inbound', channel: 'email', body: 'Payment for Surgeon booking has been processed. Invoice SF-INV-001 marked as paid. Thank you.', is_read: true, created_at: '2026-03-15T09:30:00Z' },
    { contact_id: contactMap['Resident Advisor'], direction: 'outbound', channel: 'email', body: 'Hi RA team — SF-042 from Paula Temple is out now. Press assets and streaming links attached. Happy to arrange an interview if you\'re interested.', is_read: true, created_at: '2026-03-10T10:00:00Z' },
    { contact_id: contactMap['Resident Advisor'], direction: 'inbound', channel: 'email', body: 'Thanks Sharon. We\'ll have a review up within the next week. Strong release — the team is impressed.', is_read: false, created_at: '2026-03-11T15:00:00Z' },
    { contact_id: contactMap['Amelie Lens'], direction: 'outbound', channel: 'email', body: 'Hey Amelie — sending you SF-041 and SF-042. Think these would work perfectly in your sets. Let me know!', is_read: true, created_at: '2026-02-24T12:00:00Z' },
    { contact_id: contactMap['Jeff Mills'], direction: 'outbound', channel: 'email', body: 'Jeff — new Surgeon EP on Shine Frequency. Four tracks of industrial techno. Thought you\'d appreciate this one. Dropbox link in the promo email.', is_read: true, created_at: '2026-02-15T11:00:00Z' },
  ]
  const validMsgs = msgs.filter(m => m.contact_id)
  const { data: msgData, error: msgErr } = await supabase.from('messages').insert(validMsgs).select()
  if (msgErr) console.log('Messages error:', msgErr.message)
  else console.log(`✓ ${msgData.length} messages`)

  // --- SOCIAL POSTS ---
  const socialPosts = [
    { release_id: releaseMap['SF-041'], platform: 'instagram', status: 'published', caption: 'SF-041 OUT NOW 🔊 Surgeon - Pressure Systems. Four tracks of relentless industrial techno. Link in bio.', hashtags: ['techno', 'industrialtechno', 'surgeon', 'shinefrequency', 'newrelease'], scheduled_at: '2026-03-01T12:00:00Z', published_at: '2026-03-01T12:00:00Z', like_count: 847, comment_count: 32, share_count: 156, reach: 12400 },
    { release_id: releaseMap['SF-041'], platform: 'twitter', status: 'published', caption: 'SF-041 — Surgeon "Pressure Systems" is out now. Industrial techno at its finest. Available on all platforms.', hashtags: ['techno', 'surgeon'], scheduled_at: '2026-03-01T12:05:00Z', published_at: '2026-03-01T12:05:00Z', like_count: 234, comment_count: 18, share_count: 89, reach: 5600 },
    { release_id: releaseMap['SF-042'], platform: 'instagram', status: 'published', caption: 'SF-042 🔥 Paula Temple - Deconstructed. Five tracks of noise, EBM and broken techno. This one is FIERCE.', hashtags: ['paulatemple', 'noisetechno', 'ebm', 'shinefrequency', 'deconstructed'], scheduled_at: '2026-03-10T12:00:00Z', published_at: '2026-03-10T12:00:00Z', like_count: 1203, comment_count: 56, share_count: 289, reach: 18700 },
    { release_id: releaseMap['SF-042'], platform: 'twitter', status: 'published', caption: 'SF-042 — Paula Temple "Deconstructed" out now. Noise meets dancefloor. Not for the faint-hearted.', hashtags: ['paulatemple', 'techno'], scheduled_at: '2026-03-10T12:05:00Z', published_at: '2026-03-10T12:05:00Z', like_count: 312, comment_count: 24, share_count: 134, reach: 7800 },
    { release_id: releaseMap['SF-042'], platform: 'soundcloud', status: 'published', caption: 'Preview — Paula Temple "Deconstructed" EP. Full release out now on Shine Frequency.', hashtags: ['paulatemple', 'shinefrequency'], scheduled_at: '2026-03-10T13:00:00Z', published_at: '2026-03-10T13:00:00Z', like_count: 567, comment_count: 43, share_count: 0, reach: 9200 },
    { release_id: releaseMap['SF-043'], platform: 'instagram', status: 'scheduled', caption: 'SF-043 — Rebekah "Magnetic North" LP. Full album coming 18 April. Pre-save link in bio.', hashtags: ['rebekah', 'techno', 'album', 'shinefrequency', 'magneticnorth'], scheduled_at: '2026-04-04T12:00:00Z', like_count: 0, comment_count: 0, share_count: 0, reach: 0 },
    { release_id: releaseMap['SF-043'], platform: 'twitter', status: 'scheduled', caption: 'Incoming: Rebekah "Magnetic North" LP on Shine Frequency. 8 tracks of darker-shade techno. 18 April.', hashtags: ['rebekah', 'techno'], scheduled_at: '2026-04-04T12:05:00Z', like_count: 0, comment_count: 0, share_count: 0, reach: 0 },
    { release_id: releaseMap['SF-041'], platform: 'instagram', status: 'published', caption: 'Ben Klock charted SF-041 in his March Berghain chart 🙌 "Absolutely massive — pure Berghain material"', hashtags: ['benklock', 'berghain', 'surgeon', 'shinefrequency', 'charted'], scheduled_at: '2026-03-06T15:00:00Z', published_at: '2026-03-06T15:00:00Z', like_count: 1456, comment_count: 67, share_count: 312, reach: 22100 },
  ]
  const { data: spData, error: spErr } = await supabase.from('social_posts').insert(socialPosts).select()
  if (spErr) console.log('Social posts error:', spErr.message)
  else console.log(`✓ ${spData.length} social posts`)

  // --- CAMPAIGNS ---
  const campaigns = [
    { release_id: releaseMap['SF-041'], name: 'SF-041 Tier 1 Dropbox blast', platform: 'dropbox', status: 'sent', sent_at: '2026-02-15T10:00:00Z', recipient_count: 12, open_count: 11, click_count: 9 },
    { release_id: releaseMap['SF-041'], name: 'SF-041 Tier 2 follow-up', platform: 'dropbox', status: 'sent', sent_at: '2026-02-18T10:00:00Z', recipient_count: 8, open_count: 6, click_count: 4 },
    { release_id: releaseMap['SF-042'], name: 'SF-042 Tier 1 Dropbox blast', platform: 'dropbox', status: 'sent', sent_at: '2026-02-24T10:00:00Z', recipient_count: 12, open_count: 10, click_count: 8 },
    { release_id: releaseMap['SF-042'], name: 'SF-042 SoundCloud promo', platform: 'soundcloud', status: 'sent', sent_at: '2026-03-10T13:00:00Z', recipient_count: 20, open_count: 15, click_count: 12 },
    { release_id: releaseMap['SF-043'], name: 'SF-043 Tier 1 pre-release', platform: 'dropbox', status: 'scheduled', scheduled_at: '2026-04-01T10:00:00Z', recipient_count: 12 },
  ]
  const { data: cpData, error: cpErr } = await supabase.from('campaigns').insert(campaigns).select()
  if (cpErr) console.log('Campaigns error:', cpErr.message)
  else console.log(`✓ ${cpData.length} campaigns`)

  // --- TRACKS ---
  const tracks = [
    // SF-041 Surgeon
    { release_id: releaseMap['SF-041'], position: 'A1', title: 'Pressure Lock', duration_seconds: 412, bpm: 138, key: 'Am', file_size_mb: 22.1, download_count: 9, play_count: 47, review_count: 4, charted_count: 3 },
    { release_id: releaseMap['SF-041'], position: 'A2', title: 'Compression Wave', duration_seconds: 387, bpm: 140, key: 'Bm', file_size_mb: 20.8, download_count: 7, play_count: 31, review_count: 2, charted_count: 1 },
    { release_id: releaseMap['SF-041'], position: 'B1', title: 'Raw Signal', duration_seconds: 445, bpm: 135, key: 'Dm', file_size_mb: 21.3, download_count: 8, play_count: 38, review_count: 3, charted_count: 2 },
    { release_id: releaseMap['SF-041'], position: 'B2', title: 'Hydraulic', duration_seconds: 398, bpm: 142, key: 'Em', file_size_mb: 18.3, download_count: 6, play_count: 22, review_count: 1, charted_count: 1 },
    // SF-042 Paula Temple
    { release_id: releaseMap['SF-042'], position: 'A1', title: 'Deconstruct', duration_seconds: 456, bpm: 145, key: 'Cm', file_size_mb: 24.5, download_count: 8, play_count: 52, review_count: 3, charted_count: 2 },
    { release_id: releaseMap['SF-042'], position: 'A2', title: 'Noise Architecture', duration_seconds: 410, bpm: 142, key: 'Am', file_size_mb: 22.0, download_count: 7, play_count: 41, review_count: 4, charted_count: 1 },
    { release_id: releaseMap['SF-042'], position: 'B1', title: 'EBM Protocol', duration_seconds: 378, bpm: 140, key: 'Fm', file_size_mb: 19.8, download_count: 6, play_count: 28, review_count: 2, charted_count: 1 },
    { release_id: releaseMap['SF-042'], position: 'B2', title: 'Fractured State', duration_seconds: 425, bpm: 148, key: 'Gm', file_size_mb: 21.2, download_count: 5, play_count: 19, review_count: 2, charted_count: 0 },
    { release_id: releaseMap['SF-042'], position: 'C1', title: 'Aftermath', duration_seconds: 502, bpm: 150, key: 'Dm', file_size_mb: 17.8, download_count: 4, play_count: 15, review_count: 1, charted_count: 0 },
  ]
  const validTracks = tracks.filter(t => t.release_id)
  const { data: trData, error: trErr } = await supabase.from('tracks').insert(validTracks).select()
  if (trErr) console.log('Tracks error:', trErr.message)
  else console.log(`✓ ${trData.length} tracks`)

  // --- AUDIT LOG ---
  const auditEntries = [
    { actor_email: 'shineprdev@gmail.com', action: 'create', module: 'releases', record_type: 'release', created_at: '2026-02-10T09:00:00Z' },
    { actor_email: 'shineprdev@gmail.com', action: 'update', module: 'releases', record_type: 'release', created_at: '2026-02-15T10:00:00Z' },
    { actor_email: 'shineprdev@gmail.com', action: 'create', module: 'bookings', record_type: 'booking', created_at: '2026-02-20T14:00:00Z' },
    { actor_email: 'shineprdev@gmail.com', action: 'create', module: 'invoices', record_type: 'invoice', created_at: '2026-03-02T10:00:00Z' },
    { actor_email: 'shineprdev@gmail.com', action: 'approve', module: 'reviews', record_type: 'review', created_at: '2026-03-05T10:00:00Z' },
    { actor_email: 'shineprdev@gmail.com', action: 'update', module: 'bookings', record_type: 'booking', created_at: '2026-03-10T11:00:00Z' },
    { actor_email: 'shineprdev@gmail.com', action: 'create', module: 'contacts', record_type: 'contact', created_at: '2026-03-12T09:00:00Z' },
    { actor_email: 'shineprdev@gmail.com', action: 'send', module: 'campaigns', record_type: 'campaign', created_at: '2026-03-15T10:00:00Z' },
  ]
  const { error: auditErr } = await supabase.from('audit_log').insert(auditEntries)
  if (auditErr) console.log('Audit log error:', auditErr.message)
  else console.log(`✓ ${auditEntries.length} audit log entries`)

  // --- UPDATE CONTACT STATS ---
  // Update download/review counts on contacts based on the data we inserted
  for (const name of Object.keys(contactMap)) {
    const cid = contactMap[name]
    const { count: dlCount } = await supabase.from('download_events').select('*', { count: 'exact', head: true }).eq('contact_id', cid)
    const { count: rvCount } = await supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('contact_id', cid)
    const { data: rvAvg } = await supabase.from('reviews').select('rating').eq('contact_id', cid)
    const avg = rvAvg && rvAvg.length > 0 ? (rvAvg.reduce((s, r) => s + (r.rating ?? 0), 0) / rvAvg.length).toFixed(2) : null
    await supabase.from('contacts').update({
      total_downloads: dlCount ?? 0,
      total_reviews: rvCount ?? 0,
      avg_rating: avg,
      last_active_at: dlCount > 0 ? '2026-03-15T10:00:00Z' : null,
    }).eq('id', cid)
  }
  console.log('✓ Contact stats updated')

  console.log('\n✅ Seed complete!')
}

seed().catch(console.error)
