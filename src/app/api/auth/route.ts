import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// H-1: In-memory rate limiter with periodic pruning.
// NOTE: This is per-instance; in serverless each cold start has a fresh map.
// For production rate limiting use Redis/Upstash or Vercel KV.
const rateLimit = new Map<string, { count: number; resetAt: number }>()
let lastPruneAt = Date.now()

function isRateLimited(ip: string): boolean {
  const now = Date.now()

  // Prune expired entries every 5 minutes to prevent unbounded growth
  if (now - lastPruneAt > 5 * 60_000) {
    for (const [key, entry] of rateLimit) {
      if (now > entry.resetAt) rateLimit.delete(key)
    }
    lastPruneAt = now
  }

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

  const name = (body.full_name ?? '').toString().trim()
  if (!name || name.length > 100) {
    return NextResponse.json({ error: 'Full name is required (max 100 characters)' }, { status: 400 })
  }
  if (body.phone && body.phone.toString().length > 20) {
    return NextResponse.json({ error: 'Phone number too long (max 20 characters)' }, { status: 400 })
  }

  // M-5: Email format validation
  if (body.email) {
    const email = body.email.toString()
    if (email.length > 255) {
      return NextResponse.json({ error: 'Email too long (max 255 characters)' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }
  }

  // M-5: Date of birth format validation
  if (body.date_of_birth) {
    const dob = body.date_of_birth.toString()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      return NextResponse.json({ error: 'Invalid date of birth format (expected YYYY-MM-DD)' }, { status: 400 })
    }
    const dobDate = new Date(dob)
    const now = new Date()
    if (isNaN(dobDate.getTime()) || dobDate > now) {
      return NextResponse.json({ error: 'Invalid date of birth' }, { status: 400 })
    }
  }

  const { data: gym } = await supabase
    .from('gym')
    .select('id')
    .limit(1)
    .single()

  if (!gym) return NextResponse.json({ error: 'Gym not configured' }, { status: 500 })

  // No .select() — anonymous users can INSERT but not SELECT member rows (RLS)
  const { error } = await supabase
    .from('member')
    .insert({
      gym_id: gym.id,
      full_name: name,
      phone: body.phone || null,
      email: body.email || null,
      date_of_birth: body.date_of_birth || null,
      join_date: new Date().toISOString().split('T')[0],
      notes: null,
      status: 'pending',
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
