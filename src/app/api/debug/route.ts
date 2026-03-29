import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const checks: Record<string, any> = {}

  // Check env vars exist (don't expose values)
  checks.DROPBOX_APP_KEY = !!process.env.DROPBOX_APP_KEY
  checks.DROPBOX_APP_SECRET = !!process.env.DROPBOX_APP_SECRET
  checks.SUPABASE_SERVICE_ROLE_KEY = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  checks.NEXT_PUBLIC_SUPABASE_URL = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  checks.SMTP_PASS = !!process.env.SMTP_PASS

  // Check staff dropbox token
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await sb.from('staff').select('email, dropbox_access_token, dropbox_refresh_token').limit(1).single()
    checks.staff_email = data?.email
    checks.has_dropbox_token = !!data?.dropbox_access_token
    checks.has_refresh_token = !!data?.dropbox_refresh_token
  } catch (e: any) {
    checks.staff_error = e.message
  }

  return NextResponse.json(checks)
}
