import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken } from '@/lib/dropbox'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=no_code', req.url))
  }

  const origin = req.nextUrl.origin
  const redirectUri = `${origin}/auth/dropbox/callback`

  const tokenData = await exchangeCodeForToken(code, redirectUri)

  if (tokenData.error) {
    return NextResponse.redirect(new URL(`/dashboard/settings?error=${tokenData.error}`, req.url))
  }

  // Get current user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Use service role to bypass RLS for token storage
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await serviceClient.from('staff').update({
      dropbox_access_token: tokenData.access_token,
      dropbox_refresh_token: tokenData.refresh_token,
    }).eq('auth_user_id', user.id)
  }

  return NextResponse.redirect(new URL('/dashboard/settings?dropbox=connected', req.url))
}
