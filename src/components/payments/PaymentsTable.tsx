'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDate, formatCurrency, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import { PAYMENTS_PAGE_SIZE, type PaymentRow, type PaymentListResult } from '@/types'

// Matches the query the server rendered: no type filter, no dates, page 0.
const INITIAL_QUERY_KEY = '|||0'

const TYPE_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Payments', value: 'payment' },
  { label: 'Adjustments', value: 'adjustment' },
]

export default function PaymentsTable({ initial }: { initial: PaymentListResult }) {
  const [data, setData] = useState(initial)
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(0)

  // The server already rendered the default view, so the effect only fetches
  // once the query actually differs from what the current data represents.
  const queryKey = `${typeFilter}|${dateFrom}|${dateTo}|${page}`
  const [loadedKey, setLoadedKey] = useState(INITIAL_QUERY_KEY)

  // Derived, not stored: the table is stale exactly while the requested query
  // differs from the one the current rows came from.
  const loading = queryKey !== loadedKey

  useEffect(() => {
    if (queryKey === loadedKey) return

    const controller = new AbortController()

    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    if (dateFrom)   params.set('from', dateFrom)
    if (dateTo)     params.set('to', dateTo)
    if (page)       params.set('page', String(page))

    fetch(`/api/payments/recent?${params}`, { signal: controller.signal })
      .then(r => {
        if (!r.ok) {
          if (r.status === 401) { window.location.href = '/login'; return null }
          throw new Error('Failed')
        }
        return r.json()
      })
      .then(d => { if (d) { setData(d); setLoadedKey(queryKey) } })
      .catch(err => { if (err.name !== 'AbortError') setLoadedKey(queryKey) })

    return () => controller.abort()
  }, [queryKey, loadedKey, typeFilter, dateFrom, dateTo, page])

  function setFilter(fn: () => void) {
    fn()
    setPage(0)
  }

  const payments: PaymentRow[] = data.payments
  const pageCount = Math.max(1, Math.ceil(data.total / PAYMENTS_PAGE_SIZE))

  return (
    <div style={{ padding: '20px 32px' }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {TYPE_FILTERS.map(f => {
            const active = typeFilter === f.value
            return (
              <button
                key={f.value}
                onClick={() => setFilter(() => setTypeFilter(f.value))}
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
          })}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setFilter(() => setDateFrom(e.target.value))}
            style={{ padding: '7px 10px', fontSize: '16px', maxWidth: '170px', touchAction: 'manipulation' }}
            aria-label="From date"
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>–</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setFilter(() => setDateTo(e.target.value))}
            style={{ padding: '7px 10px', fontSize: '16px', maxWidth: '170px', touchAction: 'manipulation' }}
            aria-label="To date"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => setFilter(() => { setDateFrom(''); setDateTo('') })}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
              aria-label="Clear date filter"
            >×</button>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <SummaryCard label="Net Revenue" value={formatCurrency(data.net_revenue)} color="var(--accent)" />
        <SummaryCard label="Records" value={String(data.total)} color="var(--text-primary)" />
      </div>

      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        overflowX: 'auto',
        opacity: loading ? 0.55 : 1,
        transition: 'opacity 0.15s',
      }}>
        {payments.length === 0 && !loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {!typeFilter && !dateFrom && !dateTo
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

      {pageCount > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            style={pagerStyle(page === 0 || loading)}
          >← Previous</button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Page {page + 1} of {pageCount}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1 || loading}
            style={pagerStyle(page >= pageCount - 1 || loading)}
          >Next →</button>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      padding: '14px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

function pagerStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '7px 14px',
    border: '1px solid var(--border-strong)',
    background: 'transparent',
    color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'var(--font-body)',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}
