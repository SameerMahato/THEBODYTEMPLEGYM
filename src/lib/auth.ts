import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export type StaffContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  gymId: string
}

// cache() dedupes across every caller in a single server request, so the
// auth round trip and staff_user lookup happen once per request instead of
// once per route handler / component that needs them.
export const getStaffContext = cache(async (): Promise<StaffContext | null> => {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: staff } = await supabase
    .from('staff_user')
    .select('gym_id')
    .eq('id', user.id)
    .single()
  if (!staff) return null

  return { supabase, userId: user.id, gymId: staff.gym_id }
})
