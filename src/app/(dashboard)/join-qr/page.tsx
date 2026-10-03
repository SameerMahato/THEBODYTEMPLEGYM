import { headers } from 'next/headers'
import QRCode from 'react-qr-code'
import PageHeader from '@/components/ui/PageHeader'
import QRActions from '@/components/join/QRActions'
import { appConfig } from '@/config/app'

export default async function JoinQRPage() {
  let base = process.env.NEXT_PUBLIC_APP_URL
  if (!base) {
    const h = await headers()
    const host = h.get('host') ?? 'localhost:3000'
    const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
    base = `${proto}://${host}`
  }
  const joinUrl = `${base}/join`

  return (
    <div>
      <PageHeader
        title="JOIN QR CODE"
        subtitle="Display or print this for walk-in members to self-register"
      />

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-card {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div style={{ padding: '32px 36px' }}>
        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* QR Card — the SVG is generated on the server */}
          <div className="print-card" style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '40px',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--bg-base)',
              textAlign: 'center',
            }}>
              {`${appConfig.brand.displayPrimary} ${appConfig.brand.displaySecondary}`}
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginTop: '-12px',
              textAlign: 'center',
            }}>
              SCAN TO JOIN
            </div>

            <QRCode value={joinUrl} size={220} />

            <div style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              color: '#555',
              textAlign: 'center',
              wordBreak: 'break-all',
              maxWidth: '220px',
            }}>
              {joinUrl}
            </div>

            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              color: '#888',
              textAlign: 'center',
            }}>
              Fill in your details and see the front desk to complete registration
            </div>
          </div>

          {/* Actions panel */}
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '24px',
              maxWidth: '320px',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--text-secondary)',
                marginBottom: '16px',
              }}>
                HOW TO USE
              </div>
              <ol style={{ paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 2, margin: 0 }}>
                <li>Print the QR card and place it at the front desk</li>
                <li>New members scan it with their phone</li>
                <li>They fill in their details and submit</li>
                <li>You see them in <strong style={{ color: 'var(--text-primary)' }}>Pending Signups</strong></li>
                <li>Assign a plan and record payment to activate</li>
              </ol>
            </div>

            <QRActions joinUrl={joinUrl} />
          </div>
        </div>
      </div>
    </div>
  )
}
