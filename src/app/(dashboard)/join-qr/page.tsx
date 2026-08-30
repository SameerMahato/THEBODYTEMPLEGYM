'use client'

import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import PageHeader from '@/components/ui/PageHeader'

export default function JoinQRPage() {
  const [joinUrl, setJoinUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    setJoinUrl(`${base}/join`)
  }, [])

  async function copyLink() {
    if (!joinUrl) return
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

          {/* QR Card */}
          <div className="print-card" style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '40px',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#080808',
              textAlign: 'center',
            }}>
              BODY TEMPLE GYM
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#E11D48',
              marginTop: '-12px',
              textAlign: 'center',
            }}>
              SCAN TO JOIN
            </div>

            {joinUrl ? (
              <QRCode value={joinUrl} size={220} />
            ) : (
              <div style={{ width: 220, height: 220, background: '#f0f0f0', borderRadius: '8px' }} />
            )}

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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '12px 24px',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Print QR Card
              </button>

              <button
                onClick={copyLink}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: copied ? '#25D366' : 'var(--text-secondary)',
                  border: `1px solid ${copied ? '#25D366' : 'var(--border-strong)'}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copy Join Link
                  </>
                )}
              </button>

              <a
                href={joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Open Join Page
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
