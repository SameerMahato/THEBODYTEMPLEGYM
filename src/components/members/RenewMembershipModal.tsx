'use client'

import { useEffect, useRef, useState } from 'react'
import { MembershipPlan } from '@/types'
import { appConfig } from '@/config/app'
import { formatCurrency, formatDate, addDaysISO, gymToday } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

export interface RenewTarget {
  id: string
  full_name: string
  /** The plan the expired subscription was on, if any. */
  previousPlan: { id: string; name: string; price: number; duration_days: number } | null
  previousExpiry: string | null
}

type Step = 'plan' | 'payment' | 'confirm'

// 'other' is not offered for a renewal — it is always a real tender.
const PAYMENT_METHODS = appConfig.paymentMethods.filter(m => m.value !== 'other')

/** Methods where a transaction reference is worth prompting for. */
const REFERENCE_METHODS = new Set(['upi', 'card', 'bank_transfer'])

function durationLabel(days: number): string {
  if (days % 365 === 0) {
    const y = days / 365
    return `${y} Year${y !== 1 ? 's' : ''}`
  }
  if (days % 30 === 0) {
    const m = days / 30
    return `${m} Month${m !== 1 ? 's' : ''}`
  }
  return `${days} Days`
}

export default function RenewMembershipModal({
  member, onClose, onSuccess,
}: {
  member: RenewTarget
  onClose: () => void
  onSuccess: (message: string) => void
}) {
  const [step, setStep] = useState<Step>('plan')
  const [plans, setPlans] = useState<MembershipPlan[] | null>(null)
  const [plansFailed, setPlansFailed] = useState(false)

  // Default to the previous plan when there is one — the common case is
  // renewing like for like.
  const [selectedPlanId, setSelectedPlanId] = useState(member.previousPlan?.id ?? '')
  const [choosingNew, setChoosingNew] = useState(!member.previousPlan)

  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [reference, setReference] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Guards against a double submit landing before `submitting` has re-rendered.
  const submittedRef = useRef(false)

  const startDate = gymToday()

  useEffect(() => {
    let cancelled = false
    fetch('/api/plans')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('failed'))))
      .then(d => { if (!cancelled) setPlans(d) })
      .catch(() => { if (!cancelled) { setPlans([]); setPlansFailed(true) } })
    return () => { cancelled = true }
  }, [])


  // The previous plan can have been deactivated since the member was on it;
  // renewing onto an inactive plan would be rejected by the database.
  const previousPlanStillActive =
    !!member.previousPlan && !!plans?.some(p => p.id === member.previousPlan!.id)

  // Resolved against the *active* plan list only. A pre-selected previous plan
  // that has since been deactivated therefore resolves to null, which disables
  // Continue — rather than letting the owner submit a renewal the database
  // would reject with "Plan not found or inactive".
  const selectedPlan = plans?.find(p => p.id === selectedPlanId) ?? null

  // Derived rather than synced into state: once the plans arrive and the
  // previous plan turns out to be gone, choosing a new one is the only path.
  const showPlanGrid = choosingNew || (plans !== null && !previousPlanStillActive)

  const expiryDate = selectedPlan ? addDaysISO(startDate, selectedPlan.duration_days) : null
  const noPlansAvailable = plans !== null && plans.length === 0

  async function handleConfirm() {
    if (submittedRef.current || !selectedPlan) return
    submittedRef.current = true
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: member.id,
          type: 'payment',
          amount: selectedPlan.price,
          payment_date: startDate,
          payment_method: paymentMethod,
          period_start: startDate,
          plan_id: selectedPlan.id,
          reference: reference.trim() || null,
        }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Unable to renew membership. Please try again.')
        return
      }

      onSuccess(
        `${member.full_name}'s membership has been renewed until ${formatDate(expiryDate!)}.`
      )
    } catch {
      setError('Unable to renew membership. Please try again.')
    } finally {
      // Only re-arm on failure; on success the modal unmounts.
      submittedRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="RENEW MEMBERSHIP"
      subtitle={`Step ${step === 'plan' ? 1 : step === 'payment' ? 2 : 3} of 3`}
      width="md"
      onClose={onClose}
      closeDisabled={submitting}
      banner={
        <div style={{
          padding: '14px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--danger-a04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                {member.full_name}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '3px' }}>
                {member.previousPlan
                  ? `${member.previousPlan.name} · ${formatCurrency(member.previousPlan.price)}`
                  : 'No previous plan'}
                {member.previousExpiry && ` · Expired ${formatDate(member.previousExpiry)}`}
              </div>
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
              borderRadius: 'var(--badge-radius)', fontSize: '11px', fontWeight: 700,
              letterSpacing: '0.07em', textTransform: 'uppercase',
              color: '#fff', background: 'var(--danger-a15)',
              border: '1px solid var(--danger-a40)', whiteSpace: 'nowrap',
            }}>Expired</span>
          </div>
        </div>
      }
      footer={
        <>
          {step === 'plan' && (
            <>
              <Button
                onClick={() => { setError(''); setStep('payment') }}
                disabled={!selectedPlan || noPlansAvailable}
              >
                Continue{selectedPlan ? ` with ${selectedPlan.name}` : ''}
              </Button>
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
            </>
          )}
          {step === 'payment' && (
            <>
              <Button onClick={() => { setError(''); setStep('confirm') }}>Review</Button>
              <Button variant="secondary" onClick={() => setStep('plan')}>← Back</Button>
            </>
          )}
          {step === 'confirm' && (
            <>
              <Button onClick={handleConfirm} loading={submitting} disabled={submitting}>
                Confirm Renewal
              </Button>
              <Button variant="secondary" onClick={() => setStep('payment')} disabled={submitting}>
                ← Back
              </Button>
            </>
          )}
        </>
      }
    >
      {step === 'plan' && (
        <PlanStep
          plans={plans}
          plansFailed={plansFailed}
          noPlansAvailable={noPlansAvailable}
          previousPlan={member.previousPlan}
          previousPlanStillActive={previousPlanStillActive}
          showPlanGrid={showPlanGrid}
          setChoosingNew={setChoosingNew}
          selectedPlanId={selectedPlanId}
          setSelectedPlanId={setSelectedPlanId}
        />
      )}

      {step === 'payment' && selectedPlan && (
        <PaymentStep
          member={member}
          selectedPlan={selectedPlan}
          startDate={startDate}
          expiryDate={expiryDate!}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          reference={reference}
          setReference={setReference}
        />
      )}

      {step === 'confirm' && selectedPlan && (
        <ConfirmStep
          member={member}
          selectedPlan={selectedPlan}
          startDate={startDate}
          expiryDate={expiryDate!}
          paymentMethod={paymentMethod}
          reference={reference}
        />
      )}

      {error && (
        <div style={{
          marginTop: '18px',
          background: 'var(--danger-alt-a10)', border: '1px solid var(--danger)',
          borderRadius: '4px', padding: '10px 14px',
          color: 'var(--danger)', fontSize: '13px',
        }}>
          {error}
        </div>
      )}
    </Modal>
  )
}

/* ── Step 1 — choose the plan ─────────────────────────────────────────── */

function PlanStep({
  plans, plansFailed, noPlansAvailable, previousPlan, previousPlanStillActive,
  showPlanGrid, setChoosingNew, selectedPlanId, setSelectedPlanId,
}: {
  plans: MembershipPlan[] | null
  plansFailed: boolean
  noPlansAvailable: boolean
  previousPlan: RenewTarget['previousPlan']
  previousPlanStillActive: boolean
  showPlanGrid: boolean
  setChoosingNew: (v: boolean) => void
  selectedPlanId: string
  setSelectedPlanId: (v: string) => void
}) {
  if (plans === null) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading plans…</div>
  }

  if (noPlansAvailable) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 8px' }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700,
          color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '0.04em',
        }}>
          {plansFailed ? 'COULD NOT LOAD PLANS' : 'NO PLANS AVAILABLE'}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
          {plansFailed
            ? 'Close this dialog and try again.'
            : 'Create a membership plan before renewing a membership.'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Option 1 — previous plan */}
      <OptionCard
        selected={!showPlanGrid}
        disabled={!previousPlan || !previousPlanStillActive}
        onSelect={() => {
          setChoosingNew(false)
          if (previousPlan) setSelectedPlanId(previousPlan.id)
        }}
        title="Renew Previous Plan"
        subtitle="Continue with the member's previous membership plan."
      >
        {!previousPlan ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>
            No previous membership plan found.
          </div>
        ) : !previousPlanStillActive ? (
          <div style={{ color: 'var(--warning)', fontSize: '12.5px' }}>
            {previousPlan.name} is no longer offered — choose a new plan below.
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{previousPlan.name}</strong>
            {' · '}{durationLabel(previousPlan.duration_days)}
            {' · '}{formatCurrency(previousPlan.price)}
          </div>
        )}
      </OptionCard>

      {/* Option 2 — a different plan */}
      <OptionCard
        selected={showPlanGrid}
        onSelect={() => {
          // Already on this option — clicking the surrounding card again must
          // not reset a plan the owner has just picked.
          if (showPlanGrid) return
          setChoosingNew(true)
          setSelectedPlanId('')
        }}
        title="Choose New Plan"
        subtitle="Select a different membership plan for this member."
      >
        {showPlanGrid && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(150px, 100%), 1fr))',
            gap: '10px',
            marginTop: '4px',
          }}>
            {plans.map(p => {
              const active = selectedPlanId === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  // Without this the click reaches the surrounding OptionCard,
                  // whose onSelect clears the selection again.
                  onClick={e => { e.stopPropagation(); setSelectedPlanId(p.id) }}
                  aria-pressed={active}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border-strong)'}`,
                    background: active ? 'var(--accent-a10)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    fontWeight: 600, fontSize: '13px',
                    color: active ? 'var(--accent)' : 'var(--text-primary)',
                  }}>{p.name}</div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800,
                    color: active ? 'var(--accent)' : 'var(--text-primary)',
                    lineHeight: 1.2, marginTop: '2px',
                  }}>{formatCurrency(p.price)}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {durationLabel(p.duration_days)}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </OptionCard>
    </div>
  )
}

function OptionCard({
  selected, disabled, onSelect, title, subtitle, children,
}: {
  selected: boolean
  disabled?: boolean
  onSelect: () => void
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div
      onClick={() => { if (!disabled) onSelect() }}
      style={{
        border: `1px solid ${selected && !disabled ? 'var(--accent)' : 'var(--border)'}`,
        background: selected && !disabled ? 'var(--accent-a06)' : 'transparent',
        borderRadius: '6px',
        padding: '16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <span style={{
          width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
          border: `2px solid ${selected && !disabled ? 'var(--accent)' : 'var(--border-strong)'}`,
          background: selected && !disabled
            ? 'radial-gradient(circle, var(--accent) 0 3px, transparent 4px)'
            : 'transparent',
        }} />
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700,
          letterSpacing: '0.04em', color: 'var(--text-primary)',
        }}>{title}</span>
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '12.5px', marginBottom: '10px', paddingLeft: '24px' }}>
        {subtitle}
      </div>
      <div style={{ paddingLeft: '24px' }}>{children}</div>
    </div>
  )
}

/* ── Step 2 — payment ─────────────────────────────────────────────────── */

function PaymentStep({
  member, selectedPlan, startDate, expiryDate,
  paymentMethod, setPaymentMethod, reference, setReference,
}: {
  member: RenewTarget
  selectedPlan: { name: string; price: number; duration_days: number }
  startDate: string
  expiryDate: string
  paymentMethod: string
  setPaymentMethod: (v: string) => void
  reference: string
  setReference: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <SummaryGrid rows={[
        ['Previous Plan', member.previousPlan?.name ?? '—'],
        ['New Plan', selectedPlan.name],
        ['Duration', durationLabel(selectedPlan.duration_days)],
        ['Amount', formatCurrency(selectedPlan.price)],
        ['New Membership Start', formatDate(startDate)],
        ['New Expiry Date', formatDate(expiryDate)],
      ]} />

      <div style={{
        fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6,
        background: 'var(--bg-elevated)', borderRadius: '4px', padding: '10px 12px',
      }}>
        The membership has already expired, so the new period starts today
        rather than from the old expiry date. No overlapping period is created.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{
          fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--text-secondary)',
        }}>Payment Method</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {PAYMENT_METHODS.map(m => {
            const active = paymentMethod === m.value
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setPaymentMethod(m.value)}
                aria-pressed={active}
                style={{
                  flex: '1 1 110px',
                  padding: '10px',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? 'var(--accent-a10)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >{m.label}</button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor="renew-reference"
          style={{
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--text-secondary)',
          }}
        >
          Transaction ID / Reference <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)' }}>(optional)</span>
        </label>
        <input
          id="renew-reference"
          value={reference}
          onChange={e => setReference(e.target.value)}
          placeholder={REFERENCE_METHODS.has(paymentMethod) ? 'e.g. UPI ref 4829301193' : 'Receipt or reference number'}
          maxLength={100}
          style={{ fontSize: '16px' }}
        />
      </div>
    </div>
  )
}

/* ── Step 3 — confirm ─────────────────────────────────────────────────── */

function ConfirmStep({
  member, selectedPlan, startDate, expiryDate, paymentMethod, reference,
}: {
  member: RenewTarget
  selectedPlan: { name: string; price: number; duration_days: number }
  startDate: string
  expiryDate: string
  paymentMethod: string
  reference: string
}) {
  const methodLabel = PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label ?? paymentMethod

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700,
        letterSpacing: '0.05em', color: 'var(--text-primary)',
      }}>
        CONFIRM MEMBERSHIP RENEWAL
      </div>

      <SummaryGrid rows={[
        ['Member', member.full_name],
        ['Previous Plan', member.previousPlan
          ? `${member.previousPlan.name} — ${durationLabel(member.previousPlan.duration_days)}`
          : '—'],
        ['Renewal Plan', `${selectedPlan.name} — ${durationLabel(selectedPlan.duration_days)}`],
        ['Start Date', formatDate(startDate)],
        ['Expiry Date', formatDate(expiryDate)],
        ['Amount', formatCurrency(selectedPlan.price)],
        ['Payment', reference.trim() ? `${methodLabel} · ${reference.trim()}` : methodLabel],
      ]} emphasiseLast />
    </div>
  )
}

function SummaryGrid({ rows, emphasiseLast }: { rows: [string, string][]; emphasiseLast?: boolean }) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '6px',
      overflow: 'hidden',
    }}>
      {rows.map(([label, value], i) => (
        <div
          key={label}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '16px', padding: '10px 14px',
            borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--border)',
            background: emphasiseLast && i === rows.length - 1 ? 'var(--bg-elevated)' : 'transparent',
          }}
        >
          <span style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>{label}</span>
          <span style={{
            color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600,
            textAlign: 'right',
          }}>{value}</span>
        </div>
      ))}
    </div>
  )
}
