import { NextRequest, NextResponse } from 'next/server'
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

  const { data, error } = await supabase
    .from('membership_plan')
    .select('*')
    .eq('gym_id', staff.gym_id)
    .eq('is_active', true)
    .order('price', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // H-4: Server-side validation
  const name = (body.name ?? '').toString().trim()
  if (!name) return NextResponse.json({ error: 'Plan name is required' }, { status: 400 })
  if (name.length > 100) return NextResponse.json({ error: 'Plan name too long (max 100 chars)' }, { status: 400 })

  const price = Number(body.price)
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: 'Price must be a non-negative number' }, { status: 400 })
  }

  const duration = Number(body.duration_days)
  if (!Number.isInteger(duration) || duration < 1) {
    return NextResponse.json({ error: 'Duration must be a positive integer (days)' }, { status: 400 })
  }

  const { data: staff } = await supabase
    .from('staff_user')
    .select('gym_id')
    .eq('id', user.id)
    .single()

  if (!staff) return NextResponse.json({ error: 'Staff record not found' }, { status: 403 })

  const { data, error } = await supabase
    .from('membership_plan')
    .insert({
      gym_id: staff.gym_id,
      name,
      price,
      duration_days: duration,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
