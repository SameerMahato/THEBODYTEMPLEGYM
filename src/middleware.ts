import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // Middleware exists to redirect page navigations and to refresh the session
  // cookie. Route handlers authenticate themselves, so running it on /api would
  // mean a second auth round trip per request for no added protection.
  // Static assets, metadata files and the public /join page never need a user.
  matcher: [
    '/',
    '/dashboard/:path*',
    '/members/:path*',
    '/plans/:path*',
    '/payments/:path*',
    '/pending-signups/:path*',
    '/join-qr/:path*',
    '/login',
  ],
}
