import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// YouTube search via oembed/scrape approach (no API key needed)
async function searchYouTube(query: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=CAI%253D`,
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en-US' } }
    )
    const html = await res.text()

    // Extract video data from initial data
    const match = html.match(/var ytInitialData = (.+?);<\/script>/)
    if (!match) return []

    const data = JSON.parse(match[1])
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents ?? []

    return contents
      .filter((c: any) => c.videoRenderer)
      .slice(0, 10)
      .map((c: any) => {
        const v = c.videoRenderer
        return {
          platform: 'youtube',
          title: v.title?.runs?.[0]?.text ?? '',
          url: `https://youtube.com/watch?v=${v.videoId}`,
          channel: v.ownerText?.runs?.[0]?.text ?? '',
          views: v.viewCountText?.simpleText ?? v.viewCountText?.runs?.[0]?.text ?? '',
          published: v.publishedTimeText?.simpleText ?? '',
          thumbnail: v.thumbnail?.thumbnails?.[0]?.url ?? '',
          duration: v.lengthText?.simpleText ?? '',
        }
      })
  } catch (e) {
    console.error('YouTube search error:', e)
    return []
  }
}

// Mixcloud search (free API)
async function searchMixcloud(query: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://api.mixcloud.com/search/?q=${encodeURIComponent(query)}&type=cloudcast&limit=10`
    )
    const data = await res.json()
    return (data.data ?? []).map((m: any) => ({
      platform: 'mixcloud',
      title: m.name,
      url: `https://mixcloud.com${m.key}`,
      channel: m.user?.name ?? '',
      views: `${m.listener_count ?? 0} listeners`,
      published: m.created_time ? new Date(m.created_time).toLocaleDateString('en-GB') : '',
      thumbnail: m.pictures?.medium ?? '',
      duration: m.audio_length ? `${Math.floor(m.audio_length / 60)}min` : '',
      plays: m.play_count ?? 0,
      favorites: m.favorite_count ?? 0,
      repost_count: m.repost_count ?? 0,
    }))
  } catch (e) {
    console.error('Mixcloud search error:', e)
    return []
  }
}

// Discogs search (free, no auth for search)
async function searchDiscogs(query: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&per_page=10`,
      { headers: { 'User-Agent': 'ShineFrequency/1.0' } }
    )
    const data = await res.json()
    return (data.results ?? []).map((r: any) => ({
      platform: 'discogs',
      title: r.title,
      url: `https://discogs.com${r.uri}`,
      label: r.label?.join(', ') ?? '',
      year: r.year ?? '',
      format: r.format?.join(', ') ?? '',
      country: r.country ?? '',
      thumbnail: r.cover_image ?? '',
      community_want: r.community?.want ?? 0,
      community_have: r.community?.have ?? 0,
    }))
  } catch (e) {
    console.error('Discogs search error:', e)
    return []
  }
}

// 1001Tracklists search (scrape)
async function search1001Tracklists(query: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://www.1001tracklists.com/search/result.php?search_selection=2&main_search=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    const html = await res.text()

    // Extract tracklist links
    const matches = [...html.matchAll(/<a href="(\/tracklist\/[^"]+)"[^>]*>([^<]+)<\/a>/g)]
    return matches.slice(0, 10).map(m => ({
      platform: '1001tracklists',
      title: m[2].trim(),
      url: `https://www.1001tracklists.com${m[1]}`,
    }))
  } catch (e) {
    console.error('1001Tracklists search error:', e)
    return []
  }
}

// Beatport chart search (scrape search page)
async function searchBeatport(query: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://www.beatport.com/search?q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    const html = await res.text()

    // Look for track data in the page
    const trackMatches = [...html.matchAll(/"name":"([^"]+)","mix_name":"([^"]*)".*?"artists":\[.*?"name":"([^"]+)".*?\]/g)]
    return trackMatches.slice(0, 10).map(m => ({
      platform: 'beatport',
      title: `${m[3]} - ${m[1]}${m[2] ? ` (${m[2]})` : ''}`,
      url: `https://beatport.com/search?q=${encodeURIComponent(query)}`,
    }))
  } catch (e) {
    console.error('Beatport search error:', e)
    return []
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  if (action === 'scan_release') {
    const { artist_name, title, catalogue_number } = body

    // Build search queries
    const queries = [
      `${artist_name} ${title}`,
      `${artist_name} "${title}"`,
      catalogue_number,
    ]

    // Run all searches in parallel
    const [
      youtube1, youtube2,
      mixcloud1, mixcloud2,
      discogs1,
      tracklists1,
    ] = await Promise.all([
      searchYouTube(queries[0]),
      searchYouTube(queries[1]),
      searchMixcloud(queries[0]),
      searchMixcloud(artist_name),
      searchDiscogs(queries[0]),
      search1001Tracklists(queries[0]),
    ])

    // Deduplicate YouTube results by URL
    const allYoutube = [...youtube1, ...youtube2]
      .filter((v, i, arr) => arr.findIndex(x => x.url === v.url) === i)

    // Deduplicate Mixcloud
    const allMixcloud = [...mixcloud1, ...mixcloud2]
      .filter((m, i, arr) => arr.findIndex(x => x.url === m.url) === i)

    const results = {
      youtube: allYoutube,
      mixcloud: allMixcloud,
      discogs: discogs1,
      tracklists: tracklists1,
      scanned_at: new Date().toISOString(),
      queries_used: queries,
      totals: {
        youtube: allYoutube.length,
        mixcloud: allMixcloud.length,
        discogs: discogs1.length,
        tracklists: tracklists1.length,
        total: allYoutube.length + allMixcloud.length + discogs1.length + tracklists1.length,
      },
    }

    return NextResponse.json({ success: true, results })
  }

  if (action === 'scan_artist') {
    const { artist_name } = body

    const [youtube, mixcloud, discogs] = await Promise.all([
      searchYouTube(`${artist_name} DJ set techno`),
      searchMixcloud(artist_name),
      searchDiscogs(artist_name),
    ])

    return NextResponse.json({
      success: true,
      results: {
        youtube, mixcloud, discogs,
        totals: {
          youtube: youtube.length,
          mixcloud: mixcloud.length,
          discogs: discogs.length,
          total: youtube.length + mixcloud.length + discogs.length,
        },
      },
    })
  }

  if (action === 'save_discovery') {
    const { release_id, discovery } = body
    const { error } = await (supabase as any).from('discoveries').upsert([{
      release_id,
      ...discovery,
      is_approved: true,
    }], { onConflict: 'id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  if (action === 'get_discoveries') {
    const { release_id } = body
    const { data } = await (supabase as any)
      .from('discoveries')
      .select('*')
      .eq('release_id', release_id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
    return NextResponse.json({ success: true, discoveries: data ?? [] })
  }

  if (action === 'add_note') {
    const { id, note } = body
    await (supabase as any).from('discoveries').update({ note }).eq('id', id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
