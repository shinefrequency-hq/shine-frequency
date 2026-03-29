'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/lib/toast'

interface Booking {
  id: string
  event_date: string
  venue_name: string
  venue_city: string
  set_time: string | null
  fee: number
  currency: string
  status: string
  contract_status: string
  artists?: { stage_name: string } | null
}

function generateICS(booking: Booking) {
  const date = booking.event_date.replace(/-/g, '')
  const title = `${booking.artists?.stage_name || 'Artist'} @ ${booking.venue_name}`
  const location = `${booking.venue_name}, ${booking.venue_city}`
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Shine Frequency//EN',
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${date}`,
    `DTEND;VALUE=DATE:${date}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${booking.set_time || ''} | Fee: ${booking.fee} ${booking.currency} | Status: ${booking.status}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/[^a-zA-Z0-9]/g, '-')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

function generateAllICS(bookings: Booking[]) {
  const events = bookings.map(b => {
    const date = b.event_date.replace(/-/g, '')
    const title = `${b.artists?.stage_name || 'Artist'} @ ${b.venue_name}`
    const location = `${b.venue_name}, ${b.venue_city}`
    return [
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${date}`,
      `DTEND;VALUE=DATE:${date}`,
      `SUMMARY:${title}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${b.set_time || ''} | Fee: ${b.fee} ${b.currency} | Status: ${b.status}`,
      'END:VEVENT',
    ].join('\r\n')
  })
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Shine Frequency//EN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'shine-frequency-bookings.ics'
  a.click()
  URL.revokeObjectURL(url)
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  // Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const days: (number | null)[] = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

export default function CalendarPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Booking | null>(null)

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  useEffect(() => {
    loadBookings()
  }, [])

  async function loadBookings() {
    const { data, error } = await (supabase as any)
      .from('bookings')
      .select('*, artists(stage_name)')
      .order('event_date')
    if (error) {
      toast(error.message, 'error')
    } else {
      setBookings(data || [])
    }
    setLoading(false)
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const days = getMonthDays(year, month)
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  function bookingsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return bookings.filter(b => b.event_date === dateStr)
  }

  const cs = (c: string) => c === 'GBP' ? '\u00a3' : c === 'EUR' ? '\u20ac' : '$'

  const btnStyle: React.CSSProperties = {
    padding: '6px 14px',
    background: 'var(--bg-3)',
    border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '500',
  }

  return (
    <div style={{ padding: '2rem', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>Calendar</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: '4px 0 0' }}>{bookings.length} bookings total</p>
        </div>
        <button
          onClick={() => generateAllICS(bookings)}
          disabled={bookings.length === 0}
          style={{
            ...btnStyle,
            background: 'var(--green)',
            color: '#fff',
            border: 'none',
            opacity: bookings.length === 0 ? 0.5 : 1,
          }}
        >
          Export all
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {/* Calendar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Month nav */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '1rem', padding: '10px 16px',
            background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)',
          }}>
            <button onClick={prevMonth} style={btnStyle}>&larr; Prev</button>
            <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>
              {MONTHS[month]} {year}
            </span>
            <button onClick={nextMonth} style={btnStyle}>Next &rarr;</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }}>
            {DAYS.map(d => (
              <div key={d} style={{
                padding: '8px', textAlign: 'center', fontSize: '10px', fontWeight: '600',
                color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                {d}
              </div>
            ))}

            {/* Day cells */}
            {days.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} style={{ minHeight: '90px', background: 'var(--bg)' }} />
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isToday = dateStr === todayStr
              const dayBookings = bookingsForDay(day)
              return (
                <div key={`day-${day}`} style={{
                  minHeight: '90px',
                  padding: '4px 6px',
                  background: isToday ? 'color-mix(in srgb, var(--green) 8%, var(--bg-2))' : 'var(--bg-2)',
                  border: isToday ? '1.5px solid var(--green)' : '0.5px solid var(--border)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    fontSize: '11px', fontWeight: isToday ? '700' : '500',
                    color: isToday ? 'var(--green)' : 'var(--text-3)',
                    marginBottom: '4px',
                  }}>
                    {day}
                  </div>
                  {dayBookings.map(b => (
                    <div
                      key={b.id}
                      onClick={() => setSelected(b)}
                      style={{
                        padding: '3px 6px',
                        marginBottom: '2px',
                        background: b.status === 'confirmed' ? 'color-mix(in srgb, var(--green) 18%, transparent)' : 'var(--bg-3)',
                        border: '0.5px solid var(--border)',
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: '1.4',
                      }}
                      title={`${b.artists?.stage_name || 'Artist'} @ ${b.venue_name}`}
                    >
                      <strong>{b.artists?.stage_name || 'Artist'}</strong>
                      <br />
                      <span style={{ color: 'var(--text-3)' }}>{b.venue_name}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Side panel */}
        {selected && (
          <div style={{
            width: '320px', flexShrink: 0,
            background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)',
            padding: '1.25rem', alignSelf: 'flex-start', position: 'sticky', top: '2rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>Booking details</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>&times;</button>
            </div>

            {[
              { label: 'Artist', value: selected.artists?.stage_name || '—' },
              { label: 'Venue', value: selected.venue_name },
              { label: 'City', value: selected.venue_city },
              { label: 'Date', value: new Date(selected.event_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
              { label: 'Set time', value: selected.set_time || 'TBC' },
              { label: 'Fee', value: `${cs(selected.currency)}${selected.fee?.toLocaleString()} ${selected.currency}` },
              { label: 'Status', value: selected.status },
              { label: 'Contract', value: selected.contract_status },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '500' }}>{row.label}</span>
                <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: '500', textAlign: 'right' }}>{row.value}</span>
              </div>
            ))}

            <button
              onClick={() => { generateICS(selected); toast('Calendar file downloaded', 'success') }}
              style={{ ...btnStyle, width: '100%', marginTop: '1rem', textAlign: 'center', background: 'var(--green)', color: '#fff', border: 'none' }}
            >
              Add to calendar
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)', fontSize: '13px' }}>Loading bookings...</div>
      )}
    </div>
  )
}
