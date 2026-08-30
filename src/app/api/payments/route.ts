import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: staff } = await supabase
    .from('staff_user')
    .select('gym_id')
    .eq('id', user.id)
    .single()

  if (!staff) return NextResponse.json({ error: 'Staff record not found' }, { status: 403 })

  const amount = Number(body.amount)
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: 'Amount must be a valid number' }, { status: 400 })
  }
  if (!body.payment_date || typeof body.payment_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.payment_date)) {
    return NextResponse.json({ error: 'Invalid payment date' }, { status: 400 })
  }

  const isAdjustment = body.type === 'adjustment'

  if (isAdjustment) {
    if (!body.related_payment_id || !body.reason?.trim()) {
      return NextResponse.json(
        { error: 'Adjustments require related_payment_id and reason' },
        { status: 400 }
      )
    }
    // Verify the original payment belongs to this gym
    const { data: original } = await supabase
      .from('payment')
      .select('id, gym_id')
      .eq('id', body.related_payment_id)
      .single()
    if (!original || original.gym_id !== staff.gym_id) {
      return NextResponse.json({ error: 'Original payment not found' }, { status: 404 })
    }
  }

  // Create the payment record (insert-only, no updates/deletes per audit trail policy)
  const { data: payment, error: pe } = await supabase
    .from('payment')
    .insert({
      gym_id: staff.gym_id,
      member_id: body.member_id,
      subscription_id: body.subscription_id || null,
      recorded_by: user.id,
      type: body.type || 'payment',
      amount,
      payment_date: body.payment_date,
      payment_method: body.payment_method,
      period_start: body.period_start || null,
      period_end: body.period_end || null,
      notes: body.notes || null,
      related_payment_id: body.related_payment_id || null,
      reason: body.reason || null,
    })
    .select()
    .single()

  if (pe) return NextResponse.json({ error: pe.message }, { status: 500 })

  // If this is a regular payment (not an adjustment), assign/renew the plan subscription
  if (!isAdjustment && body.plan_id) {
    // Close any current subscription
    await supabase
      .from('member_subscription')
      .update({ is_current: false })
      .eq('member_id', body.member_id)
      .eq('is_current', true)

    const start = body.period_start || body.payment_date
    const { data: plan } = await supabase
      .from('membership_plan')
      .select('duration_days')
      .eq('id', body.plan_id)
      .single()

    const endDate = new Date(start)
    endDate.setDate(endDate.getDate() + (plan?.duration_days ?? 30))

    const { data: sub } = await supabase
      .from('member_subscription')
      .insert({
        gym_id: staff.gym_id,
        member_id: body.member_id,
        plan_id: body.plan_id,
        start_date: start,
        end_date: endDate.toISOString().split('T')[0],
        is_current: true,
      })
      .select()
      .single()

    // Update payment with subscription id
    if (sub) {
      await supabase
        .from('payment')
        .update({ subscription_id: sub.id })
        .eq('id', payment.id)
    }

    // Activate the member
    await supabase
      .from('member')
      .update({ status: 'active' })
      .eq('id', body.member_id)
  }

  return NextResponse.json(payment, { status: 201 })
}
