import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Build a response we can attach refreshed cookies to
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verify session (also refreshes the session if needed)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Redirect unauthenticated users to the appropriate login page
    const loginPath = pathname.startsWith('/client') ? '/client/login' : '/login'
    return NextResponse.redirect(new URL(loginPath, request.url))
  }

  // Role-based route enforcement
  const role = request.cookies.get('user-role')?.value ?? 'convoyeur'

  const isAdminRoute = pathname.startsWith('/admin')
  const isClientRoute =
    pathname.startsWith('/client/dashboard') ||
    pathname.startsWith('/client/missions') ||
    pathname.startsWith('/client/billing') ||
    pathname.startsWith('/client/settings') ||
    pathname.startsWith('/client/missions/new')
  const isConvoyeurRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/missions')

  if (isAdminRoute && role !== 'admin') {
    const dest = role === 'client' ? '/client/dashboard' : '/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  if (isClientRoute && role !== 'client') {
    const dest = role === 'admin' ? '/admin' : '/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Admins can access convoyeur routes (e.g. /missions/new)
  if (isConvoyeurRoute && role === 'client') {
    return NextResponse.redirect(new URL('/client/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/missions/:path*',
    '/admin/:path*',
    '/client/dashboard/:path*',
    '/client/missions/:path*',
    '/client/billing/:path*',
    '/client/settings/:path*',
  ],
}
