import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken } from '@/lib/dropbox'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=no_code', req.url))
  }

  const origin = req.nextUrl.origin
  const redirectUri = `${origin}/auth/dropbox/callback`

  const tokenData = await exchangeCodeForToken(code, redirectUri)

  if (tokenData.error) {
    console.error('Dropbox token exchange error:', tokenData)
    return NextResponse.redirect(new URL(`/dashboard/settings?error=${tokenData.error}`, req.url))
  }

  // Use service role to store tokens — update all staff (single-user setup)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: updateErr } = await supabase
    .from('staff')
    .update({
      dropbox_access_token: tokenData.access_token,
      dropbox_refresh_token: tokenData.refresh_token,
    })
    .eq('email', 'shineprdev@gmail.com')

  if (updateErr) {
    console.error('Failed to store Dropbox tokens:', updateErr)
    return NextResponse.redirect(new URL('/dashboard/settings?error=token_store_failed', req.url))
  }

  return NextResponse.redirect(new URL('/dashboard/settings?dropbox=connected', req.url))
}
