'use client'

/**
 * Server Component error boundary.
 *
 * Next.js replaces a server error's message with a generic string in
 * production and attaches a `digest` that correlates with the server log, so
 * the raw message is only surfaced in development.
 */
export default function DashboardError({ error, reset }: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div style={{ padding: '48px 32px', maxWidth: '640px' }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '28px',
        fontWeight: 800,
        color: 'var(--danger)',
        letterSpacing: '0.02em',
        marginBottom: '12px',
      }}>
        SOMETHING WENT WRONG
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '20px' }}>
        This page could not be loaded. Try again — if it keeps happening, quote
        the reference below.
      </p>

      {isDev && error.message && (
        <pre style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          marginBottom: '20px',
          color: 'var(--danger)',
          fontSize: '12px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>{error.message}</pre>
      )}

      {error.digest && (
        <p style={{
          color: 'var(--text-muted)', fontSize: '12px',
          marginBottom: '20px', fontFamily: 'monospace',
        }}>
          Reference: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          padding: '10px 20px',
          background: 'var(--accent-surface)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px',
          fontWeight: 600,
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  )
}
