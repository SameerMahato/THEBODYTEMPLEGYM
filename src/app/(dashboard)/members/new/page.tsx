'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Full Name *">
              <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Rahul Sharma" required />
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" type="tel" />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Email">
              <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="rahul@example.com" type="email" />
            </Field>
            <Field label="Date of Birth">
              <input value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} type="date" />
            </Field>
          </div>

          <Field label="Join Date">
            <input value={form.join_date} onChange={e => set('join_date', e.target.value)} type="date" required style={{ maxWidth: '200px' }} />
          </Field>

          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '20px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}>
            <Field label="Emergency Contact Name">
              <input value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} placeholder="Name" />
            </Field>
            <Field label="Emergency Contact Phone">
              <input value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} placeholder="+91 98765 43210" type="tel" />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Any notes for staff..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </Field>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
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
