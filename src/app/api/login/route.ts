import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Sign-in runs on the server so no Supabase client is shipped to the browser.
 * The SSR client writes the session cookies on the response.
 *
 * Two kinds of failure, deliberately distinguished:
 *
 *   credential  the pair is wrong, or there is no such account. One message
 *               for both, so the endpoint never confirms which addresses are
 *               registered.
 *   service     Supabase could not answer — a bad key, a schema error, the
 *               project paused, the network. Nothing to do with the password.
 *
 * Collapsing the second into the first is what this previously did, and it
 * cost hours during the region migration: a malformed auth row reported
 * "Database error querying schema" to the server while telling the operator
 * their password was wrong. The browser still learns nothing either way.
 */

/** Supabase codes that genuinely mean "those credentials are not valid". */
const CREDENTIAL_CODES = new Set([
  'invalid_credentials',
  'email_not_confirmed',
  'user_not_found',
  'invalid_grant',
])

export async function POST(request: NextRequest) {
  let email: unknown, password: unknown
  try {
    ({ email, password } = await request.json())
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 })
  }

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  let error
  try {
    ;({ error } = await (await createClient()).auth.signInWithPassword({ email, password }))
  } catch (e) {
    // createClient throws when the Supabase env vars are missing entirely,
    // and fetch throws when the project is unreachable.
    console.error(`[LOGIN_SERVICE_ERROR] ${(e as Error).message}`)
    return NextResponse.json(
      { error: 'Sign-in is unavailable right now. Please try again shortly.', code: 'SERVICE_UNAVAILABLE' },
      { status: 503 }
    )
  }

  if (!error) return NextResponse.json({ ok: true })

  // A 4xx with a known credential code is a real rejection. Anything else —
  // a 5xx, an unrecognised code, an auth service that is not answering — is
  // our problem, not the user's, and saying "wrong password" would be a lie.
  const code = (error as { code?: string }).code ?? ''
  const status = (error as { status?: number }).status ?? 0
  const isCredentialFailure = CREDENTIAL_CODES.has(code) || (status === 400 && !code)

  if (isCredentialFailure) {
    console.warn(`[LOGIN_FAILED] ${code || 'no-code'} — ${error.message}`)
    return NextResponse.json(
      { error: 'Incorrect email or password.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    )
  }

  console.error(
    `[LOGIN_SERVICE_ERROR] status=${status} code=${code || 'none'} — ${error.message}`
  )
  return NextResponse.json(
    { error: 'Sign-in is unavailable right now. Please try again shortly.', code: 'SERVICE_UNAVAILABLE' },
    { status: 503 }
  )
}
