import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const rateLimit = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }
  if (entry.count >= 5) return true
  entry.count++
  return false
}

// Public join route — creates a pending member (no auth required)
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 })
  }

  const supabase = await createClient()
  const body = await request.json()

  // Get the gym — in v1 there's only one gym in the DB
  const name = (body.full_name ?? '').toString().trim()
  if (!name || name.length > 100) {
    return NextResponse.json({ error: 'Full name is required (max 100 characters)' }, { status: 400 })
  }
  if (body.phone && body.phone.toString().length > 20) {
    return NextResponse.json({ error: 'Phone number too long (max 20 characters)' }, { status: 400 })
  }
  if (body.email && body.email.toString().length > 255) {
    return NextResponse.json({ error: 'Email too long (max 255 characters)' }, { status: 400 })
  }

  const { data: gym } = await supabase
    .from('gym')
    .select('id')
    .limit(1)
    .single()

  if (!gym) return NextResponse.json({ error: 'Gym not configured' }, { status: 500 })

  // No .select() here — anonymous users can INSERT but not SELECT member rows (RLS).
  // The join form only needs to know if the request succeeded.
  const { error } = await supabase
    .from('member')
    .insert({
      gym_id: gym.id,
      full_name: name,
      phone: body.phone || null,
      email: body.email || null,
      date_of_birth: body.date_of_birth || null,
      join_date: new Date().toISOString().split('T')[0],
      emergency_contact_name: body.emergency_contact_name || null,
      emergency_contact_phone: body.emergency_contact_phone || null,
      notes: null,
      status: 'pending',
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
