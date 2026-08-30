import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getStaff(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: staff } = await supabase
    .from('staff_user')
    .select('gym_id')
    .eq('id', user.id)
    .single()
  return staff ? { user, staff } : null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const auth = await getStaff(supabase)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member, error } = await supabase
    .from('member')
    .select(`
      *,
      member_subscription(
        *, membership_plan(*)
      )
    `)
    .eq('id', id)
    .eq('gym_id', auth.staff.gym_id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  const { data: payments, error: pe } = await supabase
    .from('payment')
    .select(`*, staff_user(full_name)`)
    .eq('member_id', id)
    .eq('gym_id', auth.staff.gym_id)
    .order('payment_date', { ascending: false })

  if (pe) return NextResponse.json({ error: pe.message }, { status: 500 })

  return NextResponse.json({ ...member, payments })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  const auth = await getStaff(supabase)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const allowed = [
    'full_name', 'phone', 'email', 'date_of_birth',
    'emergency_contact_name', 'emergency_contact_phone', 'notes', 'status',
  ]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from('member')
    .update(updates)
    .eq('id', id)
    .eq('gym_id', auth.staff.gym_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
