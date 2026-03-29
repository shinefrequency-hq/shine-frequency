const DROPBOX_APP_KEY = process.env.DROPBOX_APP_KEY || process.env.NEXT_PUBLIC_DROPBOX_APP_KEY || ''
const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET || ''

export function getDropboxAuthURL(redirectUri: string, state: string) {
  const params = new URLSearchParams({
    client_id: DROPBOX_APP_KEY,
    redirect_uri: redirectUri,
    response_type: 'code',
    token_access_type: 'offline',
    state,
  })
  return `https://www.dropbox.com/oauth2/authorize?${params}`
}

export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: DROPBOX_APP_KEY,
      client_secret: DROPBOX_APP_SECRET,
      redirect_uri: redirectUri,
    }),
  })
  return res.json()
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: DROPBOX_APP_KEY,
      client_secret: DROPBOX_APP_SECRET,
    }),
  })
  return res.json()
}

export async function createFolder(accessToken: string, path: string) {
  const res = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path, autorename: false }),
  })
  return res.json()
}

export async function listFolder(accessToken: string, path: string) {
  const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path, recursive: false }),
  })
  return res.json()
}

export async function createSharedLink(accessToken: string, path: string) {
  const res = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path,
      settings: { requested_visibility: 'public', audience: 'public' },
    }),
  })
  const data = await res.json()
  // If link already exists, fetch it
  if (data?.error?.['.tag'] === 'shared_link_already_exists') {
    const listRes = await fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path, direct_only: true }),
    })
    const listData = await listRes.json()
    return listData.links?.[0] ?? data
  }
  return data
}

export async function getUploadSessionURL() {
  // For client-side uploads, we use the content upload endpoint
  return 'https://content.dropboxapi.com/2/files/upload'
}
