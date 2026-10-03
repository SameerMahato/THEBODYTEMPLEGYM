import QRCode from 'react-qr-code'
import JoinForm from '@/components/join/JoinForm'
import { gymToday } from '@/lib/utils'
import { appConfig } from '@/config/app'

// Public, anonymous, identical for every visitor — serve it from the CDN and
// regenerate hourly so the date-of-birth bound stays current.
export const revalidate = 3600

export const metadata = {
  title: `Join — ${appConfig.brand.name}`,
  description: `Register as a new member at ${appConfig.brand.name}.`,
}

export default function JoinPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const joinUrl = appUrl ? `${appUrl}/join` : null

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: 800,
            color: 'var(--text-primary)', letterSpacing: '0.02em', lineHeight: 1,
          }}>{appConfig.brand.displayPrimary}</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600,
            letterSpacing: '0.3em', color: 'var(--accent)', marginTop: '4px', marginBottom: '12px',
          }}>{appConfig.brand.displaySecondary}</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600,
            color: 'var(--text-secondary)', letterSpacing: '0.05em',
          }}>JOIN — FILL OUT YOUR DETAILS</div>
        </div>

        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: '6px', padding: '28px',
        }}>
          <JoinForm maxDob={gymToday()} />
        </div>

        {/* QR code for the front desk — rendered to SVG on the server, so the
            QR library is never shipped to the phone scanning it. */}
        {joinUrl && (
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Print this QR code for the front desk
            </div>
            <div style={{
              display: 'inline-block',
              background: '#fff',
              padding: '20px',
              borderRadius: '6px',
            }}>
              <QRCode value={joinUrl} size={160} />
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#333', fontFamily: 'monospace' }}>{joinUrl}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
