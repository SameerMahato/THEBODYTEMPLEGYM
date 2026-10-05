/**
 * Resolves the public base URL of this deployment.
 *
 * Server-only. VERCEL_PROJECT_PRODUCTION_URL is not a NEXT_PUBLIC_ variable,
 * so it is readable in Server Components but never inlined into the browser
 * bundle. Nothing here is secret; it simply has no reason to ship to a client.
 *
 * Two entry points, because the two callers render differently:
 *
 *   staticAppUrl()   for prerendered pages. Reads configuration only, since
 *                    touching headers() would opt the page out of static
 *                    rendering — which is exactly what /join must not do.
 *   requestAppUrl()  for dynamically rendered pages, which can additionally
 *                    fall back to the host that served the request.
 *
 * This exists because /join silently shipped without its QR code in
 * production: it is ISR, so it cannot read headers the way /join-qr does,
 * and NEXT_PUBLIC_APP_URL was unset in Vercel. Deriving the URL from
 * Vercel's own system variable makes the common case self-configuring.
 */

import { headers } from 'next/headers'

function normalise(url: string): string {
  return url.replace(/\/+$/, '')
}

/**
 * Configuration-only resolution, safe inside a prerendered page.
 *
 * Returns null when nothing is configured — callers must handle that rather
 * than emit a broken URL, since a QR code pointing at the wrong host is
 * worse than no QR code at all.
 */
export function staticAppUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_APP_URL
  if (explicit) return normalise(explicit)

  // Supplied automatically by Vercel. Deliberately the *production* domain
  // rather than VERCEL_URL, which on a preview deployment is an ephemeral
  // hostname: a QR code printed for the front desk must outlive the
  // deployment that generated it.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${normalise(vercel)}`

  return null
}

/** Adds a request-host fallback. Only for dynamically rendered pages. */
export async function requestAppUrl(): Promise<string> {
  const configured = staticAppUrl()
  if (configured) return configured

  const h = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}
