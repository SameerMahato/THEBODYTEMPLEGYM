import { NextRequest, NextResponse } from 'next/server'
import { getStaffContext } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [{ id }, ctx] = await Promise.all([params, getStaffContext()])
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // These two reads are independent — previously they ran back to back.
  const [memberResult, paymentsResult] = await Promise.all([
    ctx.supabase
      .from('member')
      .select(`*, member_subscription(*, membership_plan(*))`)
      .eq('id', id)
      .eq('gym_id', ctx.gymId)
      .single(),
    ctx.supabase
      .from('payment')
      .select(`*, staff_user(full_name)`)
      .eq('member_id', id)
      .eq('gym_id', ctx.gymId)
      .order('payment_date', { ascending: false }),
  ])

  if (memberResult.error) {
    return NextResponse.json({ error: memberResult.error.message }, { status: 404 })
  }
  if (paymentsResult.error) {
    return NextResponse.json({ error: paymentsResult.error.message }, { status: 500 })
  }

  return NextResponse.json({ ...memberResult.data, payments: paymentsResult.data })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [{ id }, ctx, body] = await Promise.all([params, getStaffContext(), request.json()])
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const allowed = [
    'full_name', 'phone', 'email', 'date_of_birth',
    'emergency_contact_name', 'emergency_contact_phone', 'notes', 'status',
  ]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await ctx.supabase
    .from('member')
    .update(updates)
    .eq('id', id)
    .eq('gym_id', ctx.gymId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
