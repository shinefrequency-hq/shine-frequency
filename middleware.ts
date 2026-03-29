import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Public routes that don't need authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/onboard',
  '/join',
  '/review',
  '/download',
  '/guide',
  '/portal',
  '/api/dropbox-connect',
  '/api/email',
  '/api/notifications',
  '/api/reports',
  '/api/heat',
  '/api/signout',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow all public routes
  const isPublic = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
  // Allow all static files and Next.js internals
  const isStatic = pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/logo') || pathname.startsWith('/artwork') || pathname.includes('.')

  if (isPublic || isStatic) {
    return NextResponse.next()
  }

  // For dashboard routes, check auth
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
