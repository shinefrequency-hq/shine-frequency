import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createFolder, createSharedLink, listFolder, refreshAccessToken } from '@/lib/dropbox'

function getServiceClient() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getAccessToken(supabase: any, userId: string) {
  // Use service role to bypass RLS for reading tokens
  const service = getServiceClient()
  // Try by auth_user_id first, fallback to first staff with a token
  let { data: staff } = await service
    .from('staff')
    .select('id, dropbox_access_token, dropbox_refresh_token')
    .eq('auth_user_id', userId)
    .single()

  // Fallback: get any staff with dropbox tokens (single-user setup)
  if (!staff?.dropbox_access_token) {
    const { data: anyStaff } = await service
      .from('staff')
      .select('id, dropbox_access_token, dropbox_refresh_token')
      .not('dropbox_access_token', 'is', null)
      .limit(1)
      .single()
    if (anyStaff?.dropbox_access_token) staff = anyStaff
  }

  if (!staff?.dropbox_access_token) {
    return { token: null, staffId: staff?.id }
  }

  // Try using existing token first, refresh if needed
  return { token: staff.dropbox_access_token, refreshToken: staff.dropbox_refresh_token, staffId: staff.id }
}

async function ensureValidToken(supabase: any, staff: any) {
  // Test if token works
  const testRes = await fetch('https://api.dropboxapi.com/2/check/user', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${staff.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: 'test' }),
  })

  if (testRes.ok) return staff.token

  // Token expired, refresh it
  if (staff.refreshToken) {
    const refreshed = await refreshAccessToken(staff.refreshToken)
    if (refreshed.access_token) {
      await getServiceClient()
        .from('staff')
        .update({ dropbox_access_token: refreshed.access_token })
        .eq('id', staff.staffId)
      return refreshed.access_token
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action, path, catalogue_number, artist_name } = body

  const staffData = await getAccessToken(supabase as any, user.id)
  if (!staffData.token) {
    return NextResponse.json({ error: 'Dropbox not connected. Go to Settings to connect.' }, { status: 400 })
  }

  const token = await ensureValidToken(supabase as any, staffData)
  if (!token) {
    return NextResponse.json({ error: 'Dropbox token expired. Reconnect in Settings.' }, { status: 401 })
  }

  try {
    if (action === 'create_release_folder') {
      const folderName = `${catalogue_number} - ${artist_name}`
      const folderPath = `/Shine Frequency/${folderName}`

      // Create main folder
      const folder = await createFolder(token, folderPath)

      // Create subfolders
      await Promise.all([
        createFolder(token, `${folderPath}/Masters`),
        createFolder(token, `${folderPath}/Artwork`),
        createFolder(token, `${folderPath}/Stems`),
        createFolder(token, `${folderPath}/Press Assets`),
      ])

      // Create shared link
      const link = await createSharedLink(token, folderPath)
      const shareUrl = link.url || link?.links?.[0]?.url || ''

      return NextResponse.json({
        success: true,
        folder_path: folderPath,
        share_url: shareUrl,
        folder_id: folder?.metadata?.id || '',
      })
    }

    if (action === 'list_folder') {
      const result = await listFolder(token, path || '')
      return NextResponse.json({ success: true, entries: result.entries || [] })
    }

    if (action === 'get_share_link') {
      const link = await createSharedLink(token, path)
      return NextResponse.json({ success: true, url: link.url || link?.links?.[0]?.url || '' })
    }

    if (action === 'check_connection') {
      const testRes = await fetch('https://api.dropboxapi.com/2/check/user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: 'shine' }),
      })
      const testData = await testRes.json()
      return NextResponse.json({ connected: testRes.ok, result: testData })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
