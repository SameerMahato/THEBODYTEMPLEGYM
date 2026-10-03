import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // L-2: Pass options (httpOnly, secure, sameSite) on both the request and response cookies
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options })
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Local signature verification instead of a round trip to the Auth server.
  // getClaims() reads the session from the request cookies and, because this
  // project signs with ES256, verifies it against a JWKS that auth-js caches
  // globally for 10 minutes — so a warm function does no network work here.
  // It still calls getSession() internally, which refreshes an expired token
  // and writes the new cookies through setAll above, so session renewal is
  // unchanged. Pages and route handlers re-check authorization themselves.
  const { data: claimsData } = await supabase.auth.getClaims()
  const isAuthenticated = !!claimsData?.claims?.sub

  const isLogin = request.nextUrl.pathname === '/login'

  if (!isAuthenticated && !isLogin) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isAuthenticated && isLogin) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
