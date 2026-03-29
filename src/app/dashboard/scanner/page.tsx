'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/lib/toast'

interface Release {
  id: string
  catalogue_number: string | null
  artist_name: string | null
  title: string
  status: string | null
}

interface YouTubeResult {
  title: string
  channel: string
  views: number
  published: string
  duration: string
  thumbnail: string
  url: string
}

interface MixcloudResult {
  title: string
  channel: string
  listeners: number
  plays: number
  favourites: number
  duration: string
  url: string
}

interface DiscogsResult {
  title: string
  label: string
  year: number
  format: string
  country: string
  want: number
  have: number
  url: string
}

interface TracklistResult {
  title: string
  url: string
}

interface ScanResults {
  youtube: YouTubeResult[]
  mixcloud: MixcloudResult[]
  discogs: DiscogsResult[]
  tracklists: TracklistResult[]
  scanned_at: string
}

export default function ScannerPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [releases, setReleases] = useState<Release[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scanType, setScanType] = useState<'release' | 'artist'>('release')
  const [results, setResults] = useState<ScanResults | null>(null)

  useEffect(() => {
    loadReleases()
  }, [])

  async function loadReleases() {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('releases')
      .select('id, catalogue_number, artist_name, title, status')
      .order('created_at', { ascending: false })

    const rows = (data ?? []) as Release[]
    setReleases(rows)

    // Auto-select first live/scheduled release
    const preferred = rows.find(r => r.status === 'live' || r.status === 'scheduled')
    if (preferred) setSelectedId(preferred.id)
    else if (rows.length > 0) setSelectedId(rows[0].id)

    setLoading(false)
  }

  const selectedRelease = releases.find(r => r.id === selectedId)

  async function handleScan(type: 'release' | 'artist') {
    if (!selectedRelease) {
      toast('Select a release first', 'error')
      return
    }
    setScanning(true)
    setScanType(type)
    setResults(null)

    try {
      const res = await fetch('/api/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: type === 'release' ? 'scan_release' : 'scan_artist',
          artist_name: selectedRelease.artist_name ?? '',
          title: selectedRelease.title,
          catalogue_number: selectedRelease.catalogue_number ?? '',
        }),
      })

      if (!res.ok) throw new Error('Scan failed')

      const data = await res.json()
      setResults(data)
      toast('Scan complete', 'success')
    } catch (e: any) {
      toast(e.message || 'Scan failed', 'error')
    } finally {
      setScanning(false)
    }
  }

  const ytCount = results?.youtube?.length ?? 0
  const mcCount = results?.mixcloud?.length ?? 0
  const dcCount = results?.discogs?.length ?? 0
  const tlCount = results?.tracklists?.length ?? 0

  return (
    <div style={{ padding: '24px 32px', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
          Track Discovery
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', margin: '4px 0 0' }}>
          Scan the web for plays, mentions, charts and DJ sets featuring your releases
        </p>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        {/* Release selector */}
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          disabled={loading || scanning}
          style={{
            flex: '1 1 300px',
            maxWidth: '500px',
            padding: '10px 12px',
            background: 'var(--bg-2)',
            color: 'var(--text)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          {loading && <option>Loading releases...</option>}
          {!loading && releases.length === 0 && <option>No releases found</option>}
          {releases.map(r => (
            <option key={r.id} value={r.id}>
              {[r.catalogue_number, r.artist_name, r.title].filter(Boolean).join(' — ')}
            </option>
          ))}
        </select>

        {/* Scan release button */}
        <button
          onClick={() => handleScan('release')}
          disabled={scanning || !selectedRelease}
          style={{
            padding: '10px 24px',
            background: scanning && scanType === 'release' ? '#2a5a3a' : '#4ecca3',
            color: '#000',
            border: 'none',
            borderRadius: 'var(--radius)',
            fontSize: '13px',
            fontWeight: '600',
            cursor: scanning ? 'wait' : 'pointer',
            opacity: !selectedRelease ? 0.5 : 1,
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {scanning && scanType === 'release' ? 'Scanning...' : 'Scan the web'}
        </button>

        {/* Scan artist button */}
        <button
          onClick={() => handleScan('artist')}
          disabled={scanning || !selectedRelease}
          style={{
            padding: '10px 20px',
            background: 'transparent',
            color: 'var(--text-2)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: '13px',
            fontWeight: '500',
            cursor: scanning ? 'wait' : 'pointer',
            opacity: !selectedRelease ? 0.5 : 1,
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {scanning && scanType === 'artist' ? 'Scanning...' : 'Scan artist'}
        </button>
      </div>

      {/* Scanning animation */}
      {scanning && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: 'var(--bg-2)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius)',
          marginBottom: '24px',
        }}>
          <div style={{
            fontSize: '14px',
            color: 'var(--text-2)',
            marginBottom: '12px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}>
            Scanning YouTube, Mixcloud, Discogs, 1001Tracklists...
          </div>
          <div style={{
            width: '200px',
            height: '3px',
            background: 'var(--border)',
            borderRadius: '2px',
            margin: '0 auto',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              width: '60px',
              height: '100%',
              background: '#4ecca3',
              borderRadius: '2px',
              animation: 'scanbar 1.2s ease-in-out infinite',
            }} />
          </div>
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
            @keyframes scanbar {
              0% { left: -60px; }
              100% { left: 200px; }
            }
          `}</style>
        </div>
      )}

      {/* Results */}
      {results && !scanning && (
        <>
          {/* Last scanned */}
          <div style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '16px' }}>
            Last scanned: {new Date(results.scanned_at).toLocaleString()}
          </div>

          {/* Summary bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '32px',
          }}>
            {[
              { label: 'YouTube mentions', count: ytCount, color: '#7ab8f5' },
              { label: 'Mixcloud appearances', count: mcCount, color: '#b8b4f0' },
              { label: 'Discogs listings', count: dcCount, color: '#4ecca3' },
              { label: '1001Tracklists sets', count: tlCount, color: '#ff7043' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--bg-2)',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: s.color }}>
                  {s.count}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* YouTube section */}
          <Section title="Found on YouTube" accent="#7ab8f5" empty={ytCount === 0} platform="YouTube">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {results.youtube.map((yt, i) => (
                <div key={i} style={{
                  display: 'flex',
                  gap: '12px',
                  background: '#111',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '12px',
                }}>
                  <img
                    src={yt.thumbnail}
                    alt=""
                    style={{
                      width: '120px',
                      height: '68px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      flexShrink: 0,
                      background: '#222',
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: '13px', fontWeight: '600', color: 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {yt.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                      {yt.channel}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span>{yt.views?.toLocaleString()} views</span>
                      <span>{yt.duration}</span>
                      <span>{yt.published}</span>
                    </div>
                    <a
                      href={yt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        marginTop: '6px',
                        fontSize: '11px',
                        color: '#7ab8f5',
                        textDecoration: 'none',
                      }}
                    >
                      Open &rarr;
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Mixcloud section */}
          <Section title="Found on Mixcloud" accent="#b8b4f0" empty={mcCount === 0} platform="Mixcloud">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {results.mixcloud.map((mc, i) => (
                <div key={i} style={{
                  background: 'var(--bg-2)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '14px',
                }}>
                  <div style={{
                    fontSize: '13px', fontWeight: '600', color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {mc.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#b8b4f0', marginTop: '2px' }}>
                    {mc.channel}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '6px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span>{mc.listeners?.toLocaleString()} listeners</span>
                    <span>{mc.plays?.toLocaleString()} plays</span>
                    <span>{mc.favourites?.toLocaleString()} favs</span>
                    <span>{mc.duration}</span>
                  </div>
                  <a
                    href={mc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      marginTop: '8px',
                      fontSize: '11px',
                      color: '#b8b4f0',
                      textDecoration: 'none',
                    }}
                  >
                    Open &rarr;
                  </a>
                </div>
              ))}
            </div>
          </Section>

          {/* Discogs section */}
          <Section title="Found on Discogs" accent="#4ecca3" empty={dcCount === 0} platform="Discogs">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.discogs.map((dc, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-2)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '12px 14px',
                  gap: '12px',
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                      {dc.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span>{dc.label}</span>
                      <span>{dc.year}</span>
                      <span>{dc.format}</span>
                      <span>{dc.country}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#4ecca3' }}>{dc.want}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase' }}>Want</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-2)' }}>{dc.have}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase' }}>Have</div>
                    </div>
                    <a
                      href={dc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '5px 12px',
                        fontSize: '11px',
                        color: '#4ecca3',
                        border: '0.5px solid #4ecca3',
                        borderRadius: 'var(--radius)',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Open &rarr;
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 1001Tracklists section */}
          <Section title="Found in DJ Sets" accent="#ff7043" empty={tlCount === 0} platform="1001Tracklists">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {results.tracklists.map((tl, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-2)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '10px 14px',
                }}>
                  <div style={{ fontSize: '13px', color: 'var(--text)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {tl.title}
                  </div>
                  <a
                    href={tl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '5px 12px',
                      fontSize: '11px',
                      color: '#ff7043',
                      border: '0.5px solid #ff7043',
                      borderRadius: 'var(--radius)',
                      textDecoration: 'none',
                      flexShrink: 0,
                      marginLeft: '12px',
                    }}
                  >
                    Open &rarr;
                  </a>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* Initial empty state */}
      {!results && !scanning && !loading && (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: 'var(--bg-2)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}>
          <div style={{ fontSize: '14px', color: 'var(--text-3)', marginBottom: '6px' }}>
            Select a release and hit Scan to discover where it appears online
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>
            Searches YouTube, Mixcloud, Discogs, and 1001Tracklists
          </div>
        </div>
      )}
    </div>
  )
}

/* Reusable section wrapper */
function Section({
  title,
  accent,
  empty,
  platform,
  children,
}: {
  title: string
  accent: string
  empty: boolean
  platform: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <h2 style={{
        fontSize: '15px',
        fontWeight: '600',
        color: accent,
        margin: '0 0 12px',
        paddingBottom: '6px',
        borderBottom: `1px solid ${accent}33`,
      }}>
        {title}
      </h2>
      {empty ? (
        <div style={{ padding: '20px', fontSize: '12px', color: 'var(--text-4)' }}>
          No results found on {platform}
        </div>
      ) : (
        children
      )}
    </div>
  )
}
