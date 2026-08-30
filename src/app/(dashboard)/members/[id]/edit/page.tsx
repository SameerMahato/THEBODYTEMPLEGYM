'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Member } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'

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

export default function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
  })

  useEffect(() => {
    setLoading(true)
    fetch(`/api/members/${id}`)
      .then(r => r.json())
      .then((m: Member) => {
        setForm({
          full_name: m.full_name ?? '',
          phone: m.phone ?? '',
          email: m.email ?? '',
          date_of_birth: m.date_of_birth ?? '',
          emergency_contact_name: m.emergency_contact_name ?? '',
          emergency_contact_phone: m.emergency_contact_phone ?? '',
          notes: m.notes ?? '',
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  function set(key: string, value: string) {
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
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to update member')
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: '40px 32px', color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div>
      <PageHeader title="EDIT MEMBER" />
      <div style={{ padding: '28px 32px', maxWidth: '640px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Full Name *">
              <input value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={e => set('phone', e.target.value)} type="tel" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Email">
              <input value={form.email} onChange={e => set('email', e.target.value)} type="email" />
            </Field>
            <Field label="Date of Birth">
              <input value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} type="date" />
            </Field>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Emergency Contact Name">
              <input value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} />
            </Field>
            <Field label="Emergency Contact Phone">
              <input value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} type="tel" />
            </Field>
          </div>
          <Field label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
          </Field>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '4px', padding: '10px 14px', color: 'var(--danger)', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button type="submit" loading={saving}>Save Changes</Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
