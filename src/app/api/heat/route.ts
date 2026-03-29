import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type HeatStatus = 'critical' | 'hot' | 'warm' | 'building' | 'pending' | 'closed'

function calculateHeat(
  downloads: number,
  reviews: number,
  charts: number,
  promoWindowClosed: boolean
): HeatStatus {
  if (promoWindowClosed) return 'closed'
  if (charts >= 3 || (downloads >= 10 && reviews >= 5)) return 'critical'
  if (charts >= 1 || (downloads >= 5 && reviews >= 3)) return 'hot'
  if (downloads >= 3 || reviews >= 2) return 'warm'
  if (downloads >= 1 || reviews >= 1) return 'building'
  return 'pending'
}

export async function POST(req: NextRequest) {
  try {
    // Get all live/scheduled releases
    const { data: releases, error: relErr } = await supabase
      .from('releases')
      .select('id, promo_end_date')
      .in('status', ['live', 'scheduled'])

    if (relErr) throw relErr
    if (!releases || releases.length === 0) {
      return NextResponse.json({ updated: 0 })
    }

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    let updated = 0

    for (const release of releases) {
      // Count downloads in last 7 days
      const { count: downloads } = await supabase
        .from('download_events')
        .select('*', { count: 'exact', head: true })
        .eq('release_id', release.id)
        .gte('created_at', sevenDaysAgo)

      // Count reviews in last 7 days
      const { count: reviews } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('release_id', release.id)
        .gte('created_at', sevenDaysAgo)

      // Count chart entries (all time)
      const { count: charts } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('release_id', release.id)
        .eq('charted', true)

      // Check if promo window is closed
      const promoWindowClosed = release.promo_end_date
        ? new Date(release.promo_end_date) < now
        : false

      const heat_status = calculateHeat(
        downloads ?? 0,
        reviews ?? 0,
        charts ?? 0,
        promoWindowClosed
      )

      const { error: updateErr } = await supabase
        .from('releases')
        .update({ heat_status })
        .eq('id', release.id)

      if (!updateErr) updated++
    }

    return NextResponse.json({ updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
