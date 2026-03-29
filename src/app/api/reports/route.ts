import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  try {
    if (action === 'weekly_artist_stats') {
      const { artist_email, artist_name } = body

      // Get all releases for this artist
      const { data: releases } = await (supabase as any)
        .from('releases')
        .select('id, catalogue_number, title, status, heat_status, artwork_url')
        .eq('artist_name', artist_name)
        .in('status', ['live', 'scheduled'])
        .order('release_date', { ascending: false })

      if (!releases || releases.length === 0) {
        return NextResponse.json({ error: 'No active releases for this artist' }, { status: 400 })
      }

      // Get stats for each release
      const releaseStats = []
      for (const rel of releases) {
        const [downloads, reviews, promoList] = await Promise.all([
          (supabase as any).from('download_events').select('*', { count: 'exact', head: true }).eq('release_id', rel.id),
          (supabase as any).from('reviews').select('rating, status, charted, chart_name, contacts(full_name)').eq('release_id', rel.id),
          (supabase as any).from('promo_lists').select('*', { count: 'exact', head: true }).eq('release_id', rel.id),
        ])

        const reviewData = reviews.data ?? []
        const avgRating = reviewData.length > 0
          ? (reviewData.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) / reviewData.length).toFixed(1)
          : '—'
        const charted = reviewData.filter((r: any) => r.charted)
        const approved = reviewData.filter((r: any) => r.status === 'approved')

        releaseStats.push({
          catalogue_number: rel.catalogue_number,
          title: rel.title,
          status: rel.status,
          heat_status: rel.heat_status,
          downloads: downloads.count ?? 0,
          promo_contacts: promoList.count ?? 0,
          total_reviews: reviewData.length,
          approved_reviews: approved.length,
          avg_rating: avgRating,
          chart_count: charted.length,
          charts: charted.map((r: any) => r.chart_name).filter(Boolean),
          top_reviews: approved.slice(0, 3).map((r: any) => ({
            name: r.contacts?.full_name ?? 'Unknown',
            rating: r.rating,
          })),
        })
      }

      // Build email HTML
      const totalDownloads = releaseStats.reduce((s, r) => s + r.downloads, 0)
      const totalReviews = releaseStats.reduce((s, r) => s + r.total_reviews, 0)
      const totalCharts = releaseStats.reduce((s, r) => s + r.chart_count, 0)

      const releaseRows = releaseStats.map(r => `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #eee;">
            <div style="font-weight: 600; color: #1a1a1a;">${r.catalogue_number}</div>
            <div style="font-size: 12px; color: #888; margin-top: 2px;">${r.title}</div>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #eee; text-align: center;">
            <div style="font-size: 18px; font-weight: 600; color: #1D9E75;">${r.downloads}</div>
            <div style="font-size: 10px; color: #888;">downloads</div>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #eee; text-align: center;">
            <div style="font-size: 18px; font-weight: 600; color: #f5c842;">${r.avg_rating}</div>
            <div style="font-size: 10px; color: #888;">${r.total_reviews} reviews</div>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #eee; text-align: center;">
            <div style="font-size: 18px; font-weight: 600; color: #7ab8f5;">${r.chart_count}</div>
            <div style="font-size: 10px; color: #888;">charts</div>
          </td>
        </tr>
      `).join('')

      const chartList = releaseStats.flatMap(r => r.charts.map(c => `${r.catalogue_number}: ${c}`))
      const chartSection = chartList.length > 0 ? `
        <div style="margin-top: 24px; padding: 16px 20px; background: #f0faf6; border-radius: 10px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #1D9E75; font-weight: 600; margin-bottom: 8px;">Charted in</div>
          ${chartList.map(c => `<div style="font-size: 13px; color: #333; padding: 3px 0;">${c}</div>`).join('')}
        </div>` : ''

      const html = `
<div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #fff;">
  <div style="text-align: center; margin-bottom: 28px;">
    <div style="font-weight: 900; font-size: 20px; letter-spacing: 0.12em; color: #FF6B35;">SHINE</div>
  </div>

  <div style="font-size: 20px; font-weight: 600; color: #1D9E75; text-align: center; margin-bottom: 4px;">
    Weekly Stats Report
  </div>
  <div style="font-size: 14px; text-align: center; color: #888; margin-bottom: 28px;">
    ${artist_name} · Week of ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
  </div>

  <!-- Summary cards -->
  <div style="display: flex; gap: 12px; margin-bottom: 28px;">
    <div style="flex: 1; background: #f8f8f8; border-radius: 10px; padding: 16px; text-align: center;">
      <div style="font-size: 28px; font-weight: 700; color: #1D9E75;">${totalDownloads}</div>
      <div style="font-size: 11px; color: #888; margin-top: 2px;">Total Downloads</div>
    </div>
    <div style="flex: 1; background: #f8f8f8; border-radius: 10px; padding: 16px; text-align: center;">
      <div style="font-size: 28px; font-weight: 700; color: #f5c842;">${totalReviews}</div>
      <div style="font-size: 11px; color: #888; margin-top: 2px;">Reviews</div>
    </div>
    <div style="flex: 1; background: #f8f8f8; border-radius: 10px; padding: 16px; text-align: center;">
      <div style="font-size: 28px; font-weight: 700; color: #7ab8f5;">${totalCharts}</div>
      <div style="font-size: 11px; color: #888; margin-top: 2px;">Chart Entries</div>
    </div>
  </div>

  <!-- Release table -->
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr>
        <th style="text-align: left; padding: 10px 16px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; border-bottom: 2px solid #1D9E75;">Release</th>
        <th style="text-align: center; padding: 10px 16px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; border-bottom: 2px solid #1D9E75;">DLs</th>
        <th style="text-align: center; padding: 10px 16px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; border-bottom: 2px solid #1D9E75;">Rating</th>
        <th style="text-align: center; padding: 10px 16px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; border-bottom: 2px solid #1D9E75;">Charts</th>
      </tr>
    </thead>
    <tbody>
      ${releaseRows}
    </tbody>
  </table>

  ${chartSection}

  <div style="margin-top: 28px; border-top: 1px solid #eee; padding-top: 16px; text-align: center;">
    <span style="font-size: 12px; color: #1D9E75; font-weight: 600;">Shine Frequency</span>
    <span style="font-size: 11px; color: #aaa;"> — London, UK</span>
  </div>
</div>`

      await sendEmail({
        to: artist_email,
        subject: `${artist_name} — Weekly Stats Report | Shine Frequency`,
        html,
      })

      return NextResponse.json({ success: true, stats: releaseStats })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
