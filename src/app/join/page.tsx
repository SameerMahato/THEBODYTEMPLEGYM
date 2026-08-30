'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import QRCode from 'react-qr-code'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{
        fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--text-secondary)',
      }}>{label}</label>
      {children}
    </div>
  )
}

export default function JoinPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  const joinUrl = `${appUrl}/join`

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      setSubmitted(true)
    } else {
      const data = await res.json()
      setError(data.error || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg-base)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(225,29,72,0.15)', border: '2px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: '28px',
          }}>✓</div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800,
            color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '0.02em',
          }}>
            YOU&apos;RE REGISTERED
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.7, marginBottom: '24px' }}>
            Thanks! Please see the front desk to complete your membership.
            <br />Our team will assign your plan and get you started.
          </p>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '16px',
            color: 'var(--text-secondary)', fontSize: '13px',
          }}>
            Body Temple Gym — {new Date().getFullYear()}
          </div>
        </div>
      </div>
    )
  }

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
          }}>BODY TEMPLE</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600,
            letterSpacing: '0.3em', color: 'var(--accent)', marginTop: '4px', marginBottom: '12px',
          }}>GYM</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600,
            color: 'var(--text-secondary)', letterSpacing: '0.05em',
          }}>JOIN — FILL OUT YOUR DETAILS</div>
        </div>

        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: '6px', padding: '28px',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <Field label="Full Name *">
              <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Your full name" required />
            </Field>

            <div className="form-grid-2">
              <Field label="Phone">
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" type="tel" />
              </Field>
              <Field label="Date of Birth">
                <input value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} type="date" />
              </Field>
            </div>

            <Field label="Email">
              <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" type="email" />
            </Field>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Emergency Contact
              </div>
              <div className="form-grid-2">
                <Field label="Name">
                  <input value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} placeholder="Name" />
                </Field>
                <Field label="Phone">
                  <input value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} placeholder="Phone" type="tel" />
                </Field>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '4px', padding: '10px 14px', color: 'var(--danger)', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? 'var(--accent-dim)' : 'var(--accent)',
                color: '#fff', border: 'none', borderRadius: '4px',
                padding: '13px', fontSize: '15px', fontWeight: 700,
                fontFamily: 'var(--font-display)', letterSpacing: '0.08em',
                cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px',
              }}
            >
              {loading ? 'SUBMITTING...' : 'SUBMIT & SEE FRONT DESK'}
            </button>
          </form>
        </div>

        {/* QR code (visible only in admin context — for printing) */}
        <details style={{ marginTop: '24px' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px', letterSpacing: '0.05em' }}>
            Print QR code for this page
          </summary>
          <div style={{
            marginTop: '16px', background: '#fff',
            padding: '20px', borderRadius: '6px', textAlign: 'center', display: 'inline-block',
          }}>
            <QRCode value={joinUrl} size={160} />
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#333', fontFamily: 'monospace' }}>{joinUrl}</div>
          </div>
        </details>
      </div>
    </div>
  )
}
