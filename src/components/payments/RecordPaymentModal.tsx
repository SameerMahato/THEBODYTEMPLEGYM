'use client'

import { useEffect, useState } from 'react'
import { MembershipPlan } from '@/types'
import { calculateEndDate, formatCurrency } from '@/lib/utils'
import Button from '@/components/ui/Button'

interface Props {
  memberId: string
  memberName: string
  isAdjustment?: boolean
  relatedPaymentId?: string
  onClose: () => void
  onSuccess: () => void
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
        {label}{required && <span style={{ color: 'var(--danger)', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export default function RecordPaymentModal({ memberId, memberName, isAdjustment, relatedPaymentId, onClose, onSuccess }: Props) {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    type: isAdjustment ? 'adjustment' : 'payment',
    amount: '',
    payment_date: today,
    payment_method: 'cash',
    plan_id: '',
    period_start: today,
    notes: '',
    reason: '',
    related_payment_id: relatedPaymentId ?? '',
  })

  useEffect(() => {
    fetch('/api/plans').then(r => r.json()).then(setPlans).catch(() => {})
  }, [])

  function set(key: string, value: string) {
    setForm(f => {
      const next = { ...f, [key]: value }
      // Auto-fill amount from selected plan
      if (key === 'plan_id' && value) {
        const plan = plans.find(p => p.id === value)
        if (plan) next.amount = String(plan.price)
      }
      return next
    })
  }

  const selectedPlan = plans.find(p => p.id === form.plan_id)
  const endDate = selectedPlan && form.period_start
    ? calculateEndDate(form.period_start, selectedPlan.duration_days)
    : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload: Record<string, unknown> = {
      member_id: memberId,
      type: form.type,
      amount: parseFloat(form.amount),
      payment_date: form.payment_date,
      payment_method: form.payment_method,
      period_start: form.period_start || null,
      period_end: endDate || null,
      notes: form.notes || null,
    }

    if (form.type === 'adjustment') {
      payload.related_payment_id = form.related_payment_id
      payload.reason = form.reason
    } else {
      payload.plan_id = form.plan_id || null
    }

    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      onSuccess()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to record payment')
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: '24px',
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
              {isAdjustment ? 'RECORD ADJUSTMENT' : 'RECORD PAYMENT'}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>{memberName}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Type toggle (only if not forced to adjustment) */}
          {!isAdjustment && (
            <Field label="Entry Type">
              <div style={{ display: 'flex', gap: '8px' }}>
                {['payment', 'adjustment'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('type', t)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: `1px solid ${form.type === t ? (t === 'adjustment' ? 'var(--danger)' : 'var(--accent)') : 'var(--border)'}`,
                      background: form.type === t ? (t === 'adjustment' ? 'rgba(239,68,68,0.1)' : 'rgba(225,29,72,0.1)') : 'transparent',
                      color: form.type === t ? (t === 'adjustment' ? 'var(--danger)' : 'var(--accent)') : 'var(--text-secondary)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {form.type === 'adjustment' && (
            <div style={{
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid var(--danger-dim)',
              borderRadius: '4px',
              padding: '12px 14px',
              fontSize: '12px',
              color: 'var(--danger)',
              lineHeight: 1.6,
            }}>
              Adjustments are permanent audit entries. Enter a <strong>negative amount</strong> to reduce (e.g. −₹500 for a partial refund). The original payment is never modified.
            </div>
          )}

          <div className="form-grid-2">
            <Field label={form.type === 'adjustment' ? 'Adjustment Amount (₹) *' : 'Amount (₹) *'} required>
              <input
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                placeholder={form.type === 'adjustment' ? '-500' : '1500'}
                type="number"
                step="1"
                required
              />
            </Field>
            <Field label="Date *" required>
              <input value={form.payment_date} onChange={e => set('payment_date', e.target.value)} type="date" required />
            </Field>
          </div>

          <Field label="Payment Method *" required>
            <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </Field>

          {form.type === 'payment' && (
            <>
              <Field label="Membership Plan">
                <select value={form.plan_id} onChange={e => set('plan_id', e.target.value)}>
                  <option value="">— Select plan —</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCurrency(p.price)}, {p.duration_days}d)
                    </option>
                  ))}
                </select>
              </Field>

              {selectedPlan && (
                <div className="form-grid-2">
                  <Field label="Period Start">
                    <input value={form.period_start} onChange={e => set('period_start', e.target.value)} type="date" />
                  </Field>
                  <Field label="Period End (auto)">
                    <input value={endDate ? new Date(endDate + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''} readOnly style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-strong)' }} />
                  </Field>
                </div>
              )}
            </>
          )}

          {form.type === 'adjustment' && (
            <>
              <Field label="Reference to Original Payment ID *" required>
                <input
                  value={form.related_payment_id}
                  onChange={e => set('related_payment_id', e.target.value)}
                  placeholder="Paste the original payment UUID"
                  required
                />
              </Field>
              <Field label="Reason for Adjustment *" required>
                <textarea
                  value={form.reason}
                  onChange={e => set('reason', e.target.value)}
                  placeholder="e.g. Wrong amount entered — original was ₹1500, should be ₹1200"
                  rows={2}
                  required
                  style={{ resize: 'vertical' }}
                />
              </Field>
            </>
          )}

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Optional note for staff..."
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </Field>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '4px', padding: '10px 14px', color: 'var(--danger)', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
            <Button
              type="submit"
              loading={loading}
              style={form.type === 'adjustment' ? { background: 'var(--danger)', borderColor: 'var(--danger)' } : {}}
            >
              {form.type === 'adjustment' ? 'Record Adjustment' : 'Record Payment'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
