'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Payment } from '@/types'
import { formatDate, formatCurrency, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'

interface PaymentRow extends Omit<Payment, 'staff_user' | 'member'> {
  member: { full_name: string; id: string } | null
  staff_user: { full_name: string } | null
}

const TYPE_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Payments', value: 'payment' },
  { label: 'Adjustments', value: 'adjustment' },
]

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // M-2: Pass active filters to the API so server filters before the 500-record cap
  useEffect(() => {
    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    if (dateFrom)   params.set('from', dateFrom)
    if (dateTo)     params.set('to', dateTo)
    const url = '/api/payments/recent' + (params.toString() ? '?' + params.toString() : '')

    setLoading(true)
    fetch(url)
      .then(r => {
        if (!r.ok) {
          if (r.status === 401) { window.location.href = '/login'; return null }
          throw new Error('Failed')
        }
        return r.json()
      })
      .then(d => { if (d) { setPayments(d ?? []); setLoading(false) } })
      .catch(() => setLoading(false))
  }, [typeFilter, dateFrom, dateTo])

  const filtered = useMemo(() => {
    return payments.filter(p => {
      if (typeFilter && p.type !== typeFilter) return false
      if (dateFrom && p.payment_date < dateFrom) return false
      if (dateTo && p.payment_date > dateTo) return false
      return true
    })
  }, [payments, typeFilter, dateFrom, dateTo])

  const netRevenue = filtered.reduce((s, p) => s + p.amount, 0)

  function FilterBtn({ f }: { f: typeof TYPE_FILTERS[number] }) {
    const active = typeFilter === f.value
    return (
      <button
        onClick={() => setTypeFilter(f.value)}
        style={{
          padding: '8px 14px',
          border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
          background: active ? 'rgba(225,29,72,0.1)' : 'transparent',
          color: active ? 'var(--accent)' : 'var(--text-secondary)',
          borderRadius: '4px',
          fontSize: '13px',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          fontWeight: active ? 600 : 400,
          transition: 'all 0.15s',
        }}
      >
        {f.label}
      </button>
    )
  }

  return (
    <div>
      <PageHeader
        title="PAYMENTS"
        subtitle="All payment records and adjustments"
      />

      <div style={{ padding: '20px 32px' }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {TYPE_FILTERS.map(f => <FilterBtn key={f.value} f={f} />)}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{ padding: '7px 10px', fontSize: '13px', maxWidth: '160px' }}
              aria-label="From date"
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>–</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{ padding: '7px 10px', fontSize: '13px', maxWidth: '160px' }}
              aria-label="To date"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo('') }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
                aria-label="Clear date filter"
              >×</button>
            )}
          </div>
        </div>

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
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Net Revenue</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(netRevenue)}</div>
          </div>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '14px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Records</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{filtered.length}</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              {payments.length === 0
                ? "No payment records yet. Go to a member's profile to record the first payment."
                : 'No records match the current filters.'}
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
                {filtered.map(p => {
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
