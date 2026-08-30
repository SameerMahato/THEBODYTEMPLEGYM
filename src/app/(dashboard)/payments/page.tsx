'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Payment } from '@/types'
import { formatDate, formatCurrency, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'

interface PaymentRow extends Omit<Payment, 'staff_user' | 'member'> {
  member: { full_name: string; id: string } | null
  staff_user: { full_name: string } | null
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch recent payments across all members via member API with extended join
    fetch('/api/payments/recent')
      .then(r => r.json())
      .then(d => { setPayments(d ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const totalPayments = payments.filter(p => p.type === 'payment').reduce((s, p) => s + p.amount, 0)
  const totalAdjustments = payments.filter(p => p.type === 'adjustment').reduce((s, p) => s + p.amount, 0)

  return (
    <div>
      <PageHeader
        title="PAYMENTS"
        subtitle="All payment records and adjustments"
      />

      <div style={{ padding: '20px 32px' }}>
        {/* Summary bar */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '14px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Total Collected</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(totalPayments + totalAdjustments)}</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : payments.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No payment records yet. Go to a member&apos;s profile to record the first payment.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Member</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Period</th>
                  <th>Recorded By</th>
                  <th>Notes / Reason</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const isAdj = p.type === 'adjustment'
                  return (
                    <tr key={p.id} style={isAdj ? { background: 'rgba(239,68,68,0.04)' } : {}}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(p.payment_date)}</td>
                      <td>
                        <Link href={`/members/${p.member?.id}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                          {p.member?.full_name ?? '—'}
                        </Link>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 7px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          background: isAdj ? 'rgba(239,68,68,0.15)' : 'rgba(225,29,72,0.12)',
                          color: isAdj ? 'var(--danger)' : 'var(--accent)',
                        }}>
                          {isAdj ? 'Adjustment' : 'Payment'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: isAdj ? 'var(--danger)' : 'var(--text-primary)' }}>
                        {isAdj && p.amount > 0 ? '+' : ''}{formatCurrency(p.amount)}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{PAYMENT_METHOD_LABELS[p.payment_method]}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {p.period_start && p.period_end ? `${formatDate(p.period_start)} – ${formatDate(p.period_end)}` : '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{p.staff_user?.full_name ?? '—'}</td>
                      <td style={{ fontSize: '12px', maxWidth: '200px' }}>
                        {isAdj
                          ? <span style={{ color: 'var(--danger)' }}>{p.reason}</span>
                          : <span style={{ color: 'var(--text-secondary)' }}>{p.notes ?? '—'}</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
