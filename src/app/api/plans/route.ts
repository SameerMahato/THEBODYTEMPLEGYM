import { NextRequest, NextResponse } from 'next/server'
import { getStaffContext } from '@/lib/auth'
import { errorResponse, fromPostgrestError } from '@/lib/errors'
import { getPlans } from '@/lib/data/plans'

export async function GET() {
  const plans = await getPlans()
  if (!plans) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(plans)
}

export async function POST(request: NextRequest) {
  const ctx = await getStaffContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

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

  const { data, error } = await ctx.supabase
    .from('membership_plan')
    .insert({ gym_id: ctx.gymId, name, price, duration_days: duration })
    .select()
    .single()

  if (error) return errorResponse(fromPostgrestError(error, 'POST /api/plans'))
  return NextResponse.json(data, { status: 201 })
}
