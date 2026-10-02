import { getStaffContext } from '@/lib/auth'
import { gymToday } from '@/lib/utils'
import { DashboardData } from '@/types'

export async function getDashboardData(): Promise<DashboardData | null> {
  const ctx = await getStaffContext()
  if (!ctx) return null

  const { data, error } = await ctx.supabase.rpc('get_dashboard_stats', {
    p_today: gymToday(),
  })

  // Only an unauthenticated caller returns null — a failed query must surface
  // as an error, not as a redirect back to the login page.
  if (error) throw new Error(`Dashboard query failed: ${error.message}`)

  return data as DashboardData
}
