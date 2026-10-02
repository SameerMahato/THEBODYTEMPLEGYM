'use client'

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
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
        {error.message || 'This page could not be loaded.'}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '10px 20px',
          background: 'var(--accent)',
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
