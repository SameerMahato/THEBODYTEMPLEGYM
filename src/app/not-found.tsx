import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-hero)', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
        404
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
        PAGE NOT FOUND
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '320px' }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/dashboard" style={{
        marginTop: '8px',
        padding: '10px 24px',
        background: 'var(--accent)',
        color: '#fff',
        borderRadius: 'var(--radius-sm)',
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: '13.5px',
        fontFamily: 'var(--font-body)',
      }}>
        Back to Dashboard
      </Link>
    </div>
  )
}
