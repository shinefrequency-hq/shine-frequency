import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { code, redirect_uri } = await req.json()

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  const appKey = process.env.DROPBOX_APP_KEY || ''
  const appSecret = process.env.DROPBOX_APP_SECRET || ''

  // Exchange code for token
  const tokenRes = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: appKey,
      client_secret: appSecret,
      redirect_uri: redirect_uri,
    }),
  })

  const tokenData = await tokenRes.json()

  if (tokenData.error) {
    return NextResponse.json({ error: tokenData.error_description || tokenData.error }, { status: 400 })
  }

  // Store tokens
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
    return NextResponse.json({ error: 'Failed to store token: ' + updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
