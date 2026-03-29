import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken } from '@/lib/dropbox'
import { createClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state') // contains user context if needed

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=no_code', req.url))
  }

  const origin = req.nextUrl.origin
  const redirectUri = `${origin}/auth/dropbox/callback`

  const tokenData = await exchangeCodeForToken(code, redirectUri)

  if (tokenData.error) {
    return NextResponse.redirect(new URL(`/dashboard/settings?error=${tokenData.error}`, req.url))
  }

  // Store tokens in staff record
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await (supabase as any).from('staff').update({
      dropbox_access_token: tokenData.access_token,
      dropbox_refresh_token: tokenData.refresh_token,
    }).eq('auth_user_id', user.id)
  }

  return NextResponse.redirect(new URL('/dashboard/settings?dropbox=connected', req.url))
}
