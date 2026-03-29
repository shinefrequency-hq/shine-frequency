export default function GuidePage() {
  const sections = [
    {
      id: 'intro',
      title: '1. What is frequency?',
      content: `frequency is your all-in-one platform for managing the label. It replaces spreadsheets, email threads, and scattered files with a single dashboard where you can manage releases, contacts, promo distribution, bookings, invoicing, and more.

Everything lives in one place — from the moment an artist submits a demo to the point where DJs are playing the record and leaving reviews. The platform tracks the entire lifecycle of a release.

**Who is it for?** You, Sharon. It's built specifically for how you work — fast, efficient, everything visible at a glance. No training needed beyond this guide.`
    },
    {
      id: 'dashboard',
      title: "2. Today's Queue (Dashboard)",
      content: `This is your home screen. Every time you log in, you see what needs attention right now:

- **Urgent tasks** (red) — things that need doing immediately (overdue invoices, unsigned contracts)
- **Today's tasks** (yellow) — things to handle today (chase reviews, send promos)
- **This week** — upcoming items
- **Pending reviews** — DJ feedback waiting for your approval
- **Upcoming bookings** — gigs in the next 14 days with travel/contract warnings
- **Overdue invoices** — money you're owed
- **Expiring promo windows** — releases where the promo window is about to close

The stats bar at the top gives you a snapshot: active releases, pending reviews, urgent tasks, upcoming gigs, overdue invoices.`
    },
    {
      id: 'releases',
      title: '3. Releases',
      content: `The release manager is the core of the platform. Every record on the label lives here.

**Adding a release:**
You have two options:
- **Quick add** — click "+ Quick add" for a simple form
- **Wizard** — click "Wizard" for a guided 4-step flow: Details → Tracklisting → Promo Window → Assign Contacts

**Release fields:**
- Catalogue number (e.g. SF-046)
- Artist name, title, format (EP/LP/Single/Album)
- Genre, BPM range
- Release date, promo window start/end
- Dropbox and SoundCloud URLs
- Description (public) and internal notes (private, only you see these)

**What happens when you create a release:**
1. A Dropbox folder is auto-created: /Shine Frequency/SF-046 - Artist Name/ with subfolders for Masters, Artwork, Stems, and Press Assets
2. If you assigned promo contacts, they're added to the promo list
3. A task appears in Today's Queue

**Filters:** Use the dropdowns to filter by status (Draft/In Review/Scheduled/Live/Archived), heat level, or format.

**Detail panel:** Click any release to see full details on the right — artwork, status, promo window, description, notes. From here you can:
- Edit the release
- Manage the promo list
- Open the Dropbox folder
- Preview audio tracks (if files are in Dropbox)
- Share to X (Twitter) or copy caption for Instagram
- Get the DJ feedback link to send to contacts`
    },
    {
      id: 'contacts',
      title: '4. Contacts',
      content: `Everyone you work with lives here — DJs, producers, press, venues, promoters, labels, artists.

**Adding contacts:**
- Click "+ Add contact" for the form
- Click "Import CSV" to bulk-import from a spreadsheet
- DJs can also sign up themselves at shine-frequency.vercel.app/join

**Contact types:** DJ, Producer, Label, Venue, Promoter, Press, Artist, Industry

**Promo tiers:**
- **Tier 1** — first access. Your most important contacts (Ben Klock, RA, etc.)
- **Tier 2** — standard promo recipients
- **Tier 3** — extended list

**Tags:** Click a contact to see the detail panel. Add quick tags like "Tier 1 DJ", "Berlin", "Key Press", "Festival" etc. Tags are used to create audiences.

**Flags:** On Promo List, Trusted, High Value, SF Artist — these control who appears in promo list builders.

**Export:** Click "Export CSV" to download your contact list as a spreadsheet.`
    },
    {
      id: 'audiences',
      title: '5. Audiences',
      content: `Audiences are named groups of contacts for targeted distribution. Instead of picking contacts one by one, create audiences like "UK DJs", "Berlin Press", "Tier 1 Techno".

**How it works:**
1. Go to Audiences in the sidebar (under People)
2. Create a new audience name
3. Add contacts — search by name, or use quick-fill buttons (All Tier 1, All DJs, All Press)
4. To send a release to an audience: select the audience, click "Send release to audience", pick the release — all contacts are added to that release's promo list in one click

Tags and audiences are the same thing under the hood. Tagging a contact in the Contacts page makes them appear in the matching audience.`
    },
    {
      id: 'promo',
      title: '6. Promo Distribution',
      content: `This is the heart of the business — getting music to the right people.

**The flow:**
1. Create a release (with promo window dates)
2. Assign contacts to the promo list (via wizard, audiences, or manually)
3. Each contact gets a unique tokenised download link
4. Send promo emails — click "Send promo emails" on the promo list page
5. DJs receive a branded email with the release details and Dropbox download link
6. They download, listen, and submit feedback via the DJ feedback form
7. You approve reviews in the Reviews page

**Promo list page:** Shows who's been invited, who downloaded, who reviewed, download counts. Filter by tier.

**Bulk actions:** Select Tier 1/2/3 or All to add contacts in one click.

**Tracking:** The Heat Tracker shows promo momentum — which releases are getting traction (downloads, reviews, chart entries).`
    },
    {
      id: 'feedback',
      title: '7. DJ Feedback Form',
      content: `DJs leave feedback at shine-frequency.vercel.app/review

You can send them a direct link pre-set to a specific release: /review?release=SF-042

**What DJs fill in:**
- Overall rating (1-5)
- Energy level (Low & hypnotic → Peak time destroyer)
- Mixability (Very easy → DJ tool)
- Sound quality / mastering
- Crowd reaction (if they've played it out)
- Where they'd play it (warm-up, peak time, closing, radio, etc.)
- Genre fit for their sound
- Would they chart it? Would they play it out?
- Chart name (if charting)
- Favourite track
- Written comments

This gives you massively more useful data than a simple "sounds good, will play" email.

**After submission:** A task appears in your Today's Queue. Review and approve it in the Reviews page.`
    },
    {
      id: 'reviews',
      title: '8. Reviews',
      content: `All DJ and press feedback lands here for approval.

**Actions:**
- **Approve** — makes the review visible and counts towards stats
- **Reject** — with reason (not shown to the reviewer)
- **Feature** — marks as a featured review (for press quotes, social posts)
- **Delete** — permanent removal

Reviews include the star rating, full text (with all the structured feedback from the DJ form), chart information, and who submitted it.

**Tip:** Use featured reviews for social media posts — the release detail panel has a "Copy for IG" button that includes the artist and release info.`
    },
    {
      id: 'bookings',
      title: '9. Bookings',
      content: `Manage DJ bookings, contracts, travel, and fees.

**Booking fields:** Artist, venue, city, country, date, set time, length, fee, currency, deposit, status, contract status, travel/hotel booked, rider, contact details, internal notes.

**Statuses:** Enquiry → Pending → Confirmed → Completed (or Cancelled)
**Contract:** Not Sent → Sent → Signed (or Cancelled)

**Detail panel:** Click a booking to see everything — fee, travel status, contract status, contact info. Green ticks/red crosses show at a glance what's sorted and what isn't.

**Warnings:** The dashboard alerts you to unsigned contracts and unbooked travel on upcoming confirmed gigs.`
    },
    {
      id: 'invoicing',
      title: '10. Invoicing',
      content: `Create, send, and track invoices.

**Creating an invoice:**
1. Click "+ New invoice"
2. Fill in invoice number, recipient, line items, tax rate
3. Totals calculate automatically

**Actions on each invoice:**
- **PDF** — generates a branded A4 invoice (Shine logo, green accents, professional layout). Print or save as PDF.
- **Email** — sends the invoice directly to the recipient. Auto-updates status from Draft to Sent.
- **Paid** — mark as paid with payment reference and date
- **Chase** — sends an overdue reminder email to the recipient
- **Edit / Delete**

**Statuses:** Draft → Sent → Viewed → Paid (or Overdue / Cancelled)

**Export:** Click "Export" to download all invoices as CSV for your accountant.

**Dashboard alerts:** Overdue invoices appear prominently in Today's Queue with the amount and days overdue.`
    },
    {
      id: 'messages',
      title: '11. Messages',
      content: `Internal message log with contacts. Messages are organised into threads by contact.

When you send a message from here, it's also emailed to the contact's email address. Inbound messages are logged when contacts reply.

**Uses:** Chase reviews, confirm bookings, follow up on invoices, general comms. Everything's in one place so you can see the full history with each contact.`
    },
    {
      id: 'dropbox',
      title: '12. Dropbox Integration',
      content: `Dropbox is where all the audio files live. The platform connects to Sharon's Dropbox account.

**Folder structure:**
Each release gets: /Shine Frequency/SF-046 - Artist Name/
- Masters/ — final mastered tracks
- Artwork/ — cover art, press photos
- Stems/ — individual stems
- Press Assets/ — bios, one-sheets

**Auto-creation:** When you create a release (via wizard or "+ Dropbox" button), the folder structure is created automatically.

**Audio preview:** If audio files are in the Masters folder, you can play them directly from the release detail panel — no need to open Dropbox separately.

**Promo links:** The Dropbox folder URL is included in promo emails sent to DJs.`
    },
    {
      id: 'onboarding',
      title: '13. Artist Onboarding',
      content: `New artists can submit their details at shine-frequency.vercel.app/onboard

**3-step form:**
1. Basic info — stage name, real name, email, phone, location, bio
2. Music — genre, BPM range, demo link, SoundCloud, Instagram
3. Review & confirm — summary of all info, terms checkbox

**What happens:**
- A contact record is created (type: artist, SF artist flag)
- An artist record is created (inactive until you approve)
- A task appears in your Today's Queue: "New artist submission: [name]"
- You review and activate them when ready`
    },
    {
      id: 'social',
      title: '14. Social & Campaigns',
      content: `**Social Scheduler:** Create and schedule posts for Instagram, Twitter, SoundCloud. Track engagement (likes, comments, shares, reach). Posts are currently draft/scheduled — you copy the text and post manually, or use the "Post to X" button in the release detail panel.

**Campaigns:** Track promo campaigns — Dropbox blasts, SoundCloud promotions. See recipient counts, open rates, click rates.

**Quick share from releases:** Click a release → detail panel → "Post to X" opens Twitter with pre-filled text. "Copy for IG" copies the caption with hashtags to your clipboard.`
    },
    {
      id: 'podcasts',
      title: '15. Podcasts',
      content: `Manage podcast shows and episodes. Two shows are pre-configured:
- **Shine Frequency Radio** — weekly mix series
- **SF Late Night Series** — monthly deep cuts

Create episodes with guest name, duration, status (draft/scheduled/published), play count. Link to Apple Music, SoundCloud, Spotify.`
    },
    {
      id: 'reporting',
      title: '16. Reporting',
      content: `The reporting dashboard shows:
- **Revenue:** Total paid, outstanding, overdue
- **Release stats:** Total, live, scheduled
- **Contact stats:** Total, on promo, high value
- **Top releases:** By download count with ratings
- **Recent activity:** Audit log of recent actions

Use this for label meetings, accountant reports, or quick health checks.`
    },
    {
      id: 'notifications',
      title: '17. Notifications',
      content: `The bell icon in the sidebar shows live notifications:
- Urgent tasks that need attention
- Pending reviews to approve
- Overdue invoices

It updates every 5 seconds so you always see the latest state.

**Email alerts:** The system can send you email notifications for critical events — overdue invoices, expiring promo windows, unsigned contracts. These run via the /api/notifications endpoint.`
    },
    {
      id: 'search',
      title: '18. Search',
      content: `Press **Cmd+K** (or Ctrl+K) to open global search. It searches across releases, contacts, bookings, and invoices in one go.

Results are grouped by type. Click a result to jump to that section.`
    },
    {
      id: 'settings',
      title: '19. Settings & Integrations',
      content: `**Settings page:**
- Label name, currency, timezone
- Dropbox connection status
- Connect/disconnect Dropbox

**Keyboard shortcuts:**
- Cmd+K — Global search
- Escape — Close forms and panels`
    },
    {
      id: 'workflows',
      title: '20. Key Workflows',
      content: `**New release workflow:**
1. Wizard → fill in details, tracks, promo window, assign contacts
2. Dropbox folder auto-creates
3. Upload masters to Dropbox
4. Send promo emails from the promo list page
5. DJs download and leave feedback
6. Approve reviews
7. Share quotes on social media
8. Track heat and momentum

**New booking workflow:**
1. Add booking with artist, venue, fee, dates
2. Send contract (update contract status)
3. Chase if unsigned (dashboard alerts you)
4. Book travel and hotel (tick the flags)
5. Create invoice
6. Send invoice via email
7. Track payment, chase if overdue

**New artist workflow:**
1. Artist submits at /onboard (or you add them manually)
2. Task appears in Today's Queue
3. Review submission, approve
4. Add to relevant audiences
5. Include in future promo lists

**Promo sign-up workflow:**
1. DJ/press signs up at /join
2. Task appears in your queue
3. Review, set promo tier, approve (toggle "On promo list")
4. They'll be included in future promo distributions`
    },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: '#E6E6E6', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      color: '#1a1a1a', lineHeight: 1.7,
    }}>
      {/* Nav */}
      <div style={{
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #eee', background: 'rgba(255,255,255,0.95)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <a href="/" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>Home</a>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>Home</a>
          <a href="/portal" style={{ fontSize: '12px', color: '#888', textDecoration: 'none' }}>Login</a>
          <a href="/onboard" style={{ fontSize: '12px', color: '#1D9E75', textDecoration: 'none' }}>Join</a>
        </div>
      </div>
      {/* Header */}
      <div style={{
        background: '#fff', padding: '3rem 2rem', textAlign: 'center',
        borderBottom: '4px solid #1D9E75',
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: '900', fontSize: '32px', letterSpacing: '0.12em', color: '#FF6B35', marginBottom: '12px' }}>SHINE</div>
        </div>
        <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' }}>
          Shine Frequency
        </div>
        <div style={{ fontSize: '16px', color: '#1D9E75', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Platform Guide
        </div>
        <div style={{ fontSize: '14px', color: '#666', maxWidth: '500px', margin: '0 auto' }}>
          Everything you need to know about managing releases, contacts, bookings, and distribution through the frequency platform.
        </div>
      </div>

      {/* Table of contents */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem' }}>
        <div style={{
          background: '#f8f8f8', borderRadius: '12px', padding: '1.5rem 2rem', marginBottom: '2rem',
          border: '1px solid #eee',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1D9E75', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Contents
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            {sections.map(s => (
              <a key={s.id} href={`#${s.id}`} style={{
                fontSize: '13px', color: '#333', textDecoration: 'none', padding: '4px 0',
              }}>
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        {sections.map(s => (
          <div key={s.id} id={s.id} style={{ marginBottom: '3rem' }}>
            <div style={{
              fontSize: '22px', fontWeight: '600', color: '#1D9E75',
              paddingBottom: '8px', borderBottom: '2px solid #1D9E75',
              marginBottom: '1rem',
            }}>
              {s.title}
            </div>
            <div style={{ fontSize: '14px', color: '#333' }}>
              {s.content.split('\n\n').map((para, i) => {
                if (para.startsWith('**') && para.includes(':**')) {
                  const [title, ...rest] = para.split(':**')
                  return (
                    <div key={i} style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: '#1a1a1a' }}>{title.replace(/\*\*/g, '')}:</strong>
                      <span>{rest.join(':**')}</span>
                    </div>
                  )
                }
                if (para.startsWith('- ')) {
                  return (
                    <ul key={i} style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
                      {para.split('\n').map((line, j) => (
                        <li key={j} style={{ marginBottom: '4px' }}>
                          {line.replace(/^- /, '').split('**').map((part, k) =>
                            k % 2 === 1 ? <strong key={k}>{part}</strong> : part
                          )}
                        </li>
                      ))}
                    </ul>
                  )
                }
                return (
                  <p key={i} style={{ marginBottom: '1rem' }}>
                    {para.split('**').map((part, k) =>
                      k % 2 === 1 ? <strong key={k}>{part}</strong> : part
                    )}
                  </p>
                )
              })}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          textAlign: 'center', padding: '2rem 0', borderTop: '1px solid #eee',
          marginTop: '2rem',
        }}>
          <div style={{ fontSize: '14px', color: '#1D9E75', fontWeight: '600' }}>frequency</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>London, UK</div>
          <div style={{ fontSize: '11px', color: '#bbb', marginTop: '8px' }}>
            To print this guide: File → Print → Save as PDF
          </div>
        </div>
      </div>
    </div>
  )
}
