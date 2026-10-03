import { NextRequest, NextResponse } from 'next/server'
import { getStaffContext } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getStaffContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { supabase, gymId } = ctx

  const { data, error } = await supabase
    .from('membership_plan')
    .select('*')
    .eq('id', id)
    .eq('gym_id', gymId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [ctx, body] = await Promise.all([getStaffContext(), request.json()])
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { supabase, gymId } = ctx

  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.price !== undefined) updates.price = body.price
  if (body.duration_days !== undefined) updates.duration_days = body.duration_days
  if (body.is_active !== undefined) updates.is_active = body.is_active

  const { data, error } = await supabase
    .from('membership_plan')
    .update(updates)
    .eq('id', id)
    .eq('gym_id', gymId)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'Plan not found.' }, { status: 404 })
  return NextResponse.json(data)
}
