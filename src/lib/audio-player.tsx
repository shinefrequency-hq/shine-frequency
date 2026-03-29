'use client'

import { useEffect, useRef, useState } from 'react'

interface Track {
  name: string
  url: string
  size: number
}

interface AudioPlayerProps {
  releaseId: string
  dropboxFolderPath: string
}

export function AudioPlayer({ releaseId, dropboxFolderPath }: AudioPlayerProps) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentTrack, setCurrentTrack] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    async function loadTracks() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/dropbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'list_audio_files',
            path: dropboxFolderPath,
          }),
        })
        const data = await res.json()
        if (data.tracks && data.tracks.length > 0) {
          setTracks(data.tracks)
        } else {
          setError('No audio files found')
        }
      } catch {
        setError('Could not load tracks')
      }
      setLoading(false)
    }
    if (dropboxFolderPath) loadTracks()
  }, [releaseId, dropboxFolderPath])

  function playTrack(idx: number) {
    if (currentTrack === idx && playing) {
      audioRef.current?.pause()
      setPlaying(false)
      return
    }
    setCurrentTrack(idx)
    setPlaying(true)
    setProgress(0)
    // Audio element will auto-play when src changes via useEffect below
  }

  useEffect(() => {
    if (currentTrack !== null && audioRef.current && tracks[currentTrack]) {
      audioRef.current.src = tracks[currentTrack].url
      audioRef.current.play().catch(() => {})
    }
  }, [currentTrack])

  function handleTimeUpdate() {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime)
      setDuration(audioRef.current.duration || 0)
    }
  }

  function handleEnded() {
    setPlaying(false)
    if (currentTrack !== null && currentTrack < tracks.length - 1) {
      playTrack(currentTrack + 1)
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = pct * duration
  }

  function formatTime(s: number) {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  function cleanName(name: string) {
    return name
      .replace(/\.(wav|mp3|aiff|aif|flac|m4a|ogg)$/i, '')
      .replace(/^\d+[\s._-]+/, '') // remove leading track numbers
  }

  function formatSize(bytes: number) {
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    return `${Math.round(bytes / 1024)} KB`
  }

  if (loading) {
    return (
      <div style={{ padding: '12px', background: 'var(--bg-4)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-3)' }}>
        Loading tracks from Dropbox...
      </div>
    )
  }

  if (error || tracks.length === 0) {
    return (
      <div style={{ padding: '12px', background: 'var(--bg-4)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-3)' }}>
        {error || 'No audio files in Dropbox folder'}
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-4)', borderRadius: '10px', overflow: 'hidden' }}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* Now playing bar */}
      {currentTrack !== null && (
        <div style={{ padding: '10px 12px', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <button
              onClick={() => playing ? audioRef.current?.pause() : audioRef.current?.play()}
              style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#1D9E75', border: 'none', color: '#fff',
                fontSize: '12px', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              {playing ? '❚❚' : '▶'}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cleanName(tracks[currentTrack].name)}
              </div>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'monospace', flexShrink: 0 }}>
              {formatTime(progress)} / {formatTime(duration)}
            </div>
          </div>
          {/* Progress bar */}
          <div
            onClick={seek}
            style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', cursor: 'pointer', position: 'relative' }}
          >
            <div style={{
              height: '100%', borderRadius: '2px', background: '#1D9E75',
              width: duration > 0 ? `${(progress / duration) * 100}%` : '0%',
              transition: 'width 0.1s',
            }} />
          </div>
        </div>
      )}

      {/* Track list */}
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {tracks.map((t, idx) => (
          <div
            key={t.name}
            onClick={() => playTrack(idx)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px',
              background: currentTrack === idx ? 'var(--bg-3)' : 'transparent',
              cursor: 'pointer', transition: 'background 0.1s',
              borderBottom: idx < tracks.length - 1 ? '0.5px solid var(--border)' : 'none',
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: currentTrack === idx && playing ? '#1D9E75' : 'var(--bg-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', color: currentTrack === idx && playing ? '#fff' : 'var(--text-3)',
              flexShrink: 0,
            }}>
              {currentTrack === idx && playing ? '▶' : idx + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '12px', color: currentTrack === idx ? '#1D9E75' : 'var(--text)',
                fontWeight: currentTrack === idx ? '500' : '400',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {cleanName(t.name)}
              </div>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', flexShrink: 0 }}>
              {formatSize(t.size)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
