'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'

const PRESETS = [
  { name: 'Monthly', duration_days: 30, price: '' },
  { name: 'Quarterly', duration_days: 90, price: '' },
  { name: 'Half-Yearly', duration_days: 180, price: '' },
  { name: 'Annual', duration_days: 365, price: '' },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function NewPlanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', price: '', duration_days: '' })

  function applyPreset(preset: typeof PRESETS[0]) {
    setForm(f => ({ ...f, name: preset.name, duration_days: String(preset.duration_days) }))
  }

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/plans', {
      method: 'POST',
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
      setError(data.error || 'Failed to create plan')
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="NEW PLAN" subtitle="Create a membership plan type" />
      <div style={{ padding: '28px 32px', maxWidth: '480px' }}>
        {/* Presets */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Quick Presets
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {PRESETS.map(p => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                style={{
                  padding: '6px 14px',
                  border: `1px solid ${form.name === p.name ? 'var(--accent)' : 'var(--border)'}`,
                  background: form.name === p.name ? 'rgba(198,241,53,0.1)' : 'transparent',
                  color: form.name === p.name ? 'var(--accent)' : 'var(--text-secondary)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.15s',
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Field label="Plan Name *">
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Monthly, Custom 45-Day"
              required
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Price (₹) *">
              <input
                value={form.price}
                onChange={e => set('price', e.target.value)}
                placeholder="1500"
                type="number"
                min="0"
                step="1"
                required
              />
            </Field>
            <Field label="Duration (days) *">
              <input
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
            <Button type="submit" loading={loading}>Create Plan</Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
