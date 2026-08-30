'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label htmlFor={htmlFor} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', price: '', duration_days: '' })

  useEffect(() => {
    fetch(`/api/plans/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setForm({ name: d.name, price: String(d.price), duration_days: String(d.duration_days) })
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

    const res = await fetch(`/api/plans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        price: parseFloat(form.price),
        duration_days: parseInt(form.duration_days),
      }),
    })

    if (res.ok) {
      router.push('/plans')
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to update plan')
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: '40px 32px', color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div>
      <PageHeader title="EDIT PLAN" subtitle="Update membership plan details" />
      <div style={{ padding: '28px 32px', maxWidth: '480px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Field label="Plan Name *" htmlFor="plan-name">
            <input
              id="plan-name"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Monthly"
              required
            />
          </Field>

          <div className="form-grid-2">
            <Field label="Price (₹) *" htmlFor="plan-price">
              <input
                id="plan-price"
                value={form.price}
                onChange={e => set('price', e.target.value)}
                placeholder="1500"
                type="number"
                min="0"
                step="1"
                required
              />
            </Field>
            <Field label="Duration (days) *" htmlFor="plan-duration">
              <input
                id="plan-duration"
                value={form.duration_days}
                onChange={e => set('duration_days', e.target.value)}
                placeholder="30"
                type="number"
                min="1"
                required
              />
            </Field>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '4px', padding: '10px 14px', color: 'var(--danger)', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button type="submit" loading={saving}>Save Changes</Button>
            <Button type="button" variant="secondary" onClick={() => router.push('/plans')}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
