'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/lib/toast'

const chapters = [
  {
    title: '1. What is Shine Frequency?',
    points: [
      'All-in-one platform for managing the label — replaces spreadsheets, email threads, scattered files',
      'Tracks the entire lifecycle of a release: demo submission through to DJ plays and reviews',
      'Built specifically for how you work — fast, efficient, everything visible at a glance',
    ],
  },
  {
    title: "2. Today's Queue (Dashboard)",
    points: [
      'Home screen showing what needs attention right now',
      'Urgent tasks (red) — overdue invoices, unsigned contracts',
      "Today's tasks (yellow) — chase reviews, send promos",
      'This week — upcoming items',
      'Pending reviews, upcoming bookings, overdue invoices, expiring promo windows',
      'Stats bar: active releases, pending reviews, urgent tasks, upcoming gigs, overdue invoices',
    ],
  },
  {
    title: '3. Releases',
    points: [
      'Core of the platform — every record on the label lives here',
      'Quick add or guided 4-step Wizard (Details, Tracklisting, Promo Window, Assign Contacts)',
      'Fields: catalogue number, artist, title, format, genre, BPM, dates, Dropbox/SoundCloud URLs',
      'Auto-creates Dropbox folder structure on release creation',
      'Filter by status (Draft/In Review/Scheduled/Live/Archived), heat level, format',
      'Detail panel: edit, manage promo list, open Dropbox, preview audio, share to X, copy for IG',
    ],
  },
  {
    title: '4. Contacts',
    points: [
      'All contacts: DJs, producers, press, venues, promoters, labels, artists',
      'Add manually, import CSV, or DJs self-sign-up at /join',
      'Types: DJ, Producer, Label, Venue, Promoter, Press, Artist, Industry',
      'Promo tiers: Tier 1 (first access), Tier 2 (standard), Tier 3 (extended)',
      'Tags for audiences, flags for promo list control (On Promo List, Trusted, High Value, SF Artist)',
      'Export CSV for external use',
    ],
  },
  {
    title: '5. Audiences',
    points: [
      'Named groups of contacts for targeted distribution (e.g. "UK DJs", "Berlin Press")',
      'Quick-fill buttons: All Tier 1, All DJs, All Press',
      'Send a release to an audience — all contacts added to promo list in one click',
      'Tags and audiences are the same under the hood',
    ],
  },
  {
    title: '6. Promo Distribution',
    points: [
      'Create release with promo window dates, assign contacts, send promo emails',
      'Each contact gets a unique tokenised download link',
      'Promo list page: who was invited, who downloaded, who reviewed',
      'Bulk actions: select by tier or all',
      'Heat Tracker shows promo momentum — downloads, reviews, chart entries',
    ],
  },
  {
    title: '7. DJ Feedback Form',
    points: [
      'DJs leave feedback at /review (can pre-set release: /review?release=SF-042)',
      'Structured data: rating, energy, mixability, sound quality, crowd reaction, play context',
      'Chart info, favourite track, written comments',
      'On submission a task appears in your queue for review approval',
    ],
  },
  {
    title: '8. Reviews',
    points: [
      'All DJ and press feedback lands here for approval',
      'Actions: Approve, Reject (with reason), Feature (for press quotes/social), Delete',
      'Featured reviews can be used for social — "Copy for IG" button on release detail panel',
    ],
  },
  {
    title: '9. Bookings',
    points: [
      'Manage bookings, contracts, travel, fees',
      'Statuses: Enquiry > Pending > Confirmed > Completed (or Cancelled)',
      'Contract: Not Sent > Sent > Signed',
      'Dashboard alerts for unsigned contracts and unbooked travel on upcoming gigs',
    ],
  },
  {
    title: '10. Invoicing',
    points: [
      'Create, send, track invoices with auto-calculated totals',
      'Actions: PDF, Email, Paid, Chase (overdue reminder), Edit, Delete',
      'Statuses: Draft > Sent > Viewed > Paid (or Overdue / Cancelled)',
      'Export CSV for accountant; overdue invoices appear in Today\'s Queue',
    ],
  },
  {
    title: '11. Messages',
    points: [
      'Internal message log organised by contact threads',
      'Messages also emailed to the contact\'s address; inbound replies are logged',
      'Use for chasing reviews, confirming bookings, following up invoices',
    ],
  },
  {
    title: '12. Dropbox Integration',
    points: [
      'Folder per release: /Shine Frequency/SF-046 - Artist Name/ with Masters, Artwork, Stems, Press Assets',
      'Auto-created on release creation',
      'Audio preview directly from release detail panel',
      'Dropbox URL included in promo emails',
    ],
  },
  {
    title: '13. Artist Onboarding',
    points: [
      '3-step form at /onboard: Basic info, Music details, Review & confirm',
      'Creates contact record (type: artist, SF artist flag) and artist record (inactive)',
      'Task appears in queue: "New artist submission: [name]" — review and activate',
    ],
  },
  {
    title: '14. Social & Campaigns',
    points: [
      'Social Scheduler: create/schedule posts for IG, Twitter, SoundCloud; track engagement',
      'Campaigns: track promo campaigns with recipient counts, open/click rates',
      'Quick share from releases: "Post to X" and "Copy for IG" buttons',
    ],
  },
  {
    title: '15. Podcasts',
    points: [
      'Manage podcast shows and episodes',
      'Pre-configured: Shine Frequency Radio (weekly), SF Late Night Series (monthly)',
      'Episode details: guest, duration, status, play count, platform links',
    ],
  },
  {
    title: '16. Reporting',
    points: [
      'Revenue: total paid, outstanding, overdue',
      'Release stats, contact stats, top releases by downloads/ratings',
      'Recent activity audit log',
    ],
  },
  {
    title: '17. Notifications',
    points: [
      'Bell icon shows live notifications (updates every 5s)',
      'Urgent tasks, pending reviews, overdue invoices',
      'Email alerts for critical events via /api/notifications',
    ],
  },
  {
    title: '18. Search',
    points: [
      'Cmd+K (Ctrl+K) for global search across releases, contacts, bookings, invoices',
      'Results grouped by type — click to jump',
    ],
  },
  {
    title: '19. Settings & Integrations',
    points: [
      'Label name, currency, timezone, Dropbox connection',
      'Keyboard shortcuts: Cmd+K (search), Escape (close panels)',
    ],
  },
  {
    title: '20. Key Workflows',
    points: [
      'New release: Wizard > Dropbox auto-creates > upload masters > send promos > approve reviews > share on social',
      'New booking: Add booking > send contract > chase if unsigned > book travel > create & send invoice > track payment',
      'New artist: /onboard submission > task in queue > review & approve > add to audiences > include in promos',
      'Promo sign-up: DJ signs up at /join > task in queue > set tier & approve > included in future distributions',
    ],
  },
]

type FeedbackType = 'Bug' | 'Feature Request' | 'Question' | 'Other'

export default function HelpPage() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<Set<number>>(new Set())
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('Bug')
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const filtered = chapters.filter(ch => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      ch.title.toLowerCase().includes(q) ||
      ch.points.some(p => p.toLowerCase().includes(q))
    )
  })

  const toggle = (i: number) => {
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!feedbackText.trim()) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      const title = `Feedback: ${feedbackType} — ${feedbackText.slice(0, 50)}`
      await (supabase as any).from('tasks').insert([{
        title,
        description: feedbackText,
        urgency: 'this_week',
        auto_generated: true,
      }])
      toast('Feedback submitted — thank you!')
      setFeedbackText('')
      setFeedbackType('Bug')
    } catch {
      toast('Failed to submit feedback', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
        Help & Knowledge Base
      </h1>
      <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '1.5rem' }}>
        Search or browse chapters below. Click a chapter to expand.
      </p>

      {/* Search */}
      <input
        type="text"
        placeholder="Search help topics..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 14px',
          fontSize: '13px',
          background: 'var(--bg-2)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius)',
          color: 'var(--text)',
          marginBottom: '1.5rem',
          outline: 'none',
        }}
      />

      {/* Chapters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '2.5rem' }}>
        {filtered.length === 0 && (
          <div style={{ fontSize: '13px', color: 'var(--text-3)', padding: '1rem 0' }}>
            No chapters match your search.
          </div>
        )}
        {filtered.map((ch, i) => {
          const idx = chapters.indexOf(ch)
          const isOpen = open.has(idx)
          return (
            <div
              key={idx}
              style={{
                background: 'var(--bg-2)',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => toggle(idx)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--text)',
                  textAlign: 'left',
                }}
              >
                {ch.title}
                <span style={{
                  fontSize: '11px',
                  color: 'var(--text-3)',
                  transition: 'transform 0.15s',
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                }}>
                  &#9654;
                </span>
              </button>
              {isOpen && (
                <ul style={{
                  padding: '0 14px 12px 30px',
                  margin: 0,
                  listStyle: 'disc',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}>
                  {ch.points.map((p, j) => (
                    <li key={j} style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {/* Feedback & Bug Reports */}
      <div style={{
        background: 'var(--bg-2)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1.25rem',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
          Feedback & Bug Reports
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '1rem' }}>
          You can also email feedback to <strong>shineprdev@gmail.com</strong>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <select
            value={feedbackType}
            onChange={e => setFeedbackType(e.target.value as FeedbackType)}
            style={{
              padding: '8px 10px',
              fontSize: '12px',
              background: 'var(--bg-3)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              outline: 'none',
              width: '200px',
            }}
          >
            <option value="Bug">Bug</option>
            <option value="Feature Request">Feature Request</option>
            <option value="Question">Question</option>
            <option value="Other">Other</option>
          </select>

          <textarea
            placeholder="Describe your feedback, bug, or question..."
            value={feedbackText}
            onChange={e => setFeedbackText(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '12px',
              background: 'var(--bg-3)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />

          <button
            onClick={handleSubmit}
            disabled={submitting || !feedbackText.trim()}
            style={{
              alignSelf: 'flex-start',
              padding: '8px 20px',
              fontSize: '12px',
              fontWeight: '500',
              background: 'var(--green)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: submitting || !feedbackText.trim() ? 'not-allowed' : 'pointer',
              opacity: submitting || !feedbackText.trim() ? 0.5 : 1,
            }}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
