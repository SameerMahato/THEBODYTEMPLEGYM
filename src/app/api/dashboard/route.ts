import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: staff } = await supabase
    .from('staff_user')
    .select('gym_id')
    .eq('id', user.id)
    .single()

  if (!staff) return NextResponse.json({ error: 'Staff record not found' }, { status: 403 })

  const gymId = staff.gym_id
  const today = new Date().toISOString().split('T')[0]
  const in7Days = new Date()
  in7Days.setDate(in7Days.getDate() + 7)
  const in7DaysStr = in7Days.toISOString().split('T')[0]

  const monthStart = new Date()
  monthStart.setDate(1)
  const monthStartStr = monthStart.toISOString().split('T')[0]

  // Run all queries in parallel
  const [
    activeCount,
    revenueResult,
    expiringSoon,
    overdue,
    pendingSignups,
  ] = await Promise.all([
    // Total active members
    supabase
      .from('member')
      .select('id', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .eq('status', 'active'),

    // Revenue this month (payments only, net of adjustments)
    supabase
      .from('payment')
      .select('amount')
      .eq('gym_id', gymId)
      .gte('payment_date', monthStartStr),

    // Expiring in next 7 days — query from member_subscription so filters apply correctly
    supabase
      .from('member_subscription')
      .select(`
        id, plan_id, start_date, end_date, is_current,
        membership_plan(name, price),
        member!inner(id, gym_id, full_name, phone, email, status)
      `)
      .eq('gym_id', gymId)
      .eq('is_current', true)
      .gte('end_date', today)
      .lte('end_date', in7DaysStr)
      .eq('member.status', 'active')
      .order('end_date', { ascending: true }),

    // Overdue — current subscription expired
    supabase
      .from('member_subscription')
      .select(`
        id, plan_id, start_date, end_date, is_current,
        membership_plan(name, price),
        member!inner(id, gym_id, full_name, phone, email, status)
      `)
      .eq('gym_id', gymId)
      .eq('is_current', true)
      .lt('end_date', today)
      .eq('member.status', 'active')
      .order('end_date', { ascending: true }),

    // Pending signups
    supabase
      .from('member')
      .select('*')
      .eq('gym_id', gymId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

  // Net revenue (sum of all payment amounts, adjustments have negative amounts)
  const revenue = revenueResult.data?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0

  return NextResponse.json({
    total_active: activeCount.count ?? 0,
    revenue_this_month: revenue,
    expiring_soon: expiringSoon.data ?? [],
    overdue: overdue.data ?? [],
    pending_signups: pendingSignups.data ?? [],
  })
}
