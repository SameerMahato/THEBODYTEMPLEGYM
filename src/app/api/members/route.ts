import { NextRequest, NextResponse } from 'next/server'
import { getStaffContext } from '@/lib/auth'
import { getMembers } from '@/lib/data/members'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  try {
    const result = await getMembers({
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      page: Number(searchParams.get('page')) || 0,
    })
    if (!result) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const ctx = await getStaffContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  if (!body.full_name?.trim()) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
  }

  const { data, error } = await ctx.supabase
    .from('member')
    .insert({
      gym_id: ctx.gymId,
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
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
