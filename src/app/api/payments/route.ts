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
  if (!body.member_id) {
    return NextResponse.json({ error: 'member_id is required' }, { status: 400 })
  }

  const isAdjustment = body.type === 'adjustment'

  if (isAdjustment) {
    if (!body.related_payment_id || !body.reason?.trim()) {
      return NextResponse.json(
        { error: 'Adjustments require related_payment_id and reason' },
        { status: 400 }
      )
    }
    // Verify original payment belongs to this gym
    const { data: original } = await supabase
      .from('payment')
      .select('id, gym_id')
      .eq('id', body.related_payment_id)
      .single()
    if (!original || original.gym_id !== staff.gym_id) {
      return NextResponse.json({ error: 'Original payment not found' }, { status: 404 })
    }

    // Insert adjustment — no subscription interaction needed
    const { data: payment, error: pe } = await supabase
      .from('payment')
      .insert({
        gym_id: staff.gym_id,
        member_id: body.member_id,
        recorded_by: user.id,
        type: 'adjustment',
        amount,
        payment_date: body.payment_date,
        payment_method: body.payment_method,
        notes: body.notes || null,
        related_payment_id: body.related_payment_id,
        reason: body.reason,
      })
      .select()
      .single()

    if (pe) return NextResponse.json({ error: pe.message }, { status: 500 })
    return NextResponse.json(payment, { status: 201 })
  }

  // Regular payment — use RPC if plan_id provided (atomic + bypasses no_payment_update)
  if (body.plan_id) {
    const { data, error } = await supabase.rpc('create_payment_with_plan', {
      p_gym_id:         staff.gym_id,
      p_member_id:      body.member_id,
      p_recorded_by:    user.id,
      p_amount:         amount,
      p_payment_date:   body.payment_date,
      p_payment_method: body.payment_method,
      p_period_start:   body.period_start || null,
      p_notes:          body.notes || null,
      p_plan_id:        body.plan_id,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  }

  // Payment without a plan (e.g. one-off fee) — C-4: validate member belongs to gym
  const { data: memberCheck } = await supabase
    .from('member')
    .select('id')
    .eq('id', body.member_id)
    .eq('gym_id', staff.gym_id)
    .single()
  if (!memberCheck) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const { data: payment, error: pe } = await supabase
    .from('payment')
    .insert({
      gym_id: staff.gym_id,
      member_id: body.member_id,
      recorded_by: user.id,
      type: 'payment',
      amount,
      payment_date: body.payment_date,
      payment_method: body.payment_method,
      period_start: body.period_start || null,
      period_end: body.period_end || null,
      notes: body.notes || null,
    })
    .select()
    .single()

  if (pe) return NextResponse.json({ error: pe.message }, { status: 500 })
  return NextResponse.json(payment, { status: 201 })
}
