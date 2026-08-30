import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: staff } = await supabase
    .from('staff_user')
    .select('gym_id')
    .eq('id', user.id)
    .single()
  if (!staff) return NextResponse.json({ error: 'Staff record not found' }, { status: 403 })

  let query = supabase
    .from('member')
    .select(`
      *,
      member_subscription!left(
        id, plan_id, start_date, end_date, is_current,
        membership_plan(id, name, price, duration_days)
      )
    `)
    .eq('gym_id', staff.gym_id)
    .order('created_at', { ascending: false })
    .limit(500)

  if (status) query = query.eq('status', status)
  if (search) query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach only the current subscription to each member
  const members = data?.map(m => {
    const subs = m.member_subscription ?? []
    const current = subs.find((s: { is_current: boolean }) => s.is_current) ?? null
    return { ...m, current_subscription: current, member_subscription: undefined }
  })

  return NextResponse.json(members)
}

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

  const { data, error } = await supabase
    .from('member')
    .insert({
      gym_id: staff.gym_id,
      full_name: body.full_name,
      phone: body.phone || null,
      email: body.email || null,
      date_of_birth: body.date_of_birth || null,
      join_date: body.join_date || new Date().toISOString().split('T')[0],
      emergency_contact_name: body.emergency_contact_name || null,
      emergency_contact_phone: body.emergency_contact_phone || null,
      notes: body.notes || null,
      status: 'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
