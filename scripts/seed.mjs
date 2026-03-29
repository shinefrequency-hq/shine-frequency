import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) env[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '')
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function seed() {
  console.log('Seeding Shine Frequency — full demo data...\n')

  // Clean existing data (order matters for FK constraints)
  for (const table of ['audit_log', 'download_events', 'reviews', 'promo_lists', 'tracks',
    'messages', 'social_posts', 'campaigns', 'podcast_episodes', 'tasks',
    'invoices', 'bookings']) {
    await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
  }
  console.log('✓ Cleaned existing data')

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

  // --- 30 RELEASES ---
  const releases = [
    // Current / active (SF-041 to SF-045)
    { catalogue_number: 'SF-041', title: 'Pressure Systems', artist_name: 'Surgeon', status: 'live', release_date: '2026-03-01', promo_window_start: '2026-02-15', promo_window_end: '2026-03-15', heat_status: 'hot', format: 'EP', total_tracks: 4, total_size_mb: 82.5, genre: 'Industrial Techno', bpm_range: '135–142', artwork_url: '/artwork/sf-041.svg', description: 'Four-track EP of relentless industrial techno from the Birmingham legend.', internal_notes: 'Strong Berghain support. Tier 1 promo sent early.', created_by: staffId },
    { catalogue_number: 'SF-042', title: 'Deconstructed', artist_name: 'Paula Temple', status: 'live', release_date: '2026-03-10', promo_window_start: '2026-02-24', promo_window_end: '2026-04-07', heat_status: 'critical', format: 'EP', total_tracks: 5, total_size_mb: 105.3, genre: 'Noise Techno, EBM', bpm_range: '140–150', artwork_url: '/artwork/sf-042.svg', description: 'Fierce five-tracker blending noise textures with pounding EBM grooves.', internal_notes: 'Lauren Lo Sung charted A1. Chase remaining T1 contacts.', created_by: staffId },
    { catalogue_number: 'SF-043', title: 'Magnetic North', artist_name: 'Rebekah', status: 'scheduled', release_date: '2026-04-18', promo_window_start: '2026-04-01', promo_window_end: '2026-04-25', heat_status: 'building', format: 'LP', total_tracks: 8, total_size_mb: 195.0, genre: 'Techno', bpm_range: '130–138', artwork_url: '/artwork/sf-043.svg', description: 'Full-length album exploring darker shades of techno.', internal_notes: 'Artwork pending. Dropbox folder ready.', created_by: staffId },
    { catalogue_number: 'SF-044', title: 'Wet Will Always Dry', artist_name: 'Blawan', status: 'draft', heat_status: 'pending', format: 'EP', total_tracks: 3, total_size_mb: 58.2, genre: 'Broken Techno', bpm_range: '128–135', artwork_url: '/artwork/sf-044.svg', description: 'Three broken-beat techno cuts.', internal_notes: 'Awaiting final master from Jamie. Expected mid-April.', created_by: staffId },
    { catalogue_number: 'SF-045', title: 'Second Ritual', artist_name: 'Ancient Methods', status: 'in_review', release_date: '2026-05-02', promo_window_start: '2026-04-15', promo_window_end: '2026-05-10', heat_status: 'pending', format: 'EP', total_tracks: 4, total_size_mb: 76.8, genre: 'Dark Techno, Industrial', bpm_range: '132–140', artwork_url: '/artwork/sf-045.svg', description: 'Ritualistic techno that moves between drone and dancefloor.', internal_notes: 'Contract signed. Waiting for artwork approval.', created_by: staffId },
    // Back catalogue (SF-011 to SF-040)
    { catalogue_number: 'SF-040', title: 'Vortex Chamber', artist_name: 'Surgeon', status: 'live', release_date: '2026-01-15', heat_status: 'warm', format: 'EP', total_tracks: 4, total_size_mb: 78.0, genre: 'Industrial Techno', bpm_range: '136–142', created_by: staffId },
    { catalogue_number: 'SF-039', title: 'Acid Symmetry', artist_name: 'Helena Hauff', status: 'live', release_date: '2025-12-01', heat_status: 'closed', format: 'EP', total_tracks: 4, total_size_mb: 65.0, genre: 'Acid Techno, Electro', bpm_range: '130–138', created_by: staffId },
    { catalogue_number: 'SF-038', title: 'Endurance Test', artist_name: 'Perc', status: 'live', release_date: '2025-11-10', heat_status: 'closed', format: 'EP', total_tracks: 5, total_size_mb: 92.0, genre: 'Industrial Techno', bpm_range: '138–145', created_by: staffId },
    { catalogue_number: 'SF-037', title: 'Cold Storage', artist_name: 'Dax J', status: 'live', release_date: '2025-10-18', heat_status: 'closed', format: 'EP', total_tracks: 4, total_size_mb: 70.0, genre: 'Hard Techno', bpm_range: '140–148', created_by: staffId },
    { catalogue_number: 'SF-036', title: 'Signal Path', artist_name: 'Objekt', status: 'live', release_date: '2025-09-20', heat_status: 'closed', format: 'EP', total_tracks: 3, total_size_mb: 55.0, genre: 'Experimental Techno', bpm_range: '125–135', created_by: staffId },
    { catalogue_number: 'SF-035', title: 'Phantom Frequency', artist_name: 'Paula Temple', status: 'live', release_date: '2025-08-15', heat_status: 'closed', format: 'EP', total_tracks: 4, total_size_mb: 88.0, genre: 'Noise Techno', bpm_range: '142–150', created_by: staffId },
    { catalogue_number: 'SF-034', title: 'Iron Curtain', artist_name: 'Rebekah', status: 'live', release_date: '2025-07-25', heat_status: 'closed', format: 'Single', total_tracks: 2, total_size_mb: 32.0, genre: 'Techno', bpm_range: '132–136', created_by: staffId },
    { catalogue_number: 'SF-033', title: 'Ternesc Systems', artist_name: 'Blawan', status: 'live', release_date: '2025-06-12', heat_status: 'closed', format: 'EP', total_tracks: 4, total_size_mb: 72.0, genre: 'Broken Techno', bpm_range: '126–134', created_by: staffId },
    { catalogue_number: 'SF-032', title: 'Depth Charge', artist_name: 'Ansome', status: 'live', release_date: '2025-05-08', heat_status: 'closed', format: 'EP', total_tracks: 4, total_size_mb: 68.0, genre: 'Industrial Techno', bpm_range: '135–142', created_by: staffId },
    { catalogue_number: 'SF-031', title: 'Machine Prayer', artist_name: 'Ancient Methods', status: 'live', release_date: '2025-04-20', heat_status: 'closed', format: 'EP', total_tracks: 4, total_size_mb: 74.0, genre: 'Dark Techno', bpm_range: '130–138', created_by: staffId },
    { catalogue_number: 'SF-030', title: 'Black Horizon', artist_name: 'Surgeon', status: 'live', release_date: '2025-03-15', heat_status: 'closed', format: 'LP', total_tracks: 10, total_size_mb: 220.0, genre: 'Industrial Techno', bpm_range: '130–145', created_by: staffId },
    { catalogue_number: 'SF-029', title: 'Flux State', artist_name: 'Speedy J', status: 'live', release_date: '2025-02-10', heat_status: 'closed', format: 'EP', total_tracks: 4, total_size_mb: 80.0, genre: 'Hypnotic Techno', bpm_range: '128–134', created_by: staffId },
    { catalogue_number: 'SF-028', title: 'Wire Mesh', artist_name: 'Perc', status: 'live', release_date: '2025-01-18', heat_status: 'closed', format: 'EP', total_tracks: 3, total_size_mb: 52.0, genre: 'Industrial Techno', bpm_range: '136–144', created_by: staffId },
    { catalogue_number: 'SF-027', title: 'Nocturne', artist_name: 'Helena Hauff', status: 'live', release_date: '2024-12-05', heat_status: 'closed', format: 'EP', total_tracks: 4, total_size_mb: 66.0, genre: 'Electro, Acid', bpm_range: '128–136', created_by: staffId },
    { catalogue_number: 'SF-026', title: 'Tectonic Shift', artist_name: 'Dax J', status: 'live', release_date: '2024-11-15', heat_status: 'closed', format: 'EP', total_tracks: 5, total_size_mb: 90.0, genre: 'Hard Techno', bpm_range: '142–150', created_by: staffId },
    { catalogue_number: 'SF-025', title: 'Object Permanence', artist_name: 'Objekt', status: 'live', release_date: '2024-10-20', heat_status: 'closed', format: 'EP', total_tracks: 3, total_size_mb: 48.0, genre: 'Experimental', bpm_range: '120–132', created_by: staffId },
    { catalogue_number: 'SF-024', title: 'Desolation Row', artist_name: 'Paula Temple', status: 'live', release_date: '2024-09-08', heat_status: 'closed', format: 'EP', total_tracks: 4, total_size_mb: 85.0, genre: 'Noise Techno', bpm_range: '140–148', created_by: staffId },
    { catalogue_number: 'SF-023', title: 'Axis Shift', artist_name: 'Rebekah', status: 'archived', release_date: '2024-08-12', heat_status: 'closed', format: 'EP', total_tracks: 4, total_size_mb: 70.0, genre: 'Techno', bpm_range: '130–136', created_by: staffId },
    { catalogue_number: 'SF-022', title: 'Rotary', artist_name: 'Blawan', status: 'archived', release_date: '2024-07-05', heat_status: 'closed', format: 'EP', total_tracks: 3, total_size_mb: 54.0, genre: 'Broken Techno', bpm_range: '126–132', created_by: staffId },
    { catalogue_number: 'SF-021', title: 'Corrosion', artist_name: 'Ansome', status: 'archived', release_date: '2024-06-20', heat_status: 'closed', format: 'Single', total_tracks: 2, total_size_mb: 28.0, genre: 'Industrial', bpm_range: '138–142', created_by: staffId },
    { catalogue_number: 'SF-020', title: 'Monolith', artist_name: 'Surgeon', status: 'archived', release_date: '2024-05-10', heat_status: 'closed', format: 'EP', total_tracks: 4, total_size_mb: 76.0, genre: 'Industrial Techno', bpm_range: '134–140', created_by: staffId },
    { catalogue_number: 'SF-019', title: 'Subliminal', artist_name: 'VTSS', status: 'archived', release_date: '2024-04-15', heat_status: 'closed', format: 'EP', total_tracks: 4, total_size_mb: 72.0, genre: 'EBM, Techno', bpm_range: '130–138', created_by: staffId },
    { catalogue_number: 'SF-018', title: 'Parallax', artist_name: 'Speedy J', status: 'archived', release_date: '2024-03-01', heat_status: 'closed', format: 'EP', total_tracks: 3, total_size_mb: 58.0, genre: 'Hypnotic Techno', bpm_range: '126–132', created_by: staffId },
    { catalogue_number: 'SF-017', title: 'Oscillate', artist_name: 'Ancient Methods', status: 'archived', release_date: '2024-02-10', heat_status: 'closed', format: 'EP', total_tracks: 4, total_size_mb: 68.0, genre: 'Dark Techno', bpm_range: '132–140', created_by: staffId },
    { catalogue_number: 'SF-016', title: 'Subterranean', artist_name: 'Lauren Lo Sung', status: 'archived', release_date: '2024-01-20', heat_status: 'closed', format: 'EP', total_tracks: 4, total_size_mb: 64.0, genre: 'Techno', bpm_range: '128–134', created_by: staffId },
  ]
  releases.forEach(r => { r.label = r.label || 'Shine Frequency' })
  const { data: relData, error: relErr } = await supabase.from('releases').upsert(releases, { onConflict: 'catalogue_number' }).select()
  if (relErr) console.log('Releases error:', relErr.message)
  else console.log(`✓ ${relData.length} releases`)
  const releaseMap = {}
  ;(relData ?? []).forEach(r => { releaseMap[r.catalogue_number] = r.id })

  // --- CONTACTS (40+) ---
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
    { full_name: 'Objekt', email: 'tj@objekt.co', type: 'producer', city: 'Berlin', country: 'Germany', country_code: 'DE', is_on_promo_list: true, is_trusted: true, is_high_value: false, is_sf_artist: false, promo_tier: 1 },
    { full_name: 'Phase', email: 'phase@tokenrecords.com', type: 'producer', city: 'London', country: 'UK', country_code: 'GB', organisation: 'Token', is_on_promo_list: true, is_trusted: false, is_high_value: false, is_sf_artist: false, promo_tier: 2 },
    { full_name: 'Truncate', email: 'truncate@50weapons.com', type: 'producer', city: 'Los Angeles', country: 'USA', country_code: 'US', is_on_promo_list: true, is_trusted: false, is_high_value: false, is_sf_artist: false, promo_tier: 2 },
    { full_name: 'I Hate Models', email: 'ihm@music.com', type: 'dj', city: 'Paris', country: 'France', country_code: 'FR', organisation: 'Music', is_on_promo_list: true, is_trusted: false, is_high_value: true, is_sf_artist: false, promo_tier: 1 },
    { full_name: 'Kobosil', email: 'kobosil@ostgut.de', type: 'dj', city: 'Berlin', country: 'Germany', country_code: 'DE', organisation: 'Ostgut Ton', is_on_promo_list: true, is_trusted: false, is_high_value: false, is_sf_artist: false, promo_tier: 1 },
    { full_name: 'DVS1', email: 'dvs1@mistress.us', type: 'dj', city: 'Minneapolis', country: 'USA', country_code: 'US', organisation: 'Mistress', is_on_promo_list: true, is_trusted: true, is_high_value: false, is_sf_artist: false, promo_tier: 1 },
    { full_name: 'Kas:st', email: 'kasst@music.fr', type: 'producer', city: 'Lyon', country: 'France', country_code: 'FR', is_on_promo_list: true, is_trusted: false, is_high_value: false, is_sf_artist: false, promo_tier: 2 },
    { full_name: 'KAS:ST', email: 'info@afterlifeofc.com', type: 'label', city: 'Amsterdam', country: 'Netherlands', country_code: 'NL', organisation: 'Afterlife', is_on_promo_list: true, is_trusted: false, is_high_value: false, is_sf_artist: false, promo_tier: 3 },
    // Venues
    { full_name: 'Fabric London', email: 'bookings@fabriclondon.com', type: 'venue', city: 'London', country: 'UK', country_code: 'GB', organisation: 'Fabric', is_high_value: true , is_on_promo_list: false, is_trusted: false, is_sf_artist: false},
    { full_name: 'Berghain Bookings', email: 'bookings@berghain.de', type: 'venue', city: 'Berlin', country: 'Germany', country_code: 'DE', organisation: 'Berghain', is_high_value: true , is_on_promo_list: false, is_trusted: false, is_sf_artist: false},
    { full_name: 'Tresor Berlin', email: 'bookings@tresorberlin.com', type: 'venue', city: 'Berlin', country: 'Germany', country_code: 'DE', organisation: 'Tresor' , is_on_promo_list: false, is_trusted: false, is_high_value: false, is_sf_artist: false},
    { full_name: 'De School Amsterdam', email: 'bookings@deschool.nl', type: 'venue', city: 'Amsterdam', country: 'Netherlands', country_code: 'NL', organisation: 'De School' , is_on_promo_list: false, is_trusted: false, is_high_value: false, is_sf_artist: false},
    { full_name: 'Corsica Studios', email: 'bookings@corsica.london', type: 'venue', city: 'London', country: 'UK', country_code: 'GB', organisation: 'Corsica Studios' , is_on_promo_list: false, is_trusted: false, is_high_value: false, is_sf_artist: false},
    { full_name: 'Printworks London', email: 'bookings@printworks.london', type: 'venue', city: 'London', country: 'UK', country_code: 'GB', organisation: 'Printworks', is_high_value: true , is_on_promo_list: false, is_trusted: false, is_sf_artist: false},
    { full_name: 'Warehouse Project', email: 'bookings@thewarehouseproject.com', type: 'venue', city: 'Manchester', country: 'UK', country_code: 'GB', organisation: 'WHP', is_high_value: true , is_on_promo_list: false, is_trusted: false, is_sf_artist: false},
    { full_name: 'Ankali Prague', email: 'bookings@ankali.cz', type: 'venue', city: 'Prague', country: 'Czech Republic', country_code: 'CZ', organisation: 'Ankali' , is_on_promo_list: false, is_trusted: false, is_high_value: false, is_sf_artist: false},
    // Press
    { full_name: 'Resident Advisor', email: 'reviews@residentadvisor.net', type: 'press', city: 'London', country: 'UK', country_code: 'GB', organisation: 'RA', is_on_promo_list: true, is_trusted: false, is_high_value: true, is_sf_artist: false, promo_tier: 1 },
    { full_name: 'Inverted Audio', email: 'promos@invertedaudio.com', type: 'press', city: 'London', country: 'UK', country_code: 'GB', organisation: 'Inverted Audio', is_on_promo_list: true, is_trusted: false, is_high_value: false, is_sf_artist: false, promo_tier: 2 },
    { full_name: 'DJ Mag', email: 'reviews@djmag.com', type: 'press', city: 'London', country: 'UK', country_code: 'GB', organisation: 'DJ Mag', is_on_promo_list: true, is_trusted: false, is_high_value: true, is_sf_artist: false, promo_tier: 1 },
    { full_name: 'Mixmag', email: 'reviews@mixmag.net', type: 'press', city: 'London', country: 'UK', country_code: 'GB', organisation: 'Mixmag', is_on_promo_list: true, is_trusted: false, is_high_value: false, is_sf_artist: false, promo_tier: 1 },
    { full_name: 'Decoded Magazine', email: 'promos@decodedmag.com', type: 'press', city: 'London', country: 'UK', country_code: 'GB', organisation: 'Decoded', is_on_promo_list: true, is_trusted: false, is_high_value: false, is_sf_artist: false, promo_tier: 2 },
    // Promoters
    { full_name: 'Junction 2 Festival', email: 'bookings@junction2.london', type: 'promoter', city: 'London', country: 'UK', country_code: 'GB', organisation: 'Junction 2', is_high_value: true , is_on_promo_list: false, is_trusted: false, is_sf_artist: false},
    { full_name: 'Awakenings', email: 'info@awakenings.nl', type: 'promoter', city: 'Amsterdam', country: 'Netherlands', country_code: 'NL', organisation: 'Awakenings', is_high_value: true , is_on_promo_list: false, is_trusted: false, is_sf_artist: false},
  ]
  const { data: ctData, error: ctErr } = await supabase.from('contacts').upsert(contacts, { onConflict: 'email' }).select()
  if (ctErr) console.log('Contacts error:', ctErr.message)
  else console.log(`✓ ${ctData.length} contacts`)
  const contactMap = {}
  ;(ctData ?? []).forEach(c => { contactMap[c.full_name] = c.id })

  // --- ARTISTS ---
  const artists = [
    { stage_name: 'Surgeon', real_name: 'Anthony Child', email: 'surgeon@dynamic-tension.com', standard_fee: 2500, currency: 'GBP' },
    { stage_name: 'Paula Temple', real_name: 'Paula Temple', email: 'paula@noisemanifestation.com', standard_fee: 3000, currency: 'EUR' },
    { stage_name: 'Rebekah', real_name: 'Rebekah Maybank', email: 'rebekah@elements-series.com', standard_fee: 2000, currency: 'GBP' },
    { stage_name: 'Blawan', real_name: 'Jamie Roberts', email: 'blawan@ternesc.com', standard_fee: 3500, currency: 'GBP' },
    { stage_name: 'Ancient Methods', real_name: 'Michael Wollenhaupt', email: 'am@ancientmethods.com', standard_fee: 2000, currency: 'EUR' },
    { stage_name: 'Helena Hauff', real_name: 'Helena Hauff', email: 'helena@returntoanalog.de', standard_fee: 4000, currency: 'EUR' },
    { stage_name: 'Perc', real_name: 'Ali Wells', email: 'ali@perctrax.com', standard_fee: 2000, currency: 'GBP' },
  ]
  const { data: artData, error: artErr } = await supabase.from('artists').upsert(artists, { onConflict: 'stage_name' }).select()
  if (artErr) console.log('Artists error:', artErr.message)
  else console.log(`✓ ${artData.length} artists`)
  const artistMap = {}
  ;(artData ?? []).forEach(a => { artistMap[a.stage_name] = a.id })

  // --- BOOKINGS (10) ---
  const bookings = [
    { artist_id: artistMap['Surgeon'], venue_name: 'Berghain', venue_city: 'Berlin', venue_country: 'DE', event_date: '2026-04-12', set_time: '03:00–05:00', set_length_minutes: 120, fee: 3000, currency: 'EUR', status: 'confirmed', contract_status: 'signed', contract_signed_at: '2026-03-01T10:00:00Z', travel_booked: true, hotel_booked: true, contact_name: 'Berghain Bookings', contact_email: 'bookings@berghain.de', internal_notes: 'Panorama Bar. Sound check at 01:00.', managed_by: staffId },
    { artist_id: artistMap['Paula Temple'], venue_name: 'fabric', venue_city: 'London', venue_country: 'GB', event_date: '2026-04-25', set_time: '02:00–04:00', set_length_minutes: 120, fee: 2500, currency: 'GBP', status: 'confirmed', contract_status: 'sent', travel_booked: false, hotel_booked: false, contact_name: 'Fabric London', contact_email: 'bookings@fabriclondon.com', internal_notes: 'Room One. Need to chase contract.', managed_by: staffId },
    { artist_id: artistMap['Rebekah'], venue_name: 'Tresor', venue_city: 'Berlin', venue_country: 'DE', event_date: '2026-05-09', set_time: '01:00–03:00', set_length_minutes: 120, fee: 2000, currency: 'EUR', status: 'pending', contract_status: 'not_sent', travel_booked: false, hotel_booked: false, contact_name: 'Tresor Berlin', contact_email: 'bookings@tresorberlin.com', internal_notes: 'Album launch event.', managed_by: staffId },
    { artist_id: artistMap['Blawan'], venue_name: 'De School', venue_city: 'Amsterdam', venue_country: 'NL', event_date: '2026-05-23', set_time: '00:00–02:00', set_length_minutes: 120, fee: 3000, currency: 'EUR', status: 'enquiry', contract_status: 'not_sent', travel_booked: false, hotel_booked: false, contact_name: 'De School Amsterdam', contact_email: 'bookings@deschool.nl', internal_notes: 'Fee negotiation ongoing.', managed_by: staffId },
    { artist_id: artistMap['Ancient Methods'], venue_name: 'Corsica Studios', venue_city: 'London', venue_country: 'GB', event_date: '2026-06-06', set_time: '23:00–01:00', set_length_minutes: 120, fee: 1800, currency: 'GBP', status: 'confirmed', contract_status: 'signed', contract_signed_at: '2026-03-20T14:00:00Z', travel_booked: true, hotel_booked: false, contact_name: 'Corsica Studios', contact_email: 'bookings@corsica.london', managed_by: staffId },
    { artist_id: artistMap['Helena Hauff'], venue_name: 'Printworks', venue_city: 'London', venue_country: 'GB', event_date: '2026-06-20', set_time: '16:00–18:00', set_length_minutes: 120, fee: 4000, currency: 'GBP', status: 'confirmed', contract_status: 'signed', contract_signed_at: '2026-03-10T10:00:00Z', travel_booked: true, hotel_booked: true, contact_name: 'Printworks London', contact_email: 'bookings@printworks.london', internal_notes: 'Daytime event. Big one.', managed_by: staffId },
    { artist_id: artistMap['Surgeon'], venue_name: 'Warehouse Project', venue_city: 'Manchester', venue_country: 'GB', event_date: '2026-07-04', set_time: '01:00–03:00', set_length_minutes: 120, fee: 2800, currency: 'GBP', status: 'pending', contract_status: 'sent', travel_booked: false, hotel_booked: false, contact_name: 'Warehouse Project', contact_email: 'bookings@thewarehouseproject.com', managed_by: staffId },
    { artist_id: artistMap['Perc'], venue_name: 'Ankali', venue_city: 'Prague', venue_country: 'CZ', event_date: '2026-07-18', set_time: '00:00–02:00', set_length_minutes: 120, fee: 1500, currency: 'EUR', status: 'enquiry', contract_status: 'not_sent', travel_booked: false, hotel_booked: false, contact_name: 'Ankali Prague', contact_email: 'bookings@ankali.cz', managed_by: staffId },
    // Past bookings (completed)
    { artist_id: artistMap['Surgeon'], venue_name: 'fabric', venue_city: 'London', venue_country: 'GB', event_date: '2026-02-15', set_time: '02:00–04:00', set_length_minutes: 120, fee: 2500, currency: 'GBP', status: 'completed', contract_status: 'signed', travel_booked: true, hotel_booked: false, contact_name: 'Fabric London', contact_email: 'bookings@fabriclondon.com', managed_by: staffId },
    { artist_id: artistMap['Paula Temple'], venue_name: 'Berghain', venue_city: 'Berlin', venue_country: 'DE', event_date: '2026-01-25', set_time: '04:00–06:00', set_length_minutes: 120, fee: 3500, currency: 'EUR', status: 'completed', contract_status: 'signed', travel_booked: true, hotel_booked: true, contact_name: 'Berghain Bookings', contact_email: 'bookings@berghain.de', managed_by: staffId },
  ]
  const { data: bkData, error: bkErr } = await supabase.from('bookings').insert(bookings).select()
  if (bkErr) console.log('Bookings error:', bkErr.message)
  else console.log(`✓ ${bkData.length} bookings`)
  const bookingMap = {}
  ;(bkData ?? []).forEach(b => { bookingMap[`${b.venue_name}-${b.event_date}`] = b.id })

  // --- INVOICES (12) ---
  const invoices = [
    { invoice_number: 'SF-INV-001', booking_id: bookingMap['Berghain-2026-04-12'], recipient_name: 'Berghain GmbH', recipient_email: 'bookings@berghain.de', line_items: [{ description: 'Surgeon DJ set — Berghain 12 Apr 2026', quantity: 1, unit_price: 3000, total: 3000 }], subtotal: 3000, tax_rate: 0, tax_amount: 0, total: 3000, currency: 'EUR', status: 'paid', issued_at: '2026-03-02T10:00:00Z', due_at: '2026-04-01T10:00:00Z', paid_at: '2026-03-15T09:00:00Z', created_by: staffId },
    { invoice_number: 'SF-INV-002', booking_id: bookingMap['fabric-2026-04-25'], recipient_name: 'Fabric London Ltd', recipient_email: 'bookings@fabriclondon.com', line_items: [{ description: 'Paula Temple DJ set — fabric 25 Apr 2026', quantity: 1, unit_price: 2500, total: 2500 }], subtotal: 2500, tax_rate: 20, tax_amount: 500, total: 3000, currency: 'GBP', status: 'sent', issued_at: '2026-03-15T10:00:00Z', due_at: '2026-04-14T10:00:00Z', created_by: staffId },
    { invoice_number: 'SF-INV-003', booking_id: bookingMap['Corsica Studios-2026-06-06'], recipient_name: 'Corsica Studios', recipient_email: 'bookings@corsica.london', line_items: [{ description: 'Ancient Methods DJ set — Corsica 6 Jun 2026', quantity: 1, unit_price: 1800, total: 1800 }], subtotal: 1800, tax_rate: 20, tax_amount: 360, total: 2160, currency: 'GBP', status: 'draft', created_by: staffId },
    { invoice_number: 'SF-INV-004', recipient_name: 'Club XYZ', recipient_email: 'accounts@clubxyz.com', line_items: [{ description: 'Rebekah DJ set — cancelled show deposit', quantity: 1, unit_price: 500, total: 500 }], subtotal: 500, tax_rate: 20, tax_amount: 100, total: 600, currency: 'GBP', status: 'overdue', issued_at: '2026-02-01T10:00:00Z', due_at: '2026-03-01T10:00:00Z', created_by: staffId },
    { invoice_number: 'SF-INV-005', booking_id: bookingMap['Printworks-2026-06-20'], recipient_name: 'Printworks London', recipient_email: 'bookings@printworks.london', line_items: [{ description: 'Helena Hauff DJ set — Printworks 20 Jun 2026', quantity: 1, unit_price: 4000, total: 4000 }], subtotal: 4000, tax_rate: 20, tax_amount: 800, total: 4800, currency: 'GBP', status: 'sent', issued_at: '2026-03-20T10:00:00Z', due_at: '2026-05-20T10:00:00Z', created_by: staffId },
    { invoice_number: 'SF-INV-006', booking_id: bookingMap['fabric-2026-02-15'], recipient_name: 'Fabric London Ltd', recipient_email: 'bookings@fabriclondon.com', line_items: [{ description: 'Surgeon DJ set — fabric 15 Feb 2026', quantity: 1, unit_price: 2500, total: 2500 }], subtotal: 2500, tax_rate: 20, tax_amount: 500, total: 3000, currency: 'GBP', status: 'paid', issued_at: '2026-01-20T10:00:00Z', due_at: '2026-02-20T10:00:00Z', paid_at: '2026-02-18T09:00:00Z', created_by: staffId },
    { invoice_number: 'SF-INV-007', booking_id: bookingMap['Berghain-2026-01-25'], recipient_name: 'Berghain GmbH', recipient_email: 'bookings@berghain.de', line_items: [{ description: 'Paula Temple DJ set — Berghain 25 Jan 2026', quantity: 1, unit_price: 3500, total: 3500 }], subtotal: 3500, tax_rate: 0, tax_amount: 0, total: 3500, currency: 'EUR', status: 'paid', issued_at: '2025-12-15T10:00:00Z', due_at: '2026-01-15T10:00:00Z', paid_at: '2026-01-10T09:00:00Z', created_by: staffId },
    { invoice_number: 'SF-INV-008', recipient_name: 'Awakenings BV', recipient_email: 'info@awakenings.nl', line_items: [{ description: 'Blawan DJ set — Awakenings Nov 2025', quantity: 1, unit_price: 3500, total: 3500 }, { description: 'Travel & accommodation', quantity: 1, unit_price: 400, total: 400 }], subtotal: 3900, tax_rate: 0, tax_amount: 0, total: 3900, currency: 'EUR', status: 'paid', issued_at: '2025-10-15T10:00:00Z', due_at: '2025-11-15T10:00:00Z', paid_at: '2025-11-12T09:00:00Z', created_by: staffId },
    { invoice_number: 'SF-INV-009', recipient_name: 'Junction 2 Ltd', recipient_email: 'bookings@junction2.london', line_items: [{ description: 'Surgeon DJ set — Junction 2 Festival 2025', quantity: 1, unit_price: 3000, total: 3000 }, { description: 'Perc DJ set — Junction 2 Festival 2025', quantity: 1, unit_price: 2000, total: 2000 }], subtotal: 5000, tax_rate: 20, tax_amount: 1000, total: 6000, currency: 'GBP', status: 'paid', issued_at: '2025-05-01T10:00:00Z', due_at: '2025-06-01T10:00:00Z', paid_at: '2025-05-28T09:00:00Z', created_by: staffId },
    { invoice_number: 'SF-INV-010', recipient_name: 'Tresor GmbH', recipient_email: 'bookings@tresorberlin.com', line_items: [{ description: 'Ancient Methods DJ set — Tresor Dec 2025', quantity: 1, unit_price: 2000, total: 2000 }], subtotal: 2000, tax_rate: 0, tax_amount: 0, total: 2000, currency: 'EUR', status: 'paid', issued_at: '2025-11-10T10:00:00Z', due_at: '2025-12-10T10:00:00Z', paid_at: '2025-12-08T09:00:00Z', created_by: staffId },
    { invoice_number: 'SF-INV-011', recipient_name: 'Warehouse Project MCR', recipient_email: 'bookings@thewarehouseproject.com', line_items: [{ description: 'Helena Hauff DJ set — WHP Oct 2025', quantity: 1, unit_price: 3500, total: 3500 }], subtotal: 3500, tax_rate: 20, tax_amount: 700, total: 4200, currency: 'GBP', status: 'paid', issued_at: '2025-09-15T10:00:00Z', due_at: '2025-10-15T10:00:00Z', paid_at: '2025-10-12T09:00:00Z', created_by: staffId },
    { invoice_number: 'SF-INV-012', recipient_name: 'De School BV', recipient_email: 'bookings@deschool.nl', line_items: [{ description: 'Rebekah DJ set — De School Sep 2025', quantity: 1, unit_price: 2000, total: 2000 }], subtotal: 2000, tax_rate: 0, tax_amount: 0, total: 2000, currency: 'EUR', status: 'overdue', issued_at: '2025-08-20T10:00:00Z', due_at: '2025-09-20T10:00:00Z', created_by: staffId },
  ]
  const { data: invData, error: invErr } = await supabase.from('invoices').upsert(invoices, { onConflict: 'invoice_number' }).select()
  if (invErr) console.log('Invoices error:', invErr.message)
  else console.log(`✓ ${invData.length} invoices`)

  // --- REVIEWS (15) ---
  const reviews = [
    { release_id: releaseMap['SF-041'], contact_id: contactMap['Ben Klock'], status: 'approved', rating: 5, body: 'Absolutely massive. The A1 is pure Berghain material — will be playing this every weekend. Outstanding production.', charted: true, chart_name: 'Ben Klock Berghain Chart March 2026', is_featured: true, approved_at: '2026-03-05T10:00:00Z' },
    { release_id: releaseMap['SF-041'], contact_id: contactMap['Marcel Dettmann'], status: 'approved', rating: 4, body: 'Strong release. B2 has that hypnotic loop I look for. Will play the A-side at Panorama Bar.', charted: true, chart_name: 'Dettmann March Picks', is_featured: false, approved_at: '2026-03-06T14:00:00Z' },
    { release_id: releaseMap['SF-041'], contact_id: contactMap['Speedy J'], status: 'approved', rating: 5, body: 'Surgeon continues to push boundaries. Every track could headline a set. Pristine mastering.', charted: true, chart_name: 'Electric Deluxe Spring Chart', is_featured: false, approved_at: '2026-03-08T11:00:00Z' },
    { release_id: releaseMap['SF-041'], contact_id: contactMap['Helena Hauff'], status: 'pending', rating: 4, body: 'Great EP. The raw analog feel on B1 is exactly what I look for. Perfect for late-night sets.', charted: false, is_featured: false },
    { release_id: releaseMap['SF-041'], contact_id: contactMap['Inverted Audio'], status: 'approved', rating: 4, body: 'Another quality release from Shine Frequency. Surgeon delivers four tracks of uncompromising industrial techno.', charted: false, is_featured: true, approved_at: '2026-03-10T10:00:00Z' },
    { release_id: releaseMap['SF-041'], contact_id: contactMap['DJ Mag'], status: 'approved', rating: 4, body: 'Surgeon remains one of techno\'s most vital artists. Pressure Systems is lean, focused, and devastatingly effective.', charted: false, is_featured: true, approved_at: '2026-03-12T10:00:00Z' },
    { release_id: releaseMap['SF-042'], contact_id: contactMap['Lauren Lo Sung'], status: 'approved', rating: 5, body: 'This is FIERCE. Paula has outdone herself. The noise textures on A1 are incredible — played it at fabric and the room went mental.', charted: true, chart_name: 'Lo Sung March Top 10', is_featured: true, approved_at: '2026-03-12T09:00:00Z' },
    { release_id: releaseMap['SF-042'], contact_id: contactMap['Dax J'], status: 'approved', rating: 4, body: 'Solid EP. The EBM influence on B1 is very well done. Including this in my Monnom Black sets.', charted: false, approved_at: '2026-03-14T16:00:00Z', is_featured: false },
    { release_id: releaseMap['SF-042'], contact_id: contactMap['Perc'], status: 'pending', rating: 5, body: 'Absolutely destroyed the dancefloor with A2. Sound design is next level. One of the best this year.', charted: false, is_featured: false },
    { release_id: releaseMap['SF-042'], contact_id: contactMap['Resident Advisor'], status: 'pending', rating: 4, body: 'A confident statement from Temple. Navigates noise and rhythm with surgical precision. Recommended.', charted: false, is_featured: false },
    { release_id: releaseMap['SF-042'], contact_id: contactMap['VTSS'], status: 'pending', rating: 3, body: 'Some interesting moments but feels one-dimensional in places. B2 is the standout for me.', charted: false, is_featured: false },
    { release_id: releaseMap['SF-042'], contact_id: contactMap['I Hate Models'], status: 'approved', rating: 5, body: 'Paula Temple at her absolute best. This EP is a masterclass in intensity. A1 has been in every one of my sets since I got it.', charted: true, chart_name: 'IHM April Chart', is_featured: true, approved_at: '2026-03-18T10:00:00Z' },
    { release_id: releaseMap['SF-042'], contact_id: contactMap['Kobosil'], status: 'approved', rating: 4, body: 'Raw and powerful. The production is impeccable. B1 works perfectly in long Berghain sets.', charted: true, chart_name: 'Kobosil March Selection', is_featured: false, approved_at: '2026-03-15T10:00:00Z' },
    { release_id: releaseMap['SF-042'], contact_id: contactMap['Mixmag'], status: 'pending', rating: 4, body: 'Paula Temple continues to set the bar for noise-inflected techno. Deconstructed is essential listening.', charted: false, is_featured: false },
    { release_id: releaseMap['SF-040'], contact_id: contactMap['Ben Klock'], status: 'approved', rating: 4, body: 'Another strong EP from Surgeon on Shine Frequency. The label continues to deliver.', charted: true, is_featured: false, approved_at: '2026-01-20T10:00:00Z' },
  ]
  const validReviews = reviews.filter(r => r.release_id && r.contact_id)
  const { data: rvData, error: rvErr } = await supabase.from('reviews').insert(validReviews).select()
  if (rvErr) console.log('Reviews error:', rvErr.message)
  else console.log(`✓ ${rvData.length} reviews`)

  // --- TASKS ---
  const tasks = [
    { title: 'Chase fabric contract for Paula Temple', urgency: 'now', assigned_to: staffId },
    { title: 'Follow up on SF-INV-004 — 28 days overdue', urgency: 'now', assigned_to: staffId },
    { title: 'Chase remaining Tier 1 reviews for SF-042', urgency: 'today', assigned_to: staffId },
    { title: 'Approve pending reviews for SF-041 and SF-042', urgency: 'today', assigned_to: staffId },
    { title: 'Book hotel for Rebekah Tresor show', urgency: 'this_week', assigned_to: staffId },
    { title: 'Send contract to Tresor for Rebekah booking', urgency: 'this_week', assigned_to: staffId },
    { title: 'Finalise artwork for SF-043 Magnetic North', urgency: 'this_week', assigned_to: staffId },
    { title: 'Schedule social posts for SF-042 launch', urgency: 'today', assigned_to: staffId },
    { title: 'Follow up SF-INV-012 — De School overdue 6 months', urgency: 'now', assigned_to: staffId },
    { title: 'Send Printworks invoice SF-INV-005 reminder', urgency: 'this_week', assigned_to: staffId },
    { title: 'Confirm WHP contract for Surgeon July date', urgency: 'this_week', assigned_to: staffId },
    { title: 'Chase Mixmag review for SF-042', urgency: 'today', assigned_to: staffId },
  ]
  const { data: tkData, error: tkErr } = await supabase.from('tasks').insert(tasks).select()
  if (tkErr) console.log('Tasks error:', tkErr.message)
  else console.log(`✓ ${tkData.length} tasks`)

  // --- PROMO LISTS ---
  const promoNames = ['Ben Klock', 'Marcel Dettmann', 'Helena Hauff', 'Perc', 'Ansome',
    'Lauren Lo Sung', 'Dax J', 'Speedy J', 'Amelie Lens', 'VTSS', 'Jeff Mills',
    'DJ Stingray', 'Resident Advisor', 'Inverted Audio', 'Objekt', 'I Hate Models',
    'Kobosil', 'DVS1', 'DJ Mag', 'Mixmag', 'Decoded Magazine', 'Phase', 'Truncate']
  const promoRows = []
  for (const cat of ['SF-041', 'SF-042', 'SF-040', 'SF-039']) {
    for (const name of promoNames) {
      if (!contactMap[name] || !releaseMap[cat]) continue
      const dl = Math.random() > 0.25
      const rv = dl && Math.random() > 0.5
      promoRows.push({
        release_id: releaseMap[cat],
        contact_id: contactMap[name],
        downloaded_at: dl ? '2026-02-16T14:00:00Z' : null,
        reviewed_at: rv ? '2026-02-20T10:00:00Z' : null,
        download_count: dl ? Math.floor(Math.random() * 5) + 1 : 0,
      })
    }
  }
  const { data: plData, error: plErr } = await supabase.from('promo_lists').upsert(promoRows, { onConflict: 'release_id,contact_id' }).select()
  if (plErr) console.log('Promo lists error:', plErr.message)
  else console.log(`✓ ${plData.length} promo list entries`)

  // --- DOWNLOAD EVENTS ---
  const dlEvents = []
  for (const cat of ['SF-041', 'SF-042', 'SF-040']) {
    for (const name of ['Ben Klock', 'Marcel Dettmann', 'Lauren Lo Sung', 'Perc', 'Speedy J', 'Helena Hauff', 'Dax J', 'I Hate Models', 'Kobosil', 'DVS1']) {
      if (!contactMap[name] || !releaseMap[cat]) continue
      dlEvents.push({ release_id: releaseMap[cat], contact_id: contactMap[name], delivery_method: 'dropbox', file_size_mb: Math.round(Math.random() * 50 + 30) })
    }
  }
  const { data: dlData, error: dlErr } = await supabase.from('download_events').insert(dlEvents).select()
  if (dlErr) console.log('Downloads error:', dlErr.message)
  else console.log(`✓ ${dlData.length} download events`)

  // --- MESSAGES ---
  const msgs = [
    { contact_id: contactMap['Ben Klock'], direction: 'outbound', channel: 'email', body: 'Hey Ben — SF-041 is ready for you. Private Dropbox link in the promo email. Let me know what you think!', is_read: true, created_at: '2026-02-15T10:30:00Z' },
    { contact_id: contactMap['Ben Klock'], direction: 'inbound', channel: 'email', body: 'Sharon, this is massive! A1 is going straight into my Berghain set this weekend.', is_read: true, created_at: '2026-02-16T16:00:00Z' },
    { contact_id: contactMap['Ben Klock'], direction: 'inbound', channel: 'email', body: 'Review submitted — 5 stars. Charted it in my March Berghain chart. Absolute weapon.', is_read: true, created_at: '2026-02-18T09:00:00Z' },
    { contact_id: contactMap['Lauren Lo Sung'], direction: 'outbound', channel: 'email', body: 'Lauren — SF-042 from Paula Temple dropping soon. Sending you early access.', is_read: true, created_at: '2026-02-24T11:00:00Z' },
    { contact_id: contactMap['Lauren Lo Sung'], direction: 'inbound', channel: 'email', body: 'OMG Sharon this is incredible! Played A1 at fabric last night and the room went MENTAL.', is_read: true, created_at: '2026-02-26T02:00:00Z' },
    { contact_id: contactMap['Lauren Lo Sung'], direction: 'inbound', channel: 'email', body: 'Review done — 5 stars, charted. Can you send me the artwork for an IG story?', is_read: false, created_at: '2026-03-12T09:30:00Z' },
    { contact_id: contactMap['Perc'], direction: 'outbound', channel: 'email', body: 'Ali — SF-042 is out to Tier 1. Paula at her most ferocious.', is_read: true, created_at: '2026-02-24T11:15:00Z' },
    { contact_id: contactMap['Perc'], direction: 'inbound', channel: 'email', body: 'Review sent — A2 is absolutely devastating. Sound design is next level.', is_read: false, created_at: '2026-03-15T10:00:00Z' },
    { contact_id: contactMap['Fabric London'], direction: 'outbound', channel: 'email', body: 'Following up on the Paula Temple booking 25 April. Can you confirm contract status?', is_read: true, created_at: '2026-03-20T09:00:00Z' },
    { contact_id: contactMap['Fabric London'], direction: 'inbound', channel: 'email', body: 'Contract is with our bookings manager. Should have it back by Thursday.', is_read: true, created_at: '2026-03-21T11:00:00Z' },
    { contact_id: contactMap['Berghain Bookings'], direction: 'inbound', channel: 'email', body: 'Payment processed. Invoice SF-INV-001 marked as paid. Thank you.', is_read: true, created_at: '2026-03-15T09:30:00Z' },
    { contact_id: contactMap['Resident Advisor'], direction: 'outbound', channel: 'email', body: 'SF-042 from Paula Temple is out now. Press assets attached. Happy to arrange an interview.', is_read: true, created_at: '2026-03-10T10:00:00Z' },
    { contact_id: contactMap['Resident Advisor'], direction: 'inbound', channel: 'email', body: 'Thanks Sharon. Review will be up within the week. Strong release.', is_read: false, created_at: '2026-03-11T15:00:00Z' },
    { contact_id: contactMap['I Hate Models'], direction: 'outbound', channel: 'email', body: 'Hey — SF-042 is out. Think this would sit perfectly in your sets.', is_read: true, created_at: '2026-02-24T12:00:00Z' },
    { contact_id: contactMap['I Hate Models'], direction: 'inbound', channel: 'email', body: 'Sharon this is incredible. A1 has been in every set since I got it. Review and chart incoming.', is_read: true, created_at: '2026-03-01T18:00:00Z' },
    { contact_id: contactMap['Printworks London'], direction: 'outbound', channel: 'email', body: 'Invoice SF-INV-005 sent for Helena Hauff Printworks date. Due 20 May.', is_read: true, created_at: '2026-03-20T10:30:00Z' },
    { contact_id: contactMap['Printworks London'], direction: 'inbound', channel: 'email', body: 'Received, thank you. Will process with our accounts team.', is_read: true, created_at: '2026-03-21T14:00:00Z' },
    { contact_id: contactMap['DJ Mag'], direction: 'outbound', channel: 'email', body: 'SF-041 Surgeon review — thanks for the 4-star write-up. Can we feature the quote on socials?', is_read: true, created_at: '2026-03-13T10:00:00Z' },
    { contact_id: contactMap['DJ Mag'], direction: 'inbound', channel: 'email', body: 'Absolutely, go for it. Tag us @djmag.', is_read: true, created_at: '2026-03-13T15:00:00Z' },
  ]
  const validMsgs = msgs.filter(m => m.contact_id)
  const { data: msgData, error: msgErr } = await supabase.from('messages').insert(validMsgs).select()
  if (msgErr) console.log('Messages error:', msgErr.message)
  else console.log(`✓ ${msgData.length} messages`)

  // --- SOCIAL POSTS ---
  const socialPosts = [
    { release_id: releaseMap['SF-041'], platform: 'instagram', status: 'published', caption: 'SF-041 OUT NOW. Surgeon - Pressure Systems. Four tracks of relentless industrial techno. Link in bio.', hashtags: ['techno', 'industrialtechno', 'surgeon', 'shinefrequency'], published_at: '2026-03-01T12:00:00Z', like_count: 847, comment_count: 32, share_count: 156, reach: 12400 },
    { release_id: releaseMap['SF-041'], platform: 'twitter', status: 'published', caption: 'SF-041 — Surgeon "Pressure Systems" out now. Industrial techno at its finest.', hashtags: ['techno', 'surgeon'], published_at: '2026-03-01T12:05:00Z', like_count: 234, comment_count: 18, share_count: 89, reach: 5600 },
    { release_id: releaseMap['SF-042'], platform: 'instagram', status: 'published', caption: 'SF-042. Paula Temple - Deconstructed. Five tracks of noise, EBM and broken techno. FIERCE.', hashtags: ['paulatemple', 'noisetechno', 'ebm', 'shinefrequency'], published_at: '2026-03-10T12:00:00Z', like_count: 1203, comment_count: 56, share_count: 289, reach: 18700 },
    { release_id: releaseMap['SF-042'], platform: 'soundcloud', status: 'published', caption: 'Preview — Paula Temple "Deconstructed" EP. Full release out now.', hashtags: ['paulatemple'], published_at: '2026-03-10T13:00:00Z', like_count: 567, comment_count: 43, reach: 9200 },
    { release_id: releaseMap['SF-041'], platform: 'instagram', status: 'published', caption: 'Ben Klock charted SF-041 in his March Berghain chart. "Absolutely massive — pure Berghain material"', hashtags: ['benklock', 'berghain', 'surgeon'], published_at: '2026-03-06T15:00:00Z', like_count: 1456, comment_count: 67, share_count: 312, reach: 22100 },
    { release_id: releaseMap['SF-042'], platform: 'instagram', status: 'published', caption: 'I Hate Models: "Paula Temple at her absolute best. A masterclass in intensity." SF-042 charted.', hashtags: ['ihatemodels', 'paulatemple', 'shinefrequency'], published_at: '2026-03-19T12:00:00Z', like_count: 1834, comment_count: 89, share_count: 445, reach: 28500 },
    { release_id: releaseMap['SF-043'], platform: 'instagram', status: 'scheduled', caption: 'SF-043 — Rebekah "Magnetic North" LP. Full album coming 18 April. Pre-save link in bio.', hashtags: ['rebekah', 'techno', 'album'], scheduled_at: '2026-04-04T12:00:00Z' },
    { release_id: releaseMap['SF-043'], platform: 'twitter', status: 'scheduled', caption: 'Incoming: Rebekah "Magnetic North" LP on Shine Frequency. 8 tracks. 18 April.', hashtags: ['rebekah', 'techno'], scheduled_at: '2026-04-04T12:05:00Z' },
  ]
  const { data: spData, error: spErr } = await supabase.from('social_posts').insert(socialPosts).select()
  if (spErr) console.log('Social posts error:', spErr.message)
  else console.log(`✓ ${spData.length} social posts`)

  // --- CAMPAIGNS ---
  const campaigns = [
    { release_id: releaseMap['SF-041'], name: 'SF-041 Tier 1 Dropbox blast', platform: 'dropbox', status: 'sent', sent_at: '2026-02-15T10:00:00Z', recipient_count: 15, open_count: 14, click_count: 12 },
    { release_id: releaseMap['SF-041'], name: 'SF-041 Tier 2 follow-up', platform: 'dropbox', status: 'sent', sent_at: '2026-02-18T10:00:00Z', recipient_count: 8, open_count: 6, click_count: 4 },
    { release_id: releaseMap['SF-042'], name: 'SF-042 Tier 1 Dropbox blast', platform: 'dropbox', status: 'sent', sent_at: '2026-02-24T10:00:00Z', recipient_count: 15, open_count: 13, click_count: 11 },
    { release_id: releaseMap['SF-042'], name: 'SF-042 SoundCloud promo', platform: 'soundcloud', status: 'sent', sent_at: '2026-03-10T13:00:00Z', recipient_count: 23, open_count: 18, click_count: 14 },
    { release_id: releaseMap['SF-043'], name: 'SF-043 Tier 1 pre-release', platform: 'dropbox', status: 'scheduled', scheduled_at: '2026-04-01T10:00:00Z', recipient_count: 15 },
  ]
  const { data: cpData, error: cpErr } = await supabase.from('campaigns').insert(campaigns).select()
  if (cpErr) console.log('Campaigns error:', cpErr.message)
  else console.log(`✓ ${cpData.length} campaigns`)

  // --- TRACKS ---
  const tracks = [
    { release_id: releaseMap['SF-041'], position: 'A1', title: 'Pressure Lock', duration_seconds: 412, bpm: 138, key: 'Am', file_size_mb: 22.1, download_count: 12, play_count: 67, charted_count: 3 },
    { release_id: releaseMap['SF-041'], position: 'A2', title: 'Compression Wave', duration_seconds: 387, bpm: 140, key: 'Bm', file_size_mb: 20.8, download_count: 9, play_count: 41, charted_count: 1 },
    { release_id: releaseMap['SF-041'], position: 'B1', title: 'Raw Signal', duration_seconds: 445, bpm: 135, key: 'Dm', file_size_mb: 21.3, download_count: 10, play_count: 48, charted_count: 2 },
    { release_id: releaseMap['SF-041'], position: 'B2', title: 'Hydraulic', duration_seconds: 398, bpm: 142, key: 'Em', file_size_mb: 18.3, download_count: 7, play_count: 28, charted_count: 1 },
    { release_id: releaseMap['SF-042'], position: 'A1', title: 'Deconstruct', duration_seconds: 456, bpm: 145, key: 'Cm', file_size_mb: 24.5, download_count: 11, play_count: 72, charted_count: 3 },
    { release_id: releaseMap['SF-042'], position: 'A2', title: 'Noise Architecture', duration_seconds: 410, bpm: 142, key: 'Am', file_size_mb: 22.0, download_count: 9, play_count: 51, charted_count: 1 },
    { release_id: releaseMap['SF-042'], position: 'B1', title: 'EBM Protocol', duration_seconds: 378, bpm: 140, key: 'Fm', file_size_mb: 19.8, download_count: 8, play_count: 38, charted_count: 2 },
    { release_id: releaseMap['SF-042'], position: 'B2', title: 'Fractured State', duration_seconds: 425, bpm: 148, key: 'Gm', file_size_mb: 21.2, download_count: 6, play_count: 24, charted_count: 0 },
    { release_id: releaseMap['SF-042'], position: 'C1', title: 'Aftermath', duration_seconds: 502, bpm: 150, key: 'Dm', file_size_mb: 17.8, download_count: 5, play_count: 18, charted_count: 0 },
  ]
  const validTracks = tracks.filter(t => t.release_id)
  const { data: trData, error: trErr } = await supabase.from('tracks').insert(validTracks).select()
  if (trErr) console.log('Tracks error:', trErr.message)
  else console.log(`✓ ${trData.length} tracks`)

  // --- PODCAST EPISODES ---
  const { data: showData } = await supabase.from('podcast_shows').select('id, name')
  const showMap = {}
  ;(showData ?? []).forEach(s => { showMap[s.name] = s.id })

  const episodes = [
    { show_id: showMap['Shine Frequency Radio'], episode_number: 47, title: 'SFR047 — Surgeon Guest Mix', guest_name: 'Surgeon', duration_seconds: 5400, status: 'published', published_at: '2026-03-01T18:00:00Z', play_count: 2847 },
    { show_id: showMap['Shine Frequency Radio'], episode_number: 48, title: 'SFR048 — Paula Temple Special', guest_name: 'Paula Temple', duration_seconds: 5400, status: 'published', published_at: '2026-03-08T18:00:00Z', play_count: 3215 },
    { show_id: showMap['Shine Frequency Radio'], episode_number: 49, title: 'SFR049 — Rebekah Album Preview', guest_name: 'Rebekah', duration_seconds: 3600, status: 'scheduled', play_count: 0, scheduled_at: '2026-04-05T18:00:00Z' },
    { show_id: showMap['SF Late Night Series'], episode_number: 12, title: 'SFLNS012 — Speedy J Extended Set', guest_name: 'Speedy J', duration_seconds: 7200, status: 'published', published_at: '2026-02-15T22:00:00Z', play_count: 1892 },
    { show_id: showMap['SF Late Night Series'], episode_number: 13, title: 'SFLNS013 — Helena Hauff Electro Session', guest_name: 'Helena Hauff', duration_seconds: 7200, status: 'published', published_at: '2026-03-15T22:00:00Z', play_count: 2103 },
    { show_id: showMap['SF Late Night Series'], episode_number: 14, title: 'SFLNS014 — Objekt B2B Blawan', guest_name: 'Objekt & Blawan', duration_seconds: 7200, status: 'draft', play_count: 0 },
  ]
  const { data: epData, error: epErr } = await supabase.from('podcast_episodes').insert(episodes).select()
  if (epErr) console.log('Episodes error:', epErr.message)
  else console.log(`✓ ${epData.length} podcast episodes`)

  // --- AUDIT LOG ---
  const auditEntries = [
    { actor_email: 'shineprdev@gmail.com', action: 'create', module: 'releases', record_type: 'release', created_at: '2026-02-10T09:00:00Z' },
    { actor_email: 'shineprdev@gmail.com', action: 'update', module: 'releases', record_type: 'release', created_at: '2026-02-15T10:00:00Z' },
    { actor_email: 'shineprdev@gmail.com', action: 'create', module: 'bookings', record_type: 'booking', created_at: '2026-02-20T14:00:00Z' },
    { actor_email: 'shineprdev@gmail.com', action: 'create', module: 'invoices', record_type: 'invoice', created_at: '2026-03-02T10:00:00Z' },
    { actor_email: 'shineprdev@gmail.com', action: 'approve', module: 'reviews', record_type: 'review', created_at: '2026-03-05T10:00:00Z' },
    { actor_email: 'shineprdev@gmail.com', action: 'update', module: 'bookings', record_type: 'booking', created_at: '2026-03-10T11:00:00Z' },
    { actor_email: 'shineprdev@gmail.com', action: 'send', module: 'campaigns', record_type: 'campaign', created_at: '2026-03-15T10:00:00Z' },
    { actor_email: 'shineprdev@gmail.com', action: 'create', module: 'invoices', record_type: 'invoice', created_at: '2026-03-20T10:00:00Z' },
    { actor_email: 'shineprdev@gmail.com', action: 'approve', module: 'reviews', record_type: 'review', created_at: '2026-03-18T10:00:00Z' },
    { actor_email: 'shineprdev@gmail.com', action: 'update', module: 'contacts', record_type: 'contact', created_at: '2026-03-22T09:00:00Z' },
  ]
  const { error: auditErr } = await supabase.from('audit_log').insert(auditEntries)
  if (auditErr) console.log('Audit log error:', auditErr.message)
  else console.log(`✓ ${auditEntries.length} audit log entries`)

  // --- UPDATE CONTACT STATS ---
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

  console.log('\n✅ Full seed complete!')
}

seed().catch(console.error)
