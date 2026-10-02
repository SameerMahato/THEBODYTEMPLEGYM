'use client'

import { useEffect, useRef, useState } from 'react'
import { MembershipPlan } from '@/types'
import { calculateEndDate, formatCurrency } from '@/lib/utils'
import Button from '@/components/ui/Button'

interface Props {
  memberId: string
  memberName: string
  plans: MembershipPlan[]
  isAdjustment?: boolean
  relatedPaymentId?: string
  renewalStartDate?: string   // pre-fills period_start for renewals
  onClose: () => void
  onSuccess: () => void
}

function Field({ label, required, htmlFor, children }: { label: string; required?: boolean; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label htmlFor={htmlFor} style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
        {label}{required && <span style={{ color: 'var(--danger)', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export default function RecordPaymentModal({ memberId, memberName, plans, isAdjustment, relatedPaymentId, renewalStartDate, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  const today = new Date().toISOString().split('T')[0]

  const isRenewal = !!renewalStartDate

  const [form, setForm] = useState({
    type: isAdjustment ? 'adjustment' : 'payment',
    amount: '',
    payment_date: today,
    payment_method: 'cash',
    plan_id: '',
    period_start: renewalStartDate ?? today,
    notes: '',
    reason: '',
    related_payment_id: relatedPaymentId ?? '',
  })

  useEffect(() => {
    const el = modalRef.current
    if (!el) return
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    function trap(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }

    first?.focus()
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [onClose])

  function set(key: string, value: string) {
    setForm(f => {
      const next = { ...f, [key]: value }
      if (key === 'plan_id' && value) {
        const plan = plans.find(p => p.id === value)
        if (plan) next.amount = String(plan.price)
      }
      return next
    })
  }

  function switchType(t: string) {
    setForm(f => ({
      ...f,
      type: t,
      amount: t === 'adjustment' ? '' : f.amount,
    }))
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
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
              {isAdjustment ? 'RECORD ADJUSTMENT' : isRenewal ? 'RENEW PLAN' : 'RECORD PAYMENT'}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>{memberName}</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Renewal banner */}
          {isRenewal && (
            <div style={{
              background: 'rgba(225,29,72,0.07)',
              border: '1px solid rgba(225,29,72,0.25)',
              borderRadius: '4px',
              padding: '10px 14px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Renewal</span> — new plan starts on <strong style={{ color: 'var(--text-primary)' }}>{renewalStartDate}</strong>, continuing from the current subscription end date.
            </div>
          )}

          {/* Type toggle */}
          {!isAdjustment && !isRenewal && (
            <Field label="Entry Type" htmlFor="payment-type">
              <div style={{ display: 'flex', gap: '8px' }}>
                {['payment', 'adjustment'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => switchType(t)}
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
            <Field label={form.type === 'adjustment' ? 'Adjustment Amount (₹) *' : 'Amount (₹) *'} required htmlFor="payment-amount">
              <input
                id="payment-amount"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                placeholder={form.type === 'adjustment' ? '-500' : '1500'}
                type="number"
                step="1"
                required
              />
            </Field>
            <Field label="Date *" required htmlFor="payment-date">
              <input id="payment-date" value={form.payment_date} onChange={e => set('payment_date', e.target.value)} type="date" required />
            </Field>
          </div>

          <Field label="Payment Method *" required htmlFor="payment-method">
            <select id="payment-method" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </Field>

          {form.type === 'payment' && (
            <>
              <Field label="Membership Plan" htmlFor="payment-plan">
                <select id="payment-plan" value={form.plan_id} onChange={e => set('plan_id', e.target.value)}>
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
                  <Field label="Period Start" htmlFor="period-start">
                    <input id="period-start" value={form.period_start} onChange={e => set('period_start', e.target.value)} type="date" />
                  </Field>
                  <Field label="Period End (auto)" htmlFor="period-end">
                    <input id="period-end" value={endDate ? new Date(endDate + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''} readOnly style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-strong)' }} />
                  </Field>
                </div>
              )}
            </>
          )}

          {form.type === 'adjustment' && (
            <>
              <Field label="Reference to Original Payment ID *" required htmlFor="related-payment">
                <input
                  id="related-payment"
                  value={form.related_payment_id}
                  onChange={e => set('related_payment_id', e.target.value)}
                  placeholder="Paste the original payment UUID"
                  required
                />
              </Field>
              <Field label="Reason for Adjustment *" required htmlFor="adjustment-reason">
                <textarea
                  id="adjustment-reason"
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

          <Field label="Notes" htmlFor="payment-notes">
            <textarea
              id="payment-notes"
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
