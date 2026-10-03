import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
    .eq('id', id)
    .eq('gym_id', staff.gym_id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.price !== undefined) updates.price = body.price
  if (body.duration_days !== undefined) updates.duration_days = body.duration_days
  if (body.is_active !== undefined) updates.is_active = body.is_active

  const { data, error } = await supabase
    .from('membership_plan')
    .update(updates)
    .eq('id', id)
    .eq('gym_id', staff.gym_id)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'Plan not found.' }, { status: 404 })
  return NextResponse.json(data)
}
