import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Sign-in runs on the server so no Supabase client is shipped to the browser.
// The SSR client writes the session cookies on the response.
export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Logged in full; the browser only learns that the pair was wrong, never
    // whether the address exists.
    console.warn(`[LOGIN_FAILED] ${error.message}`)
    return NextResponse.json(
      { error: 'Incorrect email or password.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    )
  }

  return NextResponse.json({ ok: true })
}
