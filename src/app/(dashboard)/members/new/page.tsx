'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label htmlFor={htmlFor} style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
      }}>{label}</label>
      {children}
    </div>
  )
}

export default function NewMemberPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    join_date: new Date().toISOString().split('T')[0],
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
  })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/members/${data.id}`)
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to create member')
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="ADD MEMBER" subtitle="Create a new gym member record" />

      <div style={{ padding: '28px 32px', maxWidth: '640px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-grid-2">
            <Field label="Full Name *" htmlFor="m-full-name">
              <input id="m-full-name" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Rahul Sharma" required />
            </Field>
            <Field label="Phone" htmlFor="m-phone">
              <input id="m-phone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" type="tel" />
            </Field>
          </div>

          <div className="form-grid-2">
            <Field label="Email" htmlFor="m-email">
              <input id="m-email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="rahul@example.com" type="email" />
            </Field>
            <Field label="Date of Birth" htmlFor="m-dob">
              <input id="m-dob" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} type="date" />
            </Field>
          </div>

          <Field label="Join Date" htmlFor="m-join-date">
            <input id="m-join-date" value={form.join_date} onChange={e => set('join_date', e.target.value)} type="date" required style={{ maxWidth: '200px' }} />
          </Field>

          <div className="form-grid-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <Field label="Emergency Contact Name" htmlFor="m-ec-name">
              <input id="m-ec-name" value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} placeholder="Name" />
            </Field>
            <Field label="Emergency Contact Phone" htmlFor="m-ec-phone">
              <input id="m-ec-phone" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} placeholder="+91 98765 43210" type="tel" />
            </Field>
          </div>

          <Field label="Notes" htmlFor="m-notes">
            <textarea
              id="m-notes"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Any notes for staff..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </Field>

          {error && (
            <div style={{
              background: 'var(--danger-alt-a10)',
              border: '1px solid var(--danger)',
              borderRadius: '4px',
              padding: '10px 14px',
              color: 'var(--danger)',
              fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button type="submit" loading={loading}>Save Member</Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
