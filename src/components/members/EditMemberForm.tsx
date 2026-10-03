'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export interface EditableMember {
  full_name: string
  phone: string
  email: string
  date_of_birth: string
  emergency_contact_name: string
  emergency_contact_phone: string
  notes: string
}

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

export default function EditMemberForm({ id, initial }: { id: string; initial: EditableMember }) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(key: keyof EditableMember, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      router.push(`/members/${id}`)
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Failed to update member')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="form-grid-2">
        <Field label="Full Name *" htmlFor="em-full-name">
          <input id="em-full-name" value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
        </Field>
        <Field label="Phone" htmlFor="em-phone">
          <input id="em-phone" value={form.phone} onChange={e => set('phone', e.target.value)} type="tel" />
        </Field>
      </div>
      <div className="form-grid-2">
        <Field label="Email" htmlFor="em-email">
          <input id="em-email" value={form.email} onChange={e => set('email', e.target.value)} type="email" />
        </Field>
        <Field label="Date of Birth" htmlFor="em-dob">
          <input id="em-dob" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} type="date" style={{ fontSize: '16px', touchAction: 'manipulation' }} />
        </Field>
      </div>
      <div className="form-grid-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
        <Field label="Emergency Contact Name" htmlFor="em-ec-name">
          <input id="em-ec-name" value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} />
        </Field>
        <Field label="Emergency Contact Phone" htmlFor="em-ec-phone">
          <input id="em-ec-phone" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} type="tel" />
        </Field>
      </div>
      <Field label="Notes" htmlFor="em-notes">
        <textarea id="em-notes" value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
      </Field>

      {error && (
        <div style={{ background: 'var(--danger-alt-a10)', border: '1px solid var(--danger)', borderRadius: '4px', padding: '10px 14px', color: 'var(--danger)', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <Button type="submit" loading={saving}>Save Changes</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
