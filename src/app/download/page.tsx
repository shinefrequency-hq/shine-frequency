'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type ReleaseData = {
  id: string
  catalogue_number: string
  title: string
  artist_name: string
  genre: string | null
  bpm_range: string | null
  artwork_url: string | null
  dropbox_folder_url: string | null
}

type TrackData = {
  id: string
  position: string
  title: string
  bpm: number | null
  key: string | null
}

type PromoData = {
  id: string
  contact_id: string
  release_id: string
  downloaded_at: string | null
  download_count: number
  token_expires_at: string | null
}

export default function DownloadPageWrapper() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E6E6E6', color: '#999', fontFamily: 'system-ui' }}>
        Loading...
      </div>
    }>
      <DownloadPage />
    </Suspense>
  )
}

function DownloadPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [release, setRelease] = useState<ReleaseData | null>(null)
  const [tracks, setTracks] = useState<TrackData[]>([])
  const [contactName, setContactName] = useState('')
  const [downloadCount, setDownloadCount] = useState(0)

  useEffect(() => {
    if (!token) {
      setError('No download token provided. Please check your link.')
      setLoading(false)
      return
    }

    async function load() {
      // Look up promo list by access_token
      const { data: promo, error: promoErr } = await (supabase as any)
        .from('promo_lists')
        .select('id, contact_id, release_id, downloaded_at, download_count, token_expires_at')
        .eq('access_token', token)
        .single()

      if (promoErr || !promo) {
        setError('This download link is not valid. It may have already been used or the token is incorrect.')
        setLoading(false)
        return
      }

      const promoData = promo as PromoData

      // Check expiry
      if (promoData.token_expires_at && new Date(promoData.token_expires_at) < new Date()) {
        setError('This download link has expired. Please contact Shine Frequency for a new link.')
        setLoading(false)
        return
      }

      // Fetch release details
      const { data: rel } = await (supabase as any)
        .from('releases')
        .select('id, catalogue_number, title, artist_name, genre, bpm_range, artwork_url, dropbox_folder_url')
        .eq('id', promoData.release_id)
        .single()

      if (!rel) {
        setError('Release not found.')
        setLoading(false)
        return
      }

      // Fetch contact name
      const { data: contact } = await (supabase as any)
        .from('contacts')
        .select('full_name')
        .eq('id', promoData.contact_id)
        .single()

      // Fetch tracks
      const { data: trackData } = await (supabase as any)
        .from('tracks')
        .select('id, position, title, bpm, key')
        .eq('release_id', promoData.release_id)
        .order('position', { ascending: true })

      setRelease(rel as ReleaseData)
      setTracks((trackData ?? []) as TrackData[])
      setContactName(contact?.full_name ?? '')

      // Update download tracking: set downloaded_at if first time, increment count
      const newCount = (promoData.download_count || 0) + 1
      const updatePayload: Record<string, any> = { download_count: newCount }
      if (!promoData.downloaded_at) {
        updatePayload.downloaded_at = new Date().toISOString()
      }

      await (supabase as any)
        .from('promo_lists')
        .update(updatePayload)
        .eq('id', promoData.id)

      setDownloadCount(newCount)

      // Insert download event
      await (supabase as any)
        .from('download_events')
        .insert([{
          release_id: promoData.release_id,
          contact_id: promoData.contact_id,
          promo_list_id: promoData.id,
          delivery_method: 'dropbox',
          downloaded_at: new Date().toISOString(),
        }])

      setLoading(false)
    }

    load()
  }, [token])

  // Extract first name from full name
  const firstName = contactName.split(' ')[0]

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E6E6E6', color: '#999', fontFamily: 'system-ui' }}>
        Loading your promo...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E6E6E6', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', background: '#fff', border: '1px solid #ddd', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ background: '#1D9E75', color: '#fff', fontWeight: '800', fontSize: '32px', letterSpacing: '0.15em', padding: '12px 24px', borderRadius: '6px', display: 'inline-block' }}>SHINE</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px' }}>Link not valid</div>
          <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.6 }}>{error}</div>
          <div style={{ marginTop: '1.5rem', fontSize: '11px', color: '#999' }}>
            Shine Frequency — London, UK
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#E6E6E6', fontFamily: 'system-ui, sans-serif', padding: '0' }}>
      {/* Nav */}
      <div style={{
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #ddd', background: 'rgba(255,255,255,0.95)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#1a1a1a' }}>
          <div style={{ background: '#1D9E75', color: '#fff', fontWeight: '800', fontSize: '12px', letterSpacing: '0.12em', padding: '4px 8px', borderRadius: '3px' }}>SHINE</div>
          <span style={{ fontSize: '13px', fontWeight: '500' }}>Shine Frequency</span>
        </a>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/" style={{ fontSize: '12px', color: '#666', textDecoration: 'none' }}>Home</a>
          <a href="/review" style={{ fontSize: '12px', color: '#1D9E75', textDecoration: 'none' }}>Leave Feedback</a>
        </div>
      </div>
      <div style={{ padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ background: '#1D9E75', color: '#fff', fontWeight: '800', fontSize: '32px', letterSpacing: '0.15em', padding: '12px 24px', borderRadius: '6px', display: 'inline-block' }}>SHINE</div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '500', color: '#1a1a1a' }}>Your promo copy is ready</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Shine Frequency promo distribution</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '16px', padding: '1.75rem' }}>

          {/* Personalised greeting */}
          {firstName && (
            <div style={{ fontSize: '15px', color: '#666', marginBottom: '1.5rem' }}>
              Hey <span style={{ color: '#1a1a1a', fontWeight: '500' }}>{firstName}</span>,
            </div>
          )}

          {/* Release artwork + details */}
          {release && (
            <div style={{ display: 'flex', gap: '16px', padding: '16px', background: '#E6E6E6', borderRadius: '12px', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
              {release.artwork_url ? (
                <img
                  src={release.artwork_url}
                  alt={`${release.artist_name} - ${release.title}`}
                  style={{ width: '120px', height: '120px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: '120px', height: '120px', borderRadius: '10px', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', color: '#999', flexShrink: 0, textAlign: 'center', padding: '8px',
                }}>
                  {release.catalogue_number}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: '#1D9E75', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {release.catalogue_number}
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '2px' }}>
                  {release.artist_name}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                  {release.title}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {release.genre && (
                    <span style={{ padding: '3px 10px', background: '#e6f7f0', border: '1px solid #1D9E75', borderRadius: '12px', fontSize: '11px', color: '#1D9E75' }}>
                      {release.genre}
                    </span>
                  )}
                  {release.bpm_range && (
                    <span style={{ padding: '3px 10px', background: '#fff', border: '1px solid #ccc', borderRadius: '12px', fontSize: '11px', color: '#666' }}>
                      {release.bpm_range} BPM
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Track listing */}
          {tracks.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '10px' }}>Track listing</div>
              <div style={{ background: '#E6E6E6', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                      <th style={{ padding: '8px 12px', fontSize: '10px', fontWeight: '500', color: '#999', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</th>
                      <th style={{ padding: '8px 12px', fontSize: '10px', fontWeight: '500', color: '#999', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title</th>
                      <th style={{ padding: '8px 12px', fontSize: '10px', fontWeight: '500', color: '#999', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.5px' }}>BPM</th>
                      <th style={{ padding: '8px 12px', fontSize: '10px', fontWeight: '500', color: '#999', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Key</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tracks.map((track, i) => (
                      <tr key={track.id} style={{ borderBottom: i < tracks.length - 1 ? '1px solid #ddd' : 'none' }}>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: '#999' }}>{track.position}</td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', color: '#1a1a1a', fontWeight: '400' }}>{track.title}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: '#666', textAlign: 'right' }}>{track.bpm ?? '—'}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: '#666', textAlign: 'right' }}>{track.key ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Download button */}
          {release?.dropbox_folder_url && (
            <a
              href={release.dropbox_folder_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                width: '100%',
                padding: '14px',
                background: '#1D9E75',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                textAlign: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'background 0.15s',
                marginBottom: '1rem',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#23b888')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1D9E75')}
            >
              Download from Dropbox
            </a>
          )}

          {/* Download counter */}
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginBottom: '1.25rem' }}>
            Downloaded {downloadCount} {downloadCount === 1 ? 'time' : 'times'}
          </div>

          {/* Privacy notice */}
          <div style={{
            padding: '10px 16px',
            background: '#E6E6E6',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#999',
            textAlign: 'center',
            lineHeight: 1.5,
          }}>
            This link is personal to you. Please don't share it.
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '11px', color: '#999' }}>
          Shine Frequency — London, UK
        </div>
      </div>
      </div>
    </div>
  )
}
