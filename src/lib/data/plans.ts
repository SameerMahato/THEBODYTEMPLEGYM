import { getStaffContext } from '@/lib/auth'
import { MembershipPlan } from '@/types'

export async function getPlans(): Promise<MembershipPlan[] | null> {
  const ctx = await getStaffContext()
  if (!ctx) return null

  const { data, error } = await ctx.supabase
    .from('membership_plan')
    .select('id, gym_id, name, price, duration_days, is_active, created_at')
    .eq('gym_id', ctx.gymId)
    .eq('is_active', true)
    .order('price', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}
