import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export type StaffContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  gymId: string
  /** Pending signups for the sidebar badge, resolved in the same round trip. */
  pendingCount: number
}

// cache() dedupes across every caller in a single server request, so the
// auth round trip and the gym lookup happen once per request instead of once
// per route handler / component that needs them.
export const getStaffContext = cache(async (): Promise<StaffContext | null> => {
  const supabase = await createClient()

  // getClaims() verifies the token's ES256 signature locally against the
  // project's JWKS, which auth-js caches globally per environment for 10
  // minutes. getUser() instead posts the token to the Auth server on every
  // request — a full round trip to the database region, measured at ~330ms.
  // If the project ever moves to a symmetric signing key, or WebCrypto is
  // unavailable, getClaims() falls back to getUser() on its own.
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return null

  // One call for gym_id and the pending count. These were two separate
  // round trips — a staff_user select here and a get_pending_count() in the
  // dashboard layout — and at ~330ms each on production that was ~330ms of
  // the ~1.3s every authenticated page spent before fetching its own data.
  const { data } = await supabase.rpc('get_staff_bootstrap')
  if (!data) return null

  const bootstrap = data as { gym_id: string; pending_count: number }

  return {
    supabase,
    userId,
    gymId: bootstrap.gym_id,
    pendingCount: Number(bootstrap.pending_count ?? 0),
  }
})
