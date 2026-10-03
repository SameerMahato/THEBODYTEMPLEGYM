'use client'

import { useState } from 'react'

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label htmlFor={htmlFor} style={{
        fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--text-secondary)',
      }}>{label}</label>
      {children}
    </div>
  )
}

// 16px prevents iOS Safari from zooming the viewport on focus, which also
// breaks the native date picker.
const mobileInput = { fontSize: '16px', touchAction: 'manipulation' } as const

export default function JoinForm({ maxDob }: { maxDob: string }) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
  })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSubmitted(true)
        return
      }
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Something went wrong. Please try again.')
    } catch {
      setError('Network error — please try again.')
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'var(--accent-a15)', border: '2px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: '28px',
        }}>✓</div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800,
          color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '0.02em',
        }}>
          YOU&apos;RE REGISTERED
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>
          Thanks! Please see the front desk to complete your membership.
          <br />Our team will assign your plan and get you started.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <Field label="Full Name *" htmlFor="j-full-name">
        <input id="j-full-name" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Your full name" required style={mobileInput} />
      </Field>

      <div className="form-grid-2">
        <Field label="Phone" htmlFor="j-phone">
          <input id="j-phone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" type="tel" style={mobileInput} />
        </Field>
        <Field label="Date of Birth" htmlFor="j-dob">
          <input
            id="j-dob"
            value={form.date_of_birth}
            onChange={e => set('date_of_birth', e.target.value)}
            type="date"
            min="1920-01-01"
            max={maxDob}
            style={mobileInput}
          />
        </Field>
      </div>

      <Field label="Email" htmlFor="j-email">
        <input id="j-email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" type="email" style={mobileInput} />
      </Field>

      {error && (
        <div style={{ background: 'var(--danger-alt-a10)', border: '1px solid var(--danger)', borderRadius: '4px', padding: '10px 14px', color: 'var(--danger)', fontSize: '13px' }}>
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
  )
}
