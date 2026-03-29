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

  console.log('\n✅ Seed complete!')
}

seed().catch(console.error)
